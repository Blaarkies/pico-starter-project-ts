/**
 * Reverses the bit order of `byte` and returns the result
 * <li> Important: Only supports 8-bit values
 */
export function reverseBits(byte: number): number {
    byte = ((byte & 0b11110000) >> 4) | ((byte & 0b00001111) << 4);
    byte = ((byte & 0b11001100) >> 2) | ((byte & 0b00110011) << 2);
    byte = ((byte & 0b10101010) >> 1) | ((byte & 0b01010101) << 1);
    return byte;
}

/**
 * Returns `true` if bit `value` is contained within bit `mask`
 * @param {number} value The bit value to check
 * @param {number} mask The bit mask to compare against
 */
export function bitwiseAndMask(value: number, mask: number): boolean {
    return (value & mask) === value;
}

