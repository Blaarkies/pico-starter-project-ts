import { lerpRgbPixelLinear } from 'devices/ws2812/animator/lerp-color-channels';

describe('lerpRgbPixelLinear()', () => {

    test.each([
        [0, [0, 0, 0]],
        [.1, [4, 5, 7]],
        [.5, [31, 46, 61]],
        [.9, [98, 147, 197]],
        [1, [127, 191, 255]],
    ])('at ratio [%d], should return %s interpolated color',
        (t, expected) => {
            let result = lerpRgbPixelLinear(
                [0, 0, 0],
                [127, 191, 255],
                t);
            let roundedResult = result.map(c => Math.round(c));
            expect(roundedResult).toEqual(expected);
        });

});