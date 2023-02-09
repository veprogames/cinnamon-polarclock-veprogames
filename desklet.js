const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Cairo = imports.cairo;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const GLib = imports.gi.GLib;

function PolarClockDesklet(metadata, deskletId) {
    this.__proto__ = Desklet.Desklet.prototype;
    const W = 512;
    const H = 512;

    //date
    this.date = [0, 0, 0, 0, 0, 0];

    this._init = function(metadata, deskletId) {
        Desklet.Desklet.prototype._init.call(this, metadata, deskletId);
        this.setup();
    }

    this.setup = function(){
        this.window = new Clutter.Actor();

        this.setContent(this.window);

        this.update();
    }

    this.update = function () {
        this.draw();

        this.timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this.update))
    }

    this.draw = function(){
        const canvas = new Clutter.Canvas();
        canvas.set_size(W, H);
        canvas.connect("draw", function(canvas, ctx, w, h) {
            ctx.save();
            ctx.setOperator(Cairo.Operator.CLEAR);
            ctx.paint();
            ctx.restore();
            ctx.setOperator(Cairo.Operator.OVER);

            ctx.scale(W, H);
            ctx.translate(.5, .5);

            ctx.setLineWidth(0.042);
            ctx.setLineCap(Cairo.LineCap.ROUND);

		    const time = new GLib.DateTime();

            const data = [time.get_second(), time.get_minute(), time.get_hour(), time.get_day_of_month(), time.get_month()];
            const degrees = [data[0] / 60, data[1] / 60, data[2] / 24, data[3] / 30, data[4] / 12];
            const baseColor = [134 / 256, 190 / 256, 67 / 255];

            for(let i = 0; i < 5; i++){
                ctx.setSourceRGBA(baseColor[0], baseColor[1] + 0.2 * i, baseColor[2] + 0.2 * i, 1);
                ctx.arc(0, 0, 0.2 + 0.3 * i / 5, -0.5 * Math.PI, degrees[i] * 2 * Math.PI - 0.5 * Math.PI);
                ctx.stroke();
            }

            ctx.setSourceRGBA(1, 1, 1, 1);
            ctx.moveTo(-0.13, -0.02);
            ctx.setFontSize(0.1);
            ctx.showText(time.get_year().toString());
            ctx.setFontSize(0.045);
            ctx.moveTo(-0.13, 0.04);
            // month-day
            ctx.showText([data[4], data[3]].map(t => t.toString().padStart(2, "0")).join("-"));
            ctx.moveTo(-0.13, 0.08);
            // hour:minute:second
            ctx.showText([data[2], data[1], data[0]].map(t => t.toString().padStart(2, "0")).join(":"));

            return false;
        });

        canvas.invalidate();
        this.window.set_size(W, H);
        this.window.set_content(canvas);
    }

    this.on_desklet_removed = function(){
        Mainloop.source_remove(this.timeout);
    }

    this._init(metadata, deskletId);
}

function main(metadata, deskletId) {
    return new PolarClockDesklet(metadata, deskletId);
}