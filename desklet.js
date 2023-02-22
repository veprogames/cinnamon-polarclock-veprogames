const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Cairo = imports.cairo;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Settings = imports.ui.settings;

function PolarClockDesklet(metadata, deskletId) {
    this.__proto__ = Desklet.Desklet.prototype;
    const BASE_W = 512;
    const BASE_H = 512;

    // date
    this.date = [0, 0, 0, 0, 0, 0];

    // cached colors
    this.colors = [];

    this._init = function(metadata, deskletId) {
        Desklet.Desklet.prototype._init.call(this, metadata, deskletId);
        this.settings = this.initSettings(metadata, deskletId);
        this.colors = this.getColors();
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

    this.initSettings = function(metadata, deskletId){
        const I = Settings.BindingDirection.IN;
        const cb = this.onSettingChanged;

        const settings = new Settings.DeskletSettings(this, metadata.uuid, deskletId);
        settings.bindProperty(I, "desklet-scale", "settingDeskletScale", cb);

        settings.bindProperty(I, "gradient-enabled", "settingGradientEnabled", cb);
        settings.bindProperty(I, "gradient-r", "settingGradientR", cb);
        settings.bindProperty(I, "gradient-g", "settingGradientG", cb);
        settings.bindProperty(I, "gradient-b", "settingGradientB", cb);

        settings.bindProperty(I, "color-second", "settingColorSecond", cb);
        settings.bindProperty(I, "color-minute", "settingColorMinute", cb);
        settings.bindProperty(I, "color-hour", "settingColorHour", cb);
        settings.bindProperty(I, "color-day", "settingColorDay", cb);
        settings.bindProperty(I, "color-month", "settingColorMonth", cb);

        settings.bindProperty(I, "text-year-enabled", "settingTextYearEnabled", cb);
        settings.bindProperty(I, "text-date-enabled", "settingTextDateEnabled", cb);
        settings.bindProperty(I, "text-time-enabled", "settingTextTimeEnabled", cb);

        settings.bindProperty(I, "text-year-color", "settingTextYearColor", cb);
        settings.bindProperty(I, "text-date-color", "settingTextDateColor", cb);
        settings.bindProperty(I, "text-time-color", "settingTextTimeColor", cb);
        return settings;
    }

    this.onSettingChanged = function(){
        Mainloop.source_remove(this.timeout);
        this.colors = this.getColors();
        this.update();
    }

    // parse settings value
    this.parseColor = function(value){
        const values = value.replace(/rgb(a|)\(/, "").replace(")", "").split(",").map(str => parseFloat(str.trim()) / 256);
        values[3] *= 256; // alpha already was in 0-1 range
        return values;
    }

    // return the colors of each circle as an array
    this.getColors = function(){
        const baseColor = this.parseColor(this.settingColorSecond);
        if(!this.settingGradientEnabled){
            return [
                baseColor,
                this.parseColor(this.settingColorMinute),
                this.parseColor(this.settingColorHour),
                this.parseColor(this.settingColorDay),
                this.parseColor(this.settingColorMonth)
            ]
        }
        return new Array(5).fill(0).map((v, idx) => [
            baseColor[0] + this.settingGradientR * idx,
            baseColor[1] + this.settingGradientG * idx,
            baseColor[2] + this.settingGradientB * idx
        ]);
    }

    this.daysInMonth = function(month, year){
        switch (month) {
            case 1:
            case 3:
            case 5:
            case 7:
            case 8:
            case 10:
            case 12:
                return 31;
            case 4:
            case 6:
            case 9:
            case 11:
                return 30;
            case 2:
                const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
                return isLeapYear ? 29 : 28;
            default:
                return 0;
        }
    }

    this.draw = function(){
        const W = BASE_W * this.settingDeskletScale;
        const H = BASE_H * this.settingDeskletScale;
        const canvas = new Clutter.Canvas();
        canvas.set_size(W, H);

        let time = new GLib.DateTime();
        const colors = this.colors;
        const daysInMonth = this.daysInMonth(time.get_month(), time.get_year());

        const yearColor = this.parseColor(this.settingTextYearColor);
        const dateColor = this.parseColor(this.settingTextDateColor);
        const timeColor = this.parseColor(this.settingTextTimeColor);

        const showYear = this.settingTextYearEnabled;
        const showDate = this.settingTextDateEnabled;
        const showTime = this.settingTextTimeEnabled;

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

            // if close enough to next second, round up, so some seconds aren't "skipped"
            // (ticks might be at 1.0203 and 1.9987 seconds, resulting in the same second being displayed twice)
            if(time.get_microsecond() > 500e3){
                // add an extra microsecond to be sure it really won't round down to the previous second
                time = time.add_seconds((1e6 - time.get_microsecond() + 1) / 1e6);
            }
            const data = [time.get_second(), time.get_minute(), time.get_hour(), time.get_day_of_month(), time.get_month()];
            const degrees = [data[0] / 60, data[1] / 60, data[2] / 24, data[3] / daysInMonth, data[4] / 12];

            for(let i = 0; i < 5; i++){
                const r = colors[i][0];
                const g = colors[i][1];
                const b = colors[i][2];
                ctx.setSourceRGBA(r, g, b, 1);
                ctx.arc(0, 0, 0.2 + 0.3 * i / 5, -0.5 * Math.PI, degrees[i] * 2 * Math.PI - 0.5 * Math.PI);
                ctx.stroke();
            }


            ctx.setFontSize(0.1);

            // year
            if(showYear){
                ctx.moveTo(-0.13, -0.02);
                ctx.setSourceRGBA(yearColor[0], yearColor[1], yearColor[2], 1);
                ctx.showText(time.get_year().toString());
            }
            ctx.setFontSize(0.045);
            // month-day
            if(showDate){
                ctx.moveTo(-0.13, 0.04);
                ctx.setSourceRGBA(dateColor[0], dateColor[1], dateColor[2], 1);
                ctx.showText([data[4], data[3]].map(t => t.toString().padStart(2, "0")).join("-"));
            }
            // hour:minute:second
            if(showTime){
                ctx.moveTo(-0.13, 0.08);
                ctx.setSourceRGBA(timeColor[0], timeColor[1], timeColor[2], 1);
                ctx.showText([data[2], data[1], data[0]].map(t => t.toString().padStart(2, "0")).join(":"));
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