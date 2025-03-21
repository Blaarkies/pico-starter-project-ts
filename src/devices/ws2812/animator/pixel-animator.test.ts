import { ColorRgb } from 'common/color-space';
import { makeMockWs2812 } from 'devices/ws2812/animator/test-functions';
import { PixelAnimator } from './pixel-animator';

describe('PixelAnimator', () => {

    describe('constructor()', () => {

        test('given good args, not throw errors', () => {
            expect(() => new PixelAnimator(makeMockWs2812())).not.toThrow();
        });

        test('given a bad fps, throw error', () => {
            expect(() => new PixelAnimator(makeMockWs2812(), -1)).toThrow();
        });

        test.each([
            [[-1, 0, 0]],
            [[256, 0, 0]],
            [[Number.NaN, 0, 0]],
        ])(`given a bad defaultColor %s, throw error`,
            (value: ColorRgb) => {
                expect(() => new PixelAnimator(makeMockWs2812(), 60, value))
                    .toThrow();
            });


    });

    describe('setToColor()', () => {

        test('given good args, it fills and writes pixels', async () => {
            let mockWs2812 = makeMockWs2812();
            let pixelAnimator = new PixelAnimator(mockWs2812, 10, [0, 0, 0]);


            await pixelAnimator.setToColor([255, 127, 63]);

            expect(mockWs2812.fillAllColor).toHaveBeenCalledTimes(10);
            expect(mockWs2812.fillAllColor)
                .toHaveBeenLastCalledWith([255, 127, 63]);

            expect(mockWs2812.write).toHaveBeenCalledWith();
        });

        test('a new overlapping animation cancels the old animation',
            async () => {
                let mockWs2812 = makeMockWs2812();
                let pixelAnimator
                    = new PixelAnimator(mockWs2812, 10, [0, 0, 0]);

                jest.useFakeTimers();

                // "red" animation starts
                pixelAnimator.setToColor([255, 0, 0], {duration: 10e3});

                await jest.advanceTimersByTimeAsync(1e3);
                expect(mockWs2812.fillAllColor.mock.lastCall[0][0]).toBeGreaterThan(50);
                // "red" animation running

                // "blue" animation starts
                pixelAnimator.setToColor([0, 0, 255], {duration: 1e3});

                await jest.advanceTimersByTimeAsync(1e3);
                expect(mockWs2812.fillAllColor)
                    .toHaveBeenLastCalledWith([0, 0, 255]);
                // "blue" animation completed to a final color

                // wait to confirm if "red" animation is still running
                await jest.advanceTimersByTimeAsync(3e3);
                // 5 seconds after start

                expect(mockWs2812.fillAllColor)
                    .toHaveBeenLastCalledWith([0, 0, 255]);
                // the last call was "blue",
                // thus the "red" animation stopped early

                jest.useRealTimers();
            });

        test('fromRgb color is saved from old animation on peaceful completion',
            async () => {
                let mockWs2812 = makeMockWs2812();
                let pixelAnimator
                    = new PixelAnimator(mockWs2812, 10, [0, 0, 0]);

                jest.useFakeTimers();

                pixelAnimator.setToColor([255, 0, 0], {duration: 1e3});
                await jest.advanceTimersByTimeAsync(1e3);
                expect(mockWs2812.fillAllColor)
                    .toHaveBeenLastCalledWith([255, 0, 0]);

                pixelAnimator.setToColor([0, 0, 255], {duration: 2e3});

                await jest.advanceTimersByTimeAsync(1e3);

                let redValue = mockWs2812.fillAllColor.mock.lastCall[0][0];
                expect(redValue).toBeGreaterThan(0);
                expect(redValue).toBeLessThan(255);

                jest.useRealTimers();
            });

        test('fromRgb color is saved from old animation on terminated ' +
            'completion',
            async () => {
                let mockWs2812 = makeMockWs2812();
                let pixelAnimator
                    = new PixelAnimator(mockWs2812, 10, [0, 0, 0]);

                jest.useFakeTimers();

                pixelAnimator.setToColor([255, 0, 0], {duration: 3e3});
                await jest.advanceTimersByTimeAsync(1e3);
                expect(mockWs2812.fillAllColor.mock.lastCall[0][0])
                    .toBeGreaterThan(0);

                pixelAnimator.setToColor([0, 0, 255], {duration: 2e3});

                await jest.advanceTimersByTimeAsync(1e3);

                let redValue = mockWs2812.fillAllColor.mock.lastCall[0][0];
                expect(redValue).toBeGreaterThan(0);
                expect(redValue).toBeLessThan(255);

                jest.useRealTimers();
            });

    });

});