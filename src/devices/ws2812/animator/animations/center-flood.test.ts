import {
    animateCenterFloodIn,
    animateCenterFloodOut,
} from 'devices/ws2812/animator/animations/center-flood';
import {
    getUpdatedPixelIndexes,
    makeMockConfig,
} from 'devices/ws2812/animator/test-functions';

interface TestConfig {
    fn: typeof animateCenterFloodIn | typeof animateCenterFloodOut;
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
        fn: animateCenterFloodIn,
        mid: [0, 4, 1, 3],
        end: [2, 2],
    },
    {
        fn: animateCenterFloodOut,
        mid: [2, 2, 1, 3],
        end: [0, 4],
    },
];

let testCases10: TestConfig[] = [
    {
        fn: animateCenterFloodIn,
        mid: [0, 9, 1, 8, 2, 7],
        end: [3, 6, 4, 5],
    },
    {
        fn: animateCenterFloodOut,
        mid: [4, 5, 3, 6, 2, 7],
        end: [1, 8, 0, 9],
    },
];

let testCases50: TestConfig[] = [
    {
        fn: animateCenterFloodIn,
        mid: [0, 49, 1, 48, 2, 3, 47, 46, 4, 45, 5, 44, 6, 43, 7, 8, 42, 41, 9,
            40, 10, 39, 11, 38],
        end: [12, 13, 37, 36, 14, 35, 15, 34, 16, 33, 17, 18, 32, 31, 19, 30,
            20, 29, 21, 28, 22, 23, 27, 26, 24, 25],
    },
    {
        fn: animateCenterFloodOut,
        mid: [24, 25, 23, 26, 22, 21, 27, 28, 20, 29, 19, 30, 18, 31, 17, 16,
            32, 33, 15, 34, 14, 35, 13, 36],
        end: [12, 11, 37, 38, 10, 39, 9, 40, 8, 41, 7, 6, 42, 43, 5, 44, 4, 45,
            3, 46, 2, 1, 47, 48, 0, 49],
    },
];

describe('animateCenterFlood', () => {

    test.each([
        ...setLedCount(testCases5, 5),
        ...setLedCount(testCases10, 10),
        ...setLedCount(testCases50, 50),
    ])(`$ledCount LEDs $fn.name should fill pixels in flooding pattern`,
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