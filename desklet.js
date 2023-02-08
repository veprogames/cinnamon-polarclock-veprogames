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

            for(let i = 0; i < 5; i++){
                ctx.setSourceRGBA(i * 0.2, 1, 1 - i * 0.2, 1);
                ctx.arc(0, 0, 0.2 + 0.3 * i / 5, -0.5 * Math.PI, degrees[i] * 2 * Math.PI - 0.5 * Math.PI);
                ctx.stroke();
            }

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