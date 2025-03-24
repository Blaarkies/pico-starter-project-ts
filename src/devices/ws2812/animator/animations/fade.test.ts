import { ColorRgb } from 'common/color-space';
import { animateFade } from 'devices/ws2812/animator/animations/fade';
import {
    makeMockConfig,
    makeMockWs2812,
} from 'devices/ws2812/animator/test-functions';

function getRoundedColorOfLastFillAllColorCall(
    pixels: ReturnType<typeof makeMockWs2812>,
): ColorRgb {
    return pixels.fillAllColor.mock.lastCall[0]
        .map(c => Math.round(c)) as ColorRgb;
}

describe('animateFade()', () => {

    test('should gradually animate pixel colors', async () => {
        jest.useFakeTimers();

        let timingColors: ColorRgb[] = [
            [0, 0, 0],
            [9, 17, 22],
            [24, 48, 61],
            [51, 103, 131],
            [100, 200, 255],
        ];

        let {pixels, config} = makeMockConfig({
            animationFn: animateFade,
            duration: 5e3,
            fps: 1,
            toRgb: timingColors.at(-1),
        });

        let job$ = config.animationFn(config);
        let subscription = job$.subscribe();

        await jest.advanceTimersToNextTimerAsync();

        for (let timingColor of timingColors) {
            expect(getRoundedColorOfLastFillAllColorCall(pixels))
                .toEqual(timingColor);
            await jest.advanceTimersByTimeAsync(1e3);
        }

        expect(pixels.write).toHaveBeenCalled();

        subscription.unsubscribe();
        jest.useRealTimers();
    });

});