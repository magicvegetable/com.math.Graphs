/* sidebar.js
 *
 * Copyright 2023 sdf
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import { CustomColorDialog } from './custom-color-dialog.js';
import { MathGraph } from './mirror.js';
import { GraphColorArea, GraphColorButton } from './graph-color-button.js';
import { custom_colors } from './style.js';
import { parse } from './parse-formula.js';

const Signals = imports.signals;

const random_n = n => Math.trunc(Math.random() * n);

const GraphColorPickButton = GObject.registerClass({
    GTypeName: 'GraphColorPickButton',
    Template: 'resource:///com/math/Graphs/graph-color-pick-button.ui',
    InternalChildren: ['colors', 'custom-color', 'popover', 'custom-colors']
}, class GraphColorPickButton extends Gtk.MenuButton {
    constructor() {
        super();
        const children = this._colors.observe_children();
        const amount = children.get_n_items();
        const n = random_n(amount); 
        const nchild = children.get_item(n);
        nchild.choosed.emit('true');
        this.remove_pcheck = () => { nchild.choosed.emit('false'); }
            
        const copy_child = new GraphColorArea(nchild.color);
        this.child = copy_child;

        for (let i = 0; i < amount; i++) {
            const child = children.get_item(i);
            this.connect_graph_button(child);
        }

        for (const color of custom_colors() ?? []) {
            this.add_custom_color(color);
        }

        this._popover.sig_ = {};
        Signals.addSignalMethods(this._popover.sig_);
        this._popover.sig_.connect('new-custom-color', (_popover, custom_color) => {
            if (this.color_in_box(custom_color)) return;

            for (const pick_button of GraphColorPickButton.all) {
                const button = pick_button.add_custom_color(custom_color);
                if (pick_button === this) pick_button.update_color(button);
            }
        });

        this._custom_color.connect('clicked', () => {
            this._popover.visible = false;
            const dialog = new CustomColorDialog(this.#get_window(), this._popover);
            dialog.present();
        });

        GraphColorPickButton.all.add(this);
        this.connect('unmap', () => {
            GraphColorPickButton.all.delete(this);
        });
    }

    color_in_box(color) {
        const children = this._custom_colors.observe_children();
        for (let i = 0; i < children.get_n_items(); i++) {
            const child = children.get_item(i);
            if (child.color === color) return true;
        }

        return false;
    }

    update_color(button) {
        this.remove_pcheck();
        button.choosed.emit('true');
        this.remove_pcheck = () => { button.choosed.emit('false'); }

        this.child.color = button.color;
        this.child.queue_draw();
        if (this.graph) {
            this.graph.color = button.color;
            this.mirror.redraw();
        }
    }

    add_custom_color(color) {
        const children = this._custom_colors.observe_children();
        if (children.get_n_items() > 4)
            this._custom_colors.remove(children.get_item(4));

        const button = new GraphColorButton(color);
        this._custom_colors.prepend(button);
        this.connect_graph_button(button);
        return button;
    }

    connect_graph_button(button) {
        button.connect('clicked', (_button) => {
            this.remove_pcheck();
            button.choosed.emit('true');
            this.remove_pcheck = () => { button.choosed.emit('false'); }

            this.child.color = button.color;
            this.child.queue_draw();
            if (this.graph) {
                this.graph.color = button.color;
                this.mirror.redraw();
            }
        });
    }

    #get_window() {
        let parent = this.parent;
        while (!(parent instanceof Gtk.Window))
            parent = parent.parent;
        return parent;
    }

    remove_pcheck = () => {}
    graph = undefined;
    mirror = undefined;

    connect_mirror(mirror) { this.mirror = mirror; }

    connect_graph(graph) {
        this.graph = graph;
        graph.color = this.child.color;
    }

    static all = new Set([]);
});

const Formula = GObject.registerClass({
    GTypeName: 'Formula',
    Template: 'resource:///com/math/Graphs/formula.ui',
    InternalChildren: ['delete', 'label', 'color']
}, class Formula extends Gtk.Box {
    constructor(mirror) {
        super();
        this.mirror = mirror;

        const key_controller = new Gtk.EventControllerKey();
        key_controller.connect('key-released', () => {
            this.parse();
        });
        this.add_controller(key_controller);

        this.graph = new MathGraph({
            math_fn: (x) => NaN,
        });
        this._color.connect_mirror(this.mirror);
        this._color.connect_graph(this.graph);

        this.mirror.add_graph(this.graph);
    }

    parse() {
        const fn_str = parse(this._label.text
            .trim().replace(/y *=/, ''));

        try {
            const fn = new Function('x', `return ${fn_str}`);
            const data = fn(0);
            if (typeof(data) === 'number') this.graph.math_fn = fn;
            this.mirror.redraw();
        } catch(e) {
            console.error('OOPSIE WOOPSIE!! Uwu we made a fucky wucky...');
        }
    }
});

export const Sidebar = GObject.registerClass({
    GTypeName: 'Sidebar',
    Template: 'resource:///com/math/Graphs/sidebar.ui',
    InternalChildren: ['formulas']
}, class Sidebar extends Gtk.ScrolledWindow {
    add_formula() {
        const formula = new Formula(this.mirror);
        const id = formula._delete.connect('clicked', () => {
            formula._delete.disconnect(id);
            this._formulas.remove(formula);
            this.mirror.delete_graph(formula.graph);
            this.mirror.redraw();
        });

        this._formulas.append(formula);
    }

    mirror = undefined;

    connect_mirror(mirror) {
        this.mirror = mirror;
        this.add_formula();
    }
});

