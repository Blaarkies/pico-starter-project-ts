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
 * Animation that fills from outside inwards
 * @see animateCenterFlood
 */
export function animateCenterFloodIn(config: AnimationConfig): Observable<ColorRgb> {
    return animateCenterFlood(config, false);
}

/**
 * Animation that fills from the center outwards
 * @see animateCenterFlood
 */
export function animateCenterFloodOut(config: AnimationConfig): Observable<ColorRgb> {
    return animateCenterFlood(config, true);
}

/**
 * Returns an interval observable which sequentially changes individual LED
 * colors, resulting in a center aligned "flooding" animation according to the
 * `config` and `directionOut` args
 */
function animateCenterFlood(config: AnimationConfig, directionOut: boolean)
    : Observable<ColorRgb> {
    // Account for the offset when the LED list has an odd/even length
    let oddOffset = (config.pixels.ledCount % 2) ? 0 : 1;
    let halfLedCount = Math.ceil(config.pixels.ledCount / 2);

    // Only compute half of the LED list, then mirror this for a full LED list
    let ledHalfListGenerator = new LedListGenerator(
        config.stepCount,
        halfLedCount);

    let lastLedHalfIndex = Math.ceil((config.pixels.ledCount - 1) / 2);

    return interval(config.intervalMs).pipe(
        map(i => {
            let halfList = ledHalfListGenerator.generate(i);

            if (directionOut) {
                // Reverse LED fill direction to move toward left
                halfList = mirrorList(halfList, lastLedHalfIndex - oddOffset);
            }

            // Mirror of the list to fill the 2nd half of the full list
            let offsetMirroredHalfList = mirrorList(halfList, lastLedHalfIndex)
                .map(n => n + lastLedHalfIndex - oddOffset);

            return halfList.concat(offsetMirroredHalfList);
        }),
        filter(list => list.length > 0),
        map(ledsToUpdate => {
            ledsToUpdate.forEach(n =>
                config.pixels.setLedColor(n, config.toRgb));
            config.pixels.write();

            return config.rgbLerpFn(
                config.fromRgb,
                config.toRgb,
                ledHalfListGenerator.positionRatio);
        }),
        take(config.stepCount),
        takeUntil(config.stop$));
}
