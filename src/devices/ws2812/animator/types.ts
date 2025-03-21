import { ColorRgb } from 'common/color-space';
import { AnimationConfig } from 'devices/ws2812/animator/pixel-animator';
import { Observable } from 'rxjs/internal/Observable';

/**
 * Function that handles animation updates. It is expected to return an
 * observable of the "last used color", and complete when `config.stop$` emits.
 *
 * Internally it can use `config.pixels` to set new colors on specific
 * LEDs in order to create the animation.
 *
 * @see animateFade
 * @see animateSweepRight
 * @see animateCenterFloodIn
 *
 * @example
 * function myAnimation(config: AnimationConfig): Observable<ColorRgb> {
 *   let lastStepIndex = config.stepCount - 1;
 *
 *   return interval(config.intervalMs).pipe(
 *     map(i => {
 *       let newColor = config.rgbLerpFn(
 *          config.fromRgb,
 *          config.toRgb,
 *          i / lastStepIndex);
 *
 *       config.pixels.fillAllColor(newColor);
 *       config.pixels.write();
 *
 *       return newColor;
 *     }),
 *     take(config.stepCount),
 *     takeUntil(config.stop$));
 * }
 */
export type AnimationFn = (config: AnimationConfig) => Observable<ColorRgb>;
