/* graph-color-button.js
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

import { COLORS, THEME_CHECKER } from './style.js';
import { Point } from './primitives.js';

const Signals = imports.signals;

export const GraphColorButton = GObject.registerClass({
    GTypeName: 'GraphColorButton',
    Template: 'resource:///oop/my/graphs/graph-color-button.ui',
    Properties: {
        'color': GObject.ParamSpec.string(
            'color',
            'Color',
            'Hex color',
            GObject.ParamFlags.READWRITE,
            'red'
        ),
    }
}, class GraphColorButton extends Gtk.DrawingArea {
    constructor(color) {
        super();
        if (this.color === undefined)
            this._color_name = color && typeof(color) === 'string' ? color : 'red'; 
        this.content_width = 30;
        this.content_height = 30;
        this.set_draw_func(this.draw_fn);

        Signals.addSignalMethods(this.choosed);

        const click = new Gtk.GestureClick();
        click.connect('pressed', (_click, n, x, y) => {
            this.choosed.emit('activate', this.color);
        });
        this.add_controller(click);    
    }

    choosed = {};

    get color() {
        return this._color_name;
    }

    set color(str) {
        if (str === this._color_name) return;

        this._color_name = str;
        this.notify('color');
    }

    get color_() {
        if (THEME_CHECKER.dark)
            return COLORS.dark[this.color];
        else
            return COLORS.light[this.color];
    }

    coef = 0.15;

    draw_fn = (area, cr, width, height) => {
        const offset = Math.sqrt(width ** 2 + height ** 2) * this.coef;

        this.color_.apply(cr);
        const top_left = new Point({ x: offset, y: 0 });
        const top_right = new Point({ x: width - offset, y: 0 })
        const right_top = new Point({ x: width, y: offset });
        const right_bot = new Point({ x: width, y: height - offset });
        const bot_right = new Point({ x: top_right.x, y: height });
        const bot_left = new Point({ x: top_left.x, y: height });
        const left_bot = new Point({ x: 0, y: right_bot.y });
        const left_top = new Point({ x: 0, y: offset });

        cr.curveTo(
            top_right.x, top_right.y,
            right_top.x, top_right.y,
            right_top.x, right_top.y
        );
        cr.lineTo(right_bot.x, right_bot.y);
        cr.curveTo(
            right_bot.x, right_bot.y,
            right_bot.x, bot_right.y,
            bot_right.x, bot_right.y
        );
        cr.lineTo(bot_left.x, bot_left.y);
        cr.curveTo(
            bot_left.x, bot_left.y,
            left_bot.x, bot_left.y,
            left_bot.x, left_bot.y
        );
        cr.lineTo(left_top.x, left_top.y);
        cr.curveTo(
            left_top.x, left_top.y,
            left_top.x, top_left.y,
            top_left.x, top_left.y
        );

        cr.fill();

        cr.$dispose();
    }
});