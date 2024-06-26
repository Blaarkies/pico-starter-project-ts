import { hslToRgb } from './color-space';

describe('hslToRgb()', () => {

    test.each`
hsl               | rgb 
// Hue tests
${[0, 1, .5]}     | ${[255, 0, 0]}
${[1 / 3, 1, .5]} | ${[0, 255, 0]}
${[2 / 3, 1, .5]} | ${[0, 0, 255]}
${[.01, 1, .5]}   | ${[255, 15, 0]}
// Saturation tests
${[0, 0, .5]}     | ${[128, 128, 128]}
${[0, .1, .5]}    | ${[140, 115, 115]}
${[0, .9, .5]}    | ${[242, 13, 13]}
${[0, .5, .7]}    | ${[217, 140, 140]}
${[0, .5, .3]}    | ${[115, 38, 38]}
// Luminosity tests
${[0, 1, 0]}      | ${[0, 0, 0]}
${[0, 1, .1]}     | ${[51, 0, 0]}
${[0, 1, .9]}     | ${[255, 204, 204]}
${[0, 1, 1]}      | ${[255, 255, 255]}
${[0, 0, 1]}      | ${[255, 255, 255]}
`('HSL $hsl converts to RGB $rgb',
        ({hsl, rgb}) => {
            let result = hslToRgb(hsl[0], hsl[1], hsl[2]);
            expect(result).toEqual(rgb);
        });

});