import { animateFade } from 'devices/ws2812/animator/animations/fade';
import { makeMockConfig } from 'devices/ws2812/animator/test-functions';

describe('animateFade()', () => {

    test('should animate pixel colors', async () => {
        jest.useFakeTimers();

        let {pixels, toRgb, config} = makeMockConfig({
            animationFn: animateFade
        });

        let job$ = config.animationFn(config);
        let subscription = job$.subscribe();

        await jest.advanceTimersByTimeAsync(1e3);
        let midColorRound = pixels.fillAllColor.mock.lastCall[0]
            .map(c => Math.round(c));
        expect(midColorRound).toEqual([73, 146, 186]);

        await jest.advanceTimersByTimeAsync(1e3);
        let finalColorRound = pixels.fillAllColor.mock.lastCall[0]
            .map(c => Math.round(c));
        expect(finalColorRound).toEqual(toRgb);

        expect(pixels.write).toHaveBeenCalled();

        subscription.unsubscribe();
        jest.useRealTimers();
    });

});