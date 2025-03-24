import { makeNumberList } from 'common/enumerate';
import {
    animateSweepLeft,
    animateSweepRight,
} from 'devices/ws2812/animator/animations/sweep';
import {
    getUpdatedPixelIndexes,
    makeMockConfig,
} from 'devices/ws2812/animator/test-functions';

interface TestConfig {
    fn: typeof animateSweepRight | typeof animateSweepLeft;
    mid: number[];
    end: number[];
    ledCount?: number;
}

function setLedCount(list: TestConfig[], ledCount: number)
    : TestConfig[] {
    return list.map((o: TestConfig) => {
        o.ledCount = ledCount;
        return o;
    });
}

let testCases5: TestConfig[] = [
    {
        fn: animateSweepRight,
        mid: [0, 1, 2],
        end: [3, 4],
    },
    {
        fn: animateSweepLeft,
        mid: [4, 3, 2],
        end: [1, 0],
    },
];

let testCases10: TestConfig[] = [
    {
        fn: animateSweepRight,
        mid: makeNumberList(5),
        end: makeNumberList(5, 5),
    },
    {
        fn: animateSweepLeft,
        mid: makeNumberList(5, 5).reverse(),
        end: makeNumberList(5).reverse(),
    },
];

let testCases50: TestConfig[] = [
    {
        fn: animateSweepRight,
        mid: makeNumberList(24),
        end: makeNumberList(26, 24),
    },
    {
        fn: animateSweepLeft,
        mid: makeNumberList(24, 26).reverse(),
        end: makeNumberList(26).reverse(),
    },
];

describe('animateSweep', () => {

    test.each([
        ...setLedCount(testCases5, 5),
        ...setLedCount(testCases10, 10),
        ...setLedCount(testCases50, 50),
    ])(`$ledCount LEDs $fn.name should fill pixels in sweeping pattern`,
        async ({ledCount, fn, mid: midExpected, end: endExpected}) => {
            jest.useFakeTimers();

            let {pixels, toRgb, config} = makeMockConfig({
                animationFn: fn,
                ledCount,
            });

            let job$ = config.animationFn(config);
            let subscription = job$.subscribe();

            await jest.advanceTimersByTimeAsync(1e3);

            expect(pixels.setLedColor)
                .toHaveBeenCalledWith(expect.anything(), toRgb);

            expect(getUpdatedPixelIndexes(pixels)).toEqual(midExpected);
            pixels.setLedColor.mockClear();

            await jest.advanceTimersByTimeAsync(1e3);

            expect(getUpdatedPixelIndexes(pixels)).toEqual(endExpected);

            expect(pixels.write).toHaveBeenCalled();

            subscription.unsubscribe();
            jest.useRealTimers();
        });
});