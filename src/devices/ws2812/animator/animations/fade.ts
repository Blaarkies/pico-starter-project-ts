import { ColorRgb } from 'common/color-space';
import { AnimationConfig } from 'devices/ws2812/animator/pixel-animator';
import { Observable } from 'rxjs/internal/Observable';
import { interval } from 'rxjs/internal/observable/interval';
import { map } from 'rxjs/internal/operators/map';
import { take } from 'rxjs/internal/operators/take';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';

/**
 * Animation that fades from `fromRgb` color to `toRgb` color according
 * to the `config` arg.
 *
 * Returns an interval observable which sequentially changes individual LED
 * colors, resulting in a "fading" animation according to the`config` arg
 */
export function animateFade(config: AnimationConfig): Observable<ColorRgb> {
    let lastStepIndex = config.stepCount - 1;

    return interval(config.intervalMs).pipe(
        map(i => {
            let newColor = config.rgbLerpFn(
                config.fromRgb,
                config.toRgb,
                i / lastStepIndex);
            config.pixels.fillAllColor(newColor);
            config.pixels.write();

            return newColor;
        }),
        take(config.stepCount),
        takeUntil(config.stop$));
}