import { ColorRgb } from 'common/color-space';
import { mirrorList } from 'devices/ws2812/animator/animations/led-list-functions';
import { LedListGenerator } from 'devices/ws2812/animator/animations/led-list-generator';
import { AnimationConfig } from 'devices/ws2812/animator/pixel-animator';
import { Observable } from 'rxjs/internal/Observable';
import { interval } from 'rxjs/internal/observable/interval';
import { filter } from 'rxjs/internal/operators/filter';
import { map } from 'rxjs/internal/operators/map';
import { take } from 'rxjs/internal/operators/take';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';

/**
 * Animation that fills from left to right
 * @see animateSweep
 */
export function animateSweepRight(config: AnimationConfig): Observable<ColorRgb> {
    return animateSweep(config, false);
}

/**
 * Animation that fills from right to left
 * @see animateSweep
 */
export function animateSweepLeft(config: AnimationConfig): Observable<ColorRgb> {
    return animateSweep(config, true);
}

/**
 * Returns an interval observable which sequentially changes individual LED
 * colors, resulting in a "sweeping" or "flooding" animation according to the
 * `config` and `directionLeft` args
 */
function animateSweep(config: AnimationConfig, directionLeft: boolean)
    : Observable<ColorRgb> {
    let ledListGenerator = new LedListGenerator(
        config.stepCount,
        config.pixels.ledCount);

    let lastLedIndex = config.pixels.ledCount - 1;

    return interval(config.intervalMs).pipe(
        map(i => {
            let list = ledListGenerator.generate(i);

            if (directionLeft) {
                list = mirrorList(list, lastLedIndex);
            }

            return list;
        }),
        filter(list => list.length > 0),
        map(ledsToUpdate => {
            ledsToUpdate.forEach(n =>
                config.pixels.setLedColor(n, config.toRgb));
            config.pixels.write();

            return config.rgbLerpFn(
                config.fromRgb,
                config.toRgb,
                ledListGenerator.positionRatio);
        }),
        take(config.stepCount),
        takeUntil(config.stop$));
}
