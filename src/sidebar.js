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
import Adw from 'gi://Adw';

const Drag = GObject.registerClass({
    GTypeName: 'Drag',
}, class Drag extends GObject.Object {
    constructor({ sidebar, window }) {
        super();
        this.min = this.sidebar.get_width();
        this.sidebar = sidebar;
        this.window = window;

        const drag = new Gtk.GestureDrag();
        drag.connect('drag-update', (undefined, x) => this.handle(x));
        drag.connect('drag-end', (undefined, x) => this.handle(x));
        sidebar._resize.add_controller(drag);
    }

    handle(x) {
        const width = this.sidebar.get_width() + x;
        if (width > this.min && width < this.window.get_width())
            this.sidebar.width_request = width;
    }

    window = new Gtk.Window();
    sidebar = new Gtk.Box();
    max = 0.0;
    min = 0.0;
});


export const Sidebar = GObject.registerClass({
    GTypeName: 'Sidebar',
    Template: 'resource:///oop/my/graphs/sidebar.ui',
    InternalChildren: ['resize'],
}, class Sidebar extends Gtk.Box {
    constructor(window) {
        super();
        const drag = new Drag({
            sidebar: this,
            window
        });
        // const drag = new Gtk.GestureDrag();
        //
        // drag.connect('drag-update', (undefined, x) => this.drag_handle(x));
        // drag.connect('drag-end', (undefined, x) => this.drag_handle(x));    
        //
        // this._resize.add_controller(drag);
    }

    drag_handle(x) {
        const width = this.get_width() + x;
        if (width > 0) this.width_request = width;
    }
});

