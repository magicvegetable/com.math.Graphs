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
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw';

const Signals = imports.signals;

import { GraphColorButton, MathGraph, NamedColor } from './mirror.js';

const random_n = n => Math.trunc(Math.random() * n);

const SYMBOLS_TO_REPLACE = {
    'atan': 'Math.atan',
    'tan': 'Math.tan',
    'acosh': 'Math.acosh',
    'asinh': 'Math.asinh',
    'acos': 'Math.acos',
    'asin': 'Math.asin',
    'sinh': 'Math.sinh',
    'cosh': 'Math.cosh',
    'sin': 'Math.sin',
    'cos': 'Math.cos',
    '^': '**',
    'ln': 'Math.log',
    'log2': 'Math.log2',
    'log': 'Math.log10',
    'sqrt': 'Math.sqrt',
    'cbrt': 'Math.cbrt',
    'e': 'Math.E'
};

const parse = (str) => {
    const finded = {};

    // find
    for (const symbol of Object.keys(SYMBOLS_TO_REPLACE)) {
        let id = str.indexOf(symbol);
        if (id !== -1) {
            finded[symbol] = new Set([]);
            while (id !== -1) {
                finded[symbol].add(id);
                id = str.indexOf(symbol, id + 1);
            }
        }
    }

    // filter
    for (const [s, ids] of Object.entries(finded)) {
        for (const [ns, nids] of Object.entries(finded)) {
            if (ns.includes(s) && ns.length > s.length) {
                const dif = ns.indexOf(s);
                for (const id of ids) {
                    for (const nid of nids) {
                        if (nid === id - dif) finded[s].delete(id);
                    }
                }
            }
        }
    }

    // replace
    let parsed_str = '';
    for (let i = 0; i < str.length; i++) {
        let replaced = false;
        for (const [s, ids] of Object.entries(finded)) {
            for (const id of ids) {
                if (i === id) {
                    parsed_str += SYMBOLS_TO_REPLACE[s];
                    i += s.length - 1;
                    finded[s].delete(i);
                    replaced = true;
                    break;
                }
            }
            if (replaced) break;
        }
        if (!replaced) parsed_str += str[i];
    }
    return parsed_str;
};

const GraphColorPickButton = GObject.registerClass({
    GTypeName: 'GraphColorPickButton',
    Template: 'resource:///oop/my/graphs/graph-color-pick-button.ui',
    InternalChildren: ['colors']
}, class GraphColorPickButton extends Gtk.MenuButton {
    constructor() {
        super();
        const children = this._colors.observe_children();
        const amount = children.get_n_items();
        const n = random_n(amount); 
        const child = children.get_item(n);
        const copy_child = new GraphColorButton(child.color);
        this.child = copy_child;

        for (let i = 0; i < amount; i++) {
            const child = children.get_item(i);
            child.choosed.connect('activate', (_choosed, color) => {
                this.child.color = color;
                this.child.queue_draw();
                if (this.graph) {
                    this.graph.color = new NamedColor(color);
                    this.mirror.redraw();
                }
            });
        }
    }

    graph = undefined;
    mirror = undefined;

    connect_mirror(mirror) { this.mirror = mirror; }

    connect_graph(graph) {
        this.graph = graph;
        graph.color = new NamedColor(this.child.color);
    }
});

const Formula = GObject.registerClass({
    GTypeName: 'Formula',
    Template: 'resource:///oop/my/graphs/formula.ui',
    InternalChildren: ['delete', 'label', 'color']
}, class Formula extends Gtk.Box {
    constructor(mirror) {
        super();
        this.mirror = mirror;

        const key_controller = new Gtk.EventControllerKey();
        key_controller.connect('key-released', () => {
            // console.log('I am pressed');
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
            console.error('OOPSIE WOOPSIE!!! Uwu we made a fucky wucky...');
        }
    }
});

export const Sidebar = GObject.registerClass({
    GTypeName: 'Sidebar',
    Template: 'resource:///oop/my/graphs/sidebar.ui',
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
