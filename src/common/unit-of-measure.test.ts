import { adcToCelsius } from './unit-of-measure';

describe('adcToCelsius()', () => {

    test.each`
analog  | celsius
${.0}   | ${437.23}
${.1}   | ${245.48}
${.2}   | ${53.73}
${.21}  | ${34.55}
${.215} | ${24.97}
${.22}  | ${15.38}
${.24}  | ${-22.97}
${.5}   | ${-521.52}
${.9}   | ${-1288.51}
${.99}  | ${-1461.09}
`('given $analog from ADC, it returns $celsius ℃', ({analog, celsius}) => {
        let result = adcToCelsius(analog).toFixed(2);
        expect(parseFloat(result)).toBe(celsius);
    });

});