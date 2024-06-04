/* mirror.js
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

import Pango from 'gi://Pango';
import PangoCairo from 'gi://PangoCairo';
import GObject from 'gi://GObject';
import Gdk from 'gi://Gdk';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import { color } from './style.js';
import { Point, Vector, Zone } from './primitives.js';

const NO_START = new Point();

class Graph {
    _color = 'red';

    get color() { return color(this._color); }
    set color(def) { this._color = def; } 

    apply(cr, imagine_zone, real_zone) {}
};

class PointsGraph extends Graph {
    constructor({points, color} = {}) {
        super();
        if (points) this.points = [...points];
        if (color) this.color = color
    }

    points = [];

    apply(cr, izone, rzone) {
        if (this.points.length < 1) return;

        cr.save();
        this.color.apply(cr);

        const ivector = izone.vector;
        const rvector = rzone.vector;
        const coefx = rvector.x / ivector.x; // different from MathGraph
        const coefy = rvector.y / ivector.y;

// move to start
        const istart = this.points[0];
        const rstart = new Point({
            x: rzone.start.x + coefx * (istart.x - izone.start.x),
            y: rzone.end.y - coefy * (istart.y - izone.start.y)
        });
        cr.moveTo(rstart.x, rstart.y);
// move to start
        
        for (let i = 1; i < this.points.length; i++) {
            const ipoint = this.points[i];

            const rpoint = new Point({
                x: rzone.start.x + coefx * (ipoint.x - izone.start.x),
                y: rzone.end.y - coefy * (ipoint.y - izone.start.y)
            });
            cr.lineTo(rpoint.x, rpoint.y);
        }

        cr.stroke();
    }
};

export class MathGraph extends Graph {
    constructor({math_fn, color} = {}) {
        super();
        if (math_fn) this.math_fn = math_fn;
        if (color) this.color = color
    }

    math_fn = (x) => Math.sin(x);

    min = 10 ** (-10);

    get_coefxy(izone, rzone) {
        const ivector = izone.vector;
        const rvector = rzone.vector;
        const coefx = ivector.x / rvector.x;
        const coefy = rvector.y / ivector.y;
        return [coefx, coefy];
    }

    #find_start(izone, rzone) {
        const [coefx, coefy] = this.get_coefxy(izone, rzone);

        let k = 1;
        let start = NO_START;
        const math_fn = this.math_fn;

        for (let rx = rzone.start.x; rx < rzone.end.x; rx += k) {
            const ix = izone.start.x + coefx * (rx - rzone.start.x);
            const iy = math_fn(ix);

            if (Number.isNaN(iy) || !Number.isFinite(iy)) continue;

            const ry = rzone.end.y - coefy * (iy - izone.start.y);
            if (!Number.isNaN(ry) && Number.isFinite(ry)) {
                start = new Point({ x: rx, y: ry });
                if (start.y < rzone.end.y && start.y > rzone.start.y)  {
                    rx -= k;
                    k *= 0.1;
                    if (k > this.min) continue;
                    return start;
                }
            }
        }

        return NO_START;
    }

    apply(cr, izone, rzone) {
        const start = this.#find_start(izone, rzone);
        if (start === NO_START) return;
        this.color.apply(cr);

        cr.moveTo(start.x, start.y);
        const [coefx, coefy] = this.get_coefxy(izone, rzone);

        let pr = start;
        let inpr = true;
        let k = 1;
        const math_fn = this.math_fn;

        for (let rx = start.x; rx < rzone.end.x; rx += k) {
            const ix = izone.start.x + coefx * (rx - rzone.start.x);
            const iy = math_fn(ix);
            if (Number.isNaN(iy) || !Number.isFinite(iy)) {
                inpr = false;
                continue;
            }

            const ry = rzone.end.y - coefy * (iy - izone.start.y);
            if (!Number.isNaN(ry) && Number.isFinite(ry)) {
                if (ry > rzone.start.y && ry < rzone.end.y) {
                    if (inpr && pr.y * ry >= 0) cr.lineTo(rx, ry);
                    else if (pr.y * ry < 0) {
                        cr.moveTo(rx, ry);
                    } else {
                        const limy = ry < rzone.start.y ? 0 : rzone.end.y;
                        const limr = new Point({
                            x: pr.x + (rx - pr.x) * (limy - pr.y) / (ry - pr.y),
                            y: limy
                        });
                        cr.moveTo(limr.x, limr.y);
                        cr.lineTo(rx, ry);
                    }
                    inpr = true;
                } else if (inpr) {
                    const limy = ry < rzone.start.y ? 0 : rzone.end.y;
                    const limr = new Point({
                        x: pr.x + (rx - pr.x) * (limy - pr.y) / (ry - pr.y),
                        y: limy
                    });
                    cr.lineTo(limr.x, limr.y);
                    inpr = false;
                }
                pr.x = rx;
                pr.y = ry;
            } else if(inpr) {
                rx -= k;
                k *= 0.1;
                if (k > this.min) continue;
                k = 1;
                rx += k;
                inpr = false;
            }
        }

        cr.stroke();
    }
}

class Axes {
    get color() { return color('axes'); }

    horizontal(cr, izone, rzone) {
        if (!(izone.start.y <= 0 && izone.end.y >= 0)) return;

        const ivector = izone.vector;
        const rvector = rzone.vector;
        const coefy = rvector.y / ivector.y;
        const zeroy = rzone.end.y - coefy * (0 - izone.start.y)

        const startx = rzone.start.x;
        const endx = rzone.end.x;

        this.color.apply(cr);
        cr.moveTo(startx, zeroy);
        cr.lineTo(endx, zeroy);
    }

    vertical(cr, izone, rzone) {
        if (!(izone.start.x <= 0 && izone.end.x >= 0)) return;

        const ivector = izone.vector;
        const rvector = rzone.vector;
        const coefx = rvector.x / ivector.x;

        const zerox = rzone.start.x + coefx * (0 - izone.start.x);

        const starty = rzone.start.y;
        const endy = rzone.end.y;

        this.color.apply(cr);
        cr.moveTo(zerox, starty);
        cr.lineTo(zerox, endy);
    }
    

    apply(cr, izone, rzone) {
        this.horizontal(cr, izone, rzone);
        this.vertical(cr, izone, rzone);

        cr.stroke();
    }
}

const PIXELS_PER_UNIT = 100.0;

class Grid {
    get color() { return color('grid'); }

    vertical(cr, rx, rzone) {
        cr.save();

        this.color.apply(cr);

        cr.moveTo(rx, rzone.start.y);
        cr.lineTo(rx, rzone.end.y);

        cr.stroke();
        cr.restore();
    }

    horizontal(cr, ry, rzone) {
        cr.save();

        this.color.apply(cr);
        cr.moveTo(rzone.start.x, ry);
        cr.lineTo(rzone.end.x, ry);
        cr.stroke();
        cr.restore();
    }
};

class Marks {
    get color() { return color('marks'); }

    fontd = Pango.FontDescription.from_string('Cantarell Medium 11');

    horizontal(cr, rx, rzero, str) {
        cr.save();

        this.color.apply(cr);

        cr.moveTo(rx, rzero.y);
        const layout = PangoCairo.create_layout(cr);
        layout.set_font_description(this.fontd);

        layout.set_text(str, str.length);
        const [txt_width] = layout.get_pixel_size();
        cr.relMoveTo(-0.5 * txt_width, this.roffset);

        PangoCairo.show_layout(cr, layout);

        cr.stroke();
        cr.restore();
    }

    zero(cr, rzero) {
        const str = '0';
        cr.save();

        this.color.apply(cr);

        cr.moveTo(rzero.x, rzero.y);
        const layout = PangoCairo.create_layout(cr);
        layout.set_font_description(this.fontd);

        layout.set_text(str, str.length);
        const [txt_width] = layout.get_pixel_size();
        cr.relMoveTo(-1 * txt_width - this.roffset, this.roffset);

        PangoCairo.show_layout(cr, layout);

        cr.stroke();
        cr.restore();
    }

    vertical(cr, ry, rzero, str) {
        cr.save();

        this.color.apply(cr);

        cr.moveTo(rzero.x, ry);
        const layout = PangoCairo.create_layout(cr);
        layout.set_font_description(this.fontd);

        layout.set_text(str, str.length);
        const [txt_width, txt_height] = layout.get_pixel_size();
        cr.relMoveTo(-txt_width - this.roffset, -0.5 * txt_height);

        PangoCairo.show_layout(cr, layout);

        cr.stroke();
        cr.restore();
    }

    horizontal_top(cr, rx, rstarty, str) {
        cr.save();

        this.color.apply(cr);

        cr.moveTo(rx, rstarty);
        const layout = PangoCairo.create_layout(cr);
        layout.set_font_description(this.fontd);

        layout.set_text(str, str.length);
        const [txt_width] = layout.get_pixel_size();
        cr.relMoveTo(-0.5 * txt_width, this.roffset);

        PangoCairo.show_layout(cr, layout);

        cr.stroke();
        cr.restore();
    }

    horizontal_bottom(cr, rx, rendy, str) {
        cr.save();

        this.color.apply(cr);

        cr.moveTo(rx, rendy);
        const layout = PangoCairo.create_layout(cr);
        layout.set_font_description(this.fontd);

        layout.set_text(str, str.length);
        const [txt_width, txt_height] = layout.get_pixel_size();
        cr.relMoveTo(-0.5 * txt_width, -txt_height - this.roffset);

        PangoCairo.show_layout(cr, layout);

        cr.stroke();
        cr.restore();
    }

    vertical_top(cr, ry, rendx, str) {
        cr.save();

        this.color.apply(cr);

        cr.moveTo(rendx, ry);
        const layout = PangoCairo.create_layout(cr);
        layout.set_font_description(this.fontd);

        layout.set_text(str, str.length);
        const [txt_width, txt_height] = layout.get_pixel_size();
        cr.relMoveTo(-txt_width - this.roffset, -0.5 * txt_height);

        PangoCairo.show_layout(cr, layout);

        cr.stroke();
        cr.restore();
    }

    vertical_bottom(cr, ry, rstartx, str) {
        cr.save();

        this.color.apply(cr);

        cr.moveTo(rstartx, ry);
        const layout = PangoCairo.create_layout(cr);
        layout.set_font_description(this.fontd);

        layout.set_text(str, str.length);
        const [txt_width, txt_height] = layout.get_pixel_size();
        cr.relMoveTo(this.roffset, -0.5 * txt_height);

        PangoCairo.show_layout(cr, layout);

        cr.stroke();

        cr.restore();
    }

    max_len = 6;

    roffset = 3.0;
}

class VisualsChoosed {
    grid = true;
    marks = true;
}

class Visuals {

    grid = new Grid();

    marks = new Marks();

    closest_unit(nunit) {
        const tpower = Math.floor(Math.log10(nunit));

        const n1 = 10 ** tpower;
        const n2 = 2 * (10 ** tpower);
        const n3 = 5 * (10 ** tpower);

        const closest = [n1, n2, n3].reduce((prev, curr) => {
            return Math.abs(curr - nunit) < Math.abs(prev - nunit) ? curr : prev;
        });

        return closest;
    }

    choosed = new VisualsChoosed();

    #apply_wrap(r_eval, apply_grid, apply_marks) {
        const choosed = this.choosed;
        if (!choosed.grid && !choosed.marks)
            return (i) => {};

        if (!choosed.grid && choosed.marks)
            return (i) => {
                const r = r_eval(i);
                apply_marks(i, r);
            };

        if (!choosed.marks && choosed.grid)
            return (i) => {
                const r = r_eval(i);
                apply_grid(r);
            };

        return (i) => {
            const r = r_eval(i);
            apply_grid(r);
            apply_marks(i, r);
        };
    }

    apply(cr, izone, rzone) {
        const iverctor = izone.vector;
        const rvector = rzone.vector;

        const rpixels_per_unit = new Vector({
            x: rvector.x / iverctor.x,
            y: rvector.y / iverctor.y
        });

        const inew_unit = new Vector({
            x: this.closest_unit(PIXELS_PER_UNIT / rpixels_per_unit.x),
            y: this.closest_unit(PIXELS_PER_UNIT / rpixels_per_unit.y)
        });

        const istart = new Point({
            x: Math.floor(izone.start.x / inew_unit.x) * inew_unit.x,
            y: Math.floor(izone.start.y / inew_unit.y) * inew_unit.y
        });

        const iend = new Point({
            x: Math.ceil(izone.end.x / inew_unit.x) * inew_unit.x,
            y: Math.ceil(izone.end.y / inew_unit.y) * inew_unit.y
        });

        const rzero = new Vector({
            x: rzone.start.x + rpixels_per_unit.x * (0 - izone.start.x),
            y: rzone.end.y - rpixels_per_unit.y * (0 - izone.start.y)
        });

        const digits = new Vector({
            x: inew_unit.x < 1.0 ? Math.ceil(Math.abs(Math.log10(inew_unit.x))) : 0,
            y: inew_unit.y < 1.0 ? Math.ceil(Math.abs(Math.log10(inew_unit.y))) : 0
        });
        digits.x = inew_unit.x < 1.0 ? Math.ceil(Math.abs(Math.log10(inew_unit.x))) : 0;

// binded functions for drawing
        const apply_gridx = (rx) => this.grid.vertical(cr, rx, rzone);
        const apply_gridy = (ry) => this.grid.horizontal(cr, ry, rzone);
        const rx_eval = (ix) => rzone.start.x + (rpixels_per_unit.x) * (ix - izone.start.x);
        const ry_eval = (iy) => rzone.end.y - (rpixels_per_unit.y) * (iy - izone.start.y);
        const apply_marksx = (ix, rx) => {
            const str = `${ix.toFixed(digits.x)}`;
            if (izone.start.y <= 0 && izone.end.y > 0)
                this.marks.horizontal(cr, rx, rzero, str);
            else if (izone.start.y > 0)
                this.marks.horizontal_bottom(cr, rx, rzone.end.y, str);
            else
                this.marks.horizontal_top(cr, rx, rzone.start.y, str);
        };
        const apply_marksy = (iy, ry) => {
            const str = `${iy.toFixed(digits.y)}`;
            if (izone.start.x < 0 && izone.end.x > 0)
                this.marks.vertical(cr, ry, rzero, str);
            else if (izone.start.x > 0)
                this.marks.vertical_bottom(cr, ry, rzone.start.x, str);
            else
                this.marks.vertical_top(cr, ry, rzone.end.x, str);
        };
// binded functions for drawing
// wrapped functions for drawing
        const applyx = this.#apply_wrap(rx_eval, apply_gridx, apply_marksx);
        const applyy = this.#apply_wrap(ry_eval, apply_gridy, apply_marksy);
// wrapped functions for drawing

        // x
        if (istart.x < 0 && iend.x > 0) {
            for (let ix = -inew_unit.x; ix >= istart.x; ix -= inew_unit.x)
                applyx(ix);
            if (this.choosed.marks) this.marks.zero(cr, rzero);
            for (let ix = inew_unit.x; ix <= iend.x; ix += inew_unit.x)
                applyx(ix);
        } else {
            for (let ix = istart.x; ix <= iend.x; ix += inew_unit.x)
                applyx(ix);
        }

        // y
        if (istart.y < 0 && iend.y > 0) {
            for (let iy = -inew_unit.y; iy >= istart.y; iy -= inew_unit.y)
                applyy(iy);
            for (let iy = inew_unit.y; iy <= iend.y; iy += inew_unit.y)
                applyy(iy);
        } else {
            for (let iy = istart.y; iy <= iend.y; iy += inew_unit.y)
                applyy(iy);
        }

        cr.stroke();
    }
}

class Reflection {
    constructor(area) {
        this.area = area;
    }

    get color() { return color('isurface'); }
    axes = new Axes();
    zone = new Zone({
        start: new Point({
            x: -2 * Math.PI,
            y: -2,
        }),
        end: new Point({
            x: 2 * Math.PI,
            y: 2
        })
    });
    visuals = new Visuals();

    apply_graphs(cr, rzone) {
        const izone = this.zone;
        for (const graph of this.graphs)
            graph.apply(cr, izone, rzone);
    }

    draw_fn = (cr, rzone) => {
        cr.save();
        this.color.apply(cr);
        cr.paint();

        this.visuals.apply(cr, this.zone, rzone);

        this.axes.apply(cr, this.zone, rzone);

        this.apply_graphs(cr, rzone);

        cr.restore();
    }

    graphs = new Set([]);
}

class Surface {
    constructor({ area, reflection }) {
        this.area = area;
        this.reflection = reflection;

        this.zone = new Zone({
            end: new Point({
                x: area.content_width,
                y: area.content_height
            })
        });

        this.#set_izone();

        this.connect_drag();
        this.connect_scroll();

        this.area.set_draw_func(this.draw_fn);
    }

    #set_izone() {
        const ideal_zone = new Zone({
            start: new Point({
                x: this.zone.start.x / PIXELS_PER_UNIT,
                y: this.zone.start.y / PIXELS_PER_UNIT,
            }),
            end: new Point({
                x: this.zone.end.x / PIXELS_PER_UNIT,
                y: this.zone.end.y / PIXELS_PER_UNIT
            })
        });
        const ideal_vector = ideal_zone.vector;
        this.reflection.zone = new Zone({
            start: new Point({
                x: ideal_zone.start.x - ideal_vector.x * 0.5,
                y: ideal_zone.start.y - ideal_vector.y * 0.5,
            }),
            end: new Point({
                x: ideal_zone.end.x - ideal_vector.x * 0.5,
                y: ideal_zone.end.y - ideal_vector.y * 0.5
            })
        });

    }

    #seat = Gdk.Display.get_default().get_default_seat();
    #mouse = this.#seat.get_pointer();

    zone = new Zone();

    #native_window() {
        let native = this.area.get_native();
        while (!(native instanceof Gtk.Window))
            native = native.get_native();
        return native;
    }

    get mouse_point() {
        const native = this.#native_window();

        // bounds -> offset from window
        const [ok, bounds] = this.area.compute_bounds(native);
        if (!ok) console.error('ohhh, I guess no scroll');

        const data = this.#mouse.get_surface_at_position();
        // offset from toplevel to window
        const soffset = new Vector({
            x: 0.5 * (data[0].width - native.get_width()),
            y: 0.5 * (data[0].height - native.get_height())
        });

        return new Point({
            x: data[1] - bounds.get_x() - soffset.x,
            y: data[2] - bounds.get_y() - soffset.y
        });
    }

    connect_scroll() {
        const scroll = new Gtk.EventControllerScroll({
            flags: Gtk.EventControllerScrollFlags.BOTH_AXES
        });

        const izone = this.reflection.zone;
        const rzone = this.zone;
        scroll.connect('scroll', (_scroll, dx, dy) => {
            const coef = this.zoom_coef * dy;
            const ivector = izone.vector;

            const rvector = rzone.vector;
            const rmpoint = this.mouse_point;
            const factor = new Vector({
                x: (rmpoint.x - rzone.start.x) / rvector.x,
                y: (rzone.end.y - rmpoint.y) / rvector.y
            });

            const impoint = new Point({
                x: izone.start.x + (ivector.x / rvector.x) * (rmpoint.x - rzone.start.x),
                y: izone.start.y + (ivector.y / rvector.y) * (rzone.end.y - rmpoint.y)
            });

            const dif = new Vector({
                x: coef * ivector.x * 0.5,
                y: coef * ivector.y * 0.5
            });

            izone.start.x -= dif.x;
            izone.start.y -= dif.y;
            izone.end.x += dif.x;
            izone.end.y += dif.y;

            const new_ivector = izone.vector;
            
            const mvvector = new Vector({
                x: new_ivector.x * factor.x,
                y: new_ivector.y * factor.y
            });
            izone.start.x = impoint.x - mvvector.x;
            izone.start.y = impoint.y - mvvector.y;

            izone.end.x = izone.start.x + new_ivector.x;
            izone.end.y = izone.start.y + new_ivector.y;

            this.area.queue_draw();
        });
        this.area.add_controller(scroll);
    }

    connect_drag() {
        const drag = new Gtk.GestureDrag();
        const rzone = this.zone;
        const izone = this.reflection.zone;

        const izone_on_start = new Zone();
        drag.connect('drag-begin', (_drag, x, y) => {
            izone_on_start.start.x = izone.start.x;
            izone_on_start.start.y = izone.start.y;
            izone_on_start.end.x = izone.end.x;
            izone_on_start.end.y = izone.end.y;
        });

        const translate = (_drag, x, y) => {
            const rvector = rzone.vector;
            const ivector = izone_on_start.vector;
            
            const coef = new Vector({
                x: -x / rvector.x,
                y: y / rvector.y
            });

            // translation vector
            const t_vector = new Vector({
                x: coef.x * ivector.x,
                y: coef.y * ivector.y
            });
            izone.start.x = izone_on_start.start.x + t_vector.x;
            izone.start.y = izone_on_start.start.y + t_vector.y;
            izone.end.x = izone_on_start.end.x + t_vector.x;
            izone.end.y = izone_on_start.end.y + t_vector.y;
            this.area.queue_draw();
        };

        drag.connect('drag-update', translate);
        drag.connect('drag-end', translate);

        this.area.add_controller(drag);
    }

    #check_size(width, height) {
        const rzone = this.zone;
        const rvector = rzone.vector;
        const coef = new Vector({
            x: width / rvector.x,
            y: height / rvector.y
        });

        const izone = this.reflection.zone;
        const ivector = izone.vector;

        if (coef.x !== 1.0) {
            rzone.end.x = width;
            ivector.x *= coef.x;
            izone.end.x = izone.start.x + ivector.x;
        }
        if (coef.y !== 1.0) {
            rzone.end.y = height;
            const dif_iv = (coef.y - 1.0) * ivector.y * 0.5;
            izone.start.y -= dif_iv;
            izone.end.y += dif_iv;
        }
    }

    draw_fn = (area, cr, width, height) => {
        this.#check_size(width, height);

        this.reflection.draw_fn(cr, this.zone);
        cr.$dispose();
    }

    redraw = () => this.area.queue_draw();

    zoom_coef = 0.04;
}

export class Mirror {
    constructor(area) {
        const reflection = new Reflection(area);
        this.surface = new Surface({ area, reflection });
        this.reflection = reflection;
    }

    redraw() { this.reflection.area.queue_draw(); }

    add_graph(graph) {
        this.reflection.graphs.add(graph);
    }

    delete_graph(graph) {
        this.reflection.graphs.delete(graph);
    }
};
