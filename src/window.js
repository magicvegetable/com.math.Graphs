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

import { Sidebar } from './sidebar.js';
import { Area } from './area.js';

export const GraphsWindow = GObject.registerClass({
    GTypeName: 'GraphsWindow',
    Template: 'resource:///oop/my/graphs/window.ui',
    InternalChildren: ['sidebar-container', 'add-formula', 'area']
}, class GraphsWindow extends Adw.ApplicationWindow {
    constructor(application) {
        super({ application });
        
        const sidebar = new Sidebar();
        sidebar.connect_mirror(this._area.mirror);

        this._sidebar_container.set_child(sidebar);

        this._add_formula.connect('clicked', () => sidebar.add_formula())
    }
});
