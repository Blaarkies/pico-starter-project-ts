import { lerpRgbPixelLinear } from 'devices/ws2812/animator/lerp-color-channels';

describe('lerpRgbPixelLinear()', () => {

    test.each([
        [0, [0, 0, 0]],
        [.1, [37, 55, 74]],
        [.5, [95, 143, 191]],
        [.9, [122, 183, 245]],
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