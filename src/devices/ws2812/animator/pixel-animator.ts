import { ColorRgb } from 'common/color-space';
import { overrideDefaults } from 'common/function';
import { animateFade } from 'devices/ws2812/animator/animations/fade';
import { lerpRgbPixelLinear } from 'devices/ws2812/animator/lerp-color-channels';
import { AnimationFn } from 'devices/ws2812/animator/types';
import { Ws2812 } from 'devices/ws2812/ws2812';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { timer } from 'rxjs/internal/observable/timer';
import { Subject } from 'rxjs/internal/Subject';

interface SetToColorConfig {
    animationFn?: AnimationFn;
    duration?: number;
    fps?: number;
    fromRgb?: ColorRgb;
    rgbLerpFn?: (rgb1: ColorRgb, rgb2: ColorRgb, t: number) => ColorRgb;
}

export interface AnimationConfig extends SetToColorConfig {
    toRgb: ColorRgb;
    stop$: Subject<void>;
    pixels: Ws2812;
    intervalMs: number;
    stepCount: number;
}

export class PixelAnimator {

    private stop$ = new Subject<void>();
    private latestColor: ColorRgb;
    private defaultFps: number;

    constructor(
        private pixels: Ws2812,
        defaultFps = 60,
        defaultColor: ColorRgb = [0, 0, 0],
    ) {
        if (defaultFps <= 0) {
            throw new Error(
                `${PixelAnimator.name}: Invalid fps value [${defaultFps}}]`);
        }
        if (!Array.isArray(defaultColor)
            || defaultColor.some(c =>
                !Number.isFinite(c)
                || c < 0
                || c > 255)
            || defaultColor.length !== 3) {
            throw new Error(
                `${PixelAnimator.name}: Invalid defaultColor [${defaultColor}]`);
        }

        this.defaultFps = defaultFps;
        this.latestColor = defaultColor;
    }

    async setToColor(rgb: ColorRgb, argsConfig: SetToColorConfig = {}) {
        this.stop$.next();
        // wait for previous job to complete for previous color state
        await firstValueFrom(timer(0));

        let config = overrideDefaults<AnimationConfig>({
            animationFn: animateFade,
            duration: 1e3,
            fromRgb: this.latestColor,
            toRgb: rgb,
            rgbLerpFn: lerpRgbPixelLinear,
            fps: this.defaultFps,
            stop$: this.stop$,
            pixels: this.pixels,
            intervalMs: undefined,
            stepCount: undefined,
        }, argsConfig);
        config.intervalMs = 1e3 / config.fps;
        config.stepCount = Math.floor(config.duration / config.intervalMs);

        let job$ = config.animationFn(config);
        job$.subscribe(c => this.latestColor = c);

        // return firstValueFrom(this.stop$);
    }

}