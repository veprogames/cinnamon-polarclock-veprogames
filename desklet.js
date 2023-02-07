const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Cairo = imports.cairo;
const Mainloop = imports.mainloop;
const Lang = imports.lang;

function PolarClockDesklet(metadata, deskletId) {
    this.__proto__ = Desklet.Desklet.prototype;
    const W = 512;
    const H = 512;

    this._init = function(metadata, deskletId) {
        Desklet.Desklet.prototype._init.call(this, metadata, deskletId);
        this.setup();
    }

    this.setup = function(){
        this.window = new Clutter.Actor();

        this.setContent(this.window);

        this.draw();
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
            ctx.setLineWidth(12);
            ctx.setLineCap(Cairo.LineCap.ROUND);

            for(let i = 0; i < 5; i++){
                ctx.setSourceRGBA(i * 0.125, 1, 0, 1);
                //ctx.newSubPath();
                ctx.arc(W / 2, H / 2, H * 0.2 + H * 0.3 * i / 8, 0, 2);
                //ctx.closePath();
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