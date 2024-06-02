/* items-base.js
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

const convert = (objs) => {
    if (objs instanceof Set) return objs;
    if (objs instanceof Array) return new Set(objs);
    if (objs instanceof Item) return new Set([objs]);
    throw new Error(`not supported argument: ${objs}`);
};

export class Point {
    constructor({ x, y } = {}) {
        if (x) this.x = x;
        if (y) this.y = y;
    }

    x = 0.0;
    y = 0.0;
}

export class Zone {
    constructor({ start, end } = {}) {
        if (start) this.start = start;
        if (end) this.end = end;
    }

    start = new Point({ x: 0, y: 0 });
    end = new Point({ x: 0, y: 0 });
}

export class Attribute {
    constructor({ name, getfn, setfn, apply } = {}) {
        if (name) this.name = name;
        if (getfn) this.#getfn = getfn;
        if (setfn) this.#setfn = setfn;
        if (apply) this.apply = apply;
    }

    #getfn = () => {};
    #setfn = (v) => {};

    name = '';
    get value() { return this.#getfn(); }
    set value(v) { return this.#setfn(v); }

    apply(cr) {}
}

export class Description {
    constructor(attributes) {
        if (!attributes) return;
        const converted = convert(attributes);
        this.attributes = converted;
    }

    attributes = new Set([]);

    describe() {
        const description = Array.from([...this.attributes]);
        return description;
    }
}

export class Item {
    constructor({ apply, description } = {}) {
        if (apply) this.apply = apply;
        if (description) this.description = description;
    }

    description = new Description();

    apply(cr, zone) {}
}

export class Store {
    constructor(items) {
        if (!items) return;
        const converted = convert(items);
        if (!this.#check(converted)) return;

        this.items = converted;
    }

    items = new Set([]);

    #check(items) {
        for (const item of items)
            if (!(item instanceof Item)) return false;
        return true;
    }

    add(items) {
        const converted = convert(items);
        if (!this.#check(converted)) return;
        for (const item of converted) this.items.add(item);
    }

    delete(items) {
        const converted = convert(items);
        if (!this.#check(converted)) return;
        for (const item of converted) this.items.delete(item);
    }
}

