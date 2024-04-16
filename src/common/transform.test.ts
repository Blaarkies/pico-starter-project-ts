import {
    toExp,
    toLog,
} from './transform';

describe('toLog()', () => {

    test('returns a non-linear transformed value', () => {
        let initial = .5;
        let transformed = toLog(initial);

        expect(transformed).not.toBe(initial);
    });

    test('returns a larger value according to a right skewed graph', () => {
        let initial = .5;
        let transformed = toLog(initial);

        expect(transformed).toBeGreaterThan(initial);
    });

    test('skewFactor affects the transformation', () => {
        let initial = .5;
        let transformed = toLog(initial, 3);
        let skewed = toLog(initial, 10);
        let verySkewed = toLog(initial, 40);

        expect(transformed).toBeGreaterThan(initial);
        expect(skewed).toBeGreaterThan(transformed);
        expect(verySkewed).toBeGreaterThan(skewed);
    });

});

describe('toExp()', () => {

    test('returns a non-linear transformed value', () => {
        let initial = .5;
        let transformed = toExp(initial);

        expect(transformed).not.toBe(initial);
    });

    test('returns a smaller value according to a left skewed graph', () => {
        let initial = .5;
        let transformed = toExp(initial);

        expect(transformed).toBeLessThan(initial);
    });

    test('skewFactor affects the transformation', () => {
        let initial = .5;
        let transformed = toExp(initial, 1.1);
        let skewed = toExp(initial, 2);
        let verySkewed = toExp(initial, 14);

        expect(transformed).toBeLessThan(initial);
        expect(skewed).toBeLessThan(transformed);
        expect(verySkewed).toBeLessThan(skewed);
    });

});