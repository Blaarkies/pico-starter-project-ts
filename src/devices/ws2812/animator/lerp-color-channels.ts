import { ColorRgb } from 'common/color-space';
import { lerp } from 'common/interpolate';
import { toLog } from 'common/transform';

/** Interpolates channel `i` from `rgb1` to `rgb2` at ratio `t` with a log(10) transformation */
function lerpRgbChannel(i: number, rgb1: ColorRgb, rgb2: ColorRgb, t: number)
    : number {
    return lerp(rgb1[i], rgb2[i], toLog(t, 10));
}

/**
 * Interpolates from `rgb1` to `rgb2` at ratio `t` with a log(10) transformation.
 * This helps the animation appear linear when the brightness changes
 */
export function lerpRgbPixelLinear(rgb1: ColorRgb, rgb2: ColorRgb, t: number)
    : ColorRgb {
    return [
        lerpRgbChannel(0, rgb1, rgb2, t),
        lerpRgbChannel(1, rgb1, rgb2, t),
        lerpRgbChannel(2, rgb1, rgb2, t),
    ];
}
