import { reverseBits } from './binary';

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