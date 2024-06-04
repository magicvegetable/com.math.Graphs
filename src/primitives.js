/* primitives.js
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

export class Point {
    constructor({ x, y } = {}) {
        if (x) this.x = x;
        if (y) this.y = y;
    }

    x = 0.0;
    y = 0.0;
}

export const Vector = Point;

export class Zone {
    constructor({ start, end } = {}) {
        if (start) this.start = start;
        if (end) this.end = end;
    }

    start = new Point();
    end = new Point();

    get vector() {
        return new Vector({
            x: this.end.x - this.start.x,
            y: this.end.y - this.start.y
        });
    }

};

