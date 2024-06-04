/* style.js
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

import Adw from 'gi://Adw';

export const THEME_CHECKER = new Adw.StyleManager();

// black default
export class Color {
    constructor({ r, g, b, alpha } = {}) {
        if (r) this.r = r;
        if (g) this.g = g;
        if (b) this.b = b;
        if (alpha) this.alpha = alpha;
    }

    r = 0;
    g = 0;
    b = 0;
    alpha = 1.0;

    apply(cr) {
        cr.setSourceRGBA(
            this.r,
            this.g,
            this.b,
            this.alpha
        );
    }
};

export const COLORS = {
    dark: {
        isurface: new Color({ alpha: 0.9 }),
        axes: new Color({ r: 0.8706, g: 0.8667, b: 0.8549 }),
        marks: new Color({ r: 0.8706, g: 0.8667, b: 0.8549 }),
        grid: new Color({ r: 0.4667, g: 0.4627, b: 0.4824 }),
        red: new Color({ r: 0.7529, g: 0.1098, b: 0.1569 }),
        blue: new Color({ r: 0.4706, g: 0.6824, b: 0.9294 }),
        green: new Color({ r: 0.5608, g: 0.9412, b: 0.6431 }),
        yellow: new Color({ r: 0.8039, g: 0.5765, b: 0.0353 }),
    },
    light: {
        isurface: new Color({ r: 1.0, g: 1.0, b: 1.0 }),
        axes: new Color({ r: 0.1412, g:  0.1412, b:  0.1412 }),
        marks: new Color({ r: 0.1412, g:  0.1412, b:  0.1412 }),
        grid: new Color({ r: 0.4667, g: 0.4627, b: 0.4824 }),
        red: new Color({ r: 0.8784, g: 0.1059, b: 0.1412 }),
        blue: new Color({ r: 0.1098, g: 0.4431, b: 0.8471 }),
        green: new Color({ r: 0.1059, g: 0.5216, b: 0.3255 }),
        yellow: new Color({ r: 0.8980, g: 0.6471, b: 0.0392 }),
    }
};

export class NamedColor extends Color {
    constructor(name) {
        super();
        this.name = name;
    }

    apply(cr) {
        const name = this.name;
        const color = THEME_CHECKER.dark ?
            COLORS.dark[name] : COLORS.light[name];
        color.apply(cr);
    }
};
