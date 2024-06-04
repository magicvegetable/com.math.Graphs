/* window.js
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
import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import { Sidebar } from './sidebar.js';
import { Area } from './area.js';

export const GraphsWindow = GObject.registerClass({
    GTypeName: 'GraphsWindow',
    Template: 'resource:///com/math/Graphs/window.ui',
    InternalChildren: ['sidebar-container', 'add-formula', 'area']
}, class GraphsWindow extends Adw.ApplicationWindow {
    constructor(application) {
        super({ application });

        const mirror = this._area.mirror;
        const sidebar = new Sidebar();
        sidebar.connect_mirror(mirror);

        this._sidebar_container.set_child(sidebar);

        const show_grid = new Gio.SimpleAction({
            name: 'show-grid',
            state: GLib.Variant.new_boolean(true),
        });
        show_grid.connect('activate', action => {
            const nstate = !mirror.draw_grid;
            mirror.draw_grid = nstate;
            mirror.redraw();
            show_grid.state = GLib.Variant.new_boolean(nstate);
        });
        this.add_action(show_grid);
        application.set_accels_for_action('win.show-grid', ['<Control>g']);

        const show_marks = new Gio.SimpleAction({
            name: 'show-marks',
            state: GLib.Variant.new_boolean(true),
        });
        show_marks.connect('activate', action => {
            const nstate = !mirror.draw_marks;
            mirror.draw_marks = nstate;
            mirror.redraw();
            show_marks.state = GLib.Variant.new_boolean(nstate);
        });
        this.add_action(show_marks);
        application.set_accels_for_action('win.show-marks', ['<Control>m']);

        const show_axes = new Gio.SimpleAction({
            name: 'show-axes',
            state: GLib.Variant.new_boolean(true),
        });
        show_axes.connect('activate', action => {
            const nstate = !mirror.draw_axes;
            mirror.draw_axes = nstate;
            mirror.redraw();
            show_axes.state = GLib.Variant.new_boolean(nstate);
        });
        this.add_action(show_axes);
        application.set_accels_for_action('win.show-axes', ['<Control>a']);

        this._add_formula.connect('clicked', () => sidebar.add_formula());
    }
});

