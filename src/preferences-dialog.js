/* preferences.js
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

import { register } from './style.js';

export const PreferencesDialog = GObject.registerClass({
    GTypeName: 'PreferencesDialog',
    Template: 'resource:///oop/my/graphs/preferences-dialog.ui',
}, class PreferencesDialog extends Adw.MessageDialog {
    constructor(window) {
        super({ modal: true, transient_for: window });
        this.connect('response', (undefined, response_id) => {
            super.set_transient_for(null);
            if (response_id === 'cancel') {
                popover.visible = true;
            } else {
                const rgba = this.extra_child.rgba;
                const name = register(rgba);
                popover.sig_.emit('new-custom-color', name);
            }
        });
    }
});

