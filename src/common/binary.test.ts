import {
    bitwiseAndMask,
    reverseBits,
} from './binary';

describe('reverseBits()', () => {
    test('reverses the order of a byte', () => {
        let normal = '11010000';
        let reversed = '00001011';

        let normalNumber = parseInt(normal, 2);
        let reversedNumber = parseInt(reversed, 2);

        let result = reverseBits(normalNumber);
        expect(result).toBe(reversedNumber);
    });
});

describe('bitwiseAndMask()', () => {
    test.each([
        [0, 12, true],
        [4, 12, true],
        [8, 12, true],
        [3, 12, false],
        [16, 12, false],
    ])('when %d is masked on %d, it results in %d',
        (value, mask, expected) => {
        expect(bitwiseAndMask(value, mask)).toBe(expected);
    });
});