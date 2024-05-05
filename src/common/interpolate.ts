/**
 * Linearly interpolate to find the value between `v0` and `v1` at the
 * position `t`
 * @param v0 number smaller than `v1`
 * @param v1 number larger than `v0`
 * @param t number in range [0-1]
 */
export function lerp(v0: number, v1: number, t: number): number {
    return (1 - t) * v0 + t * v1;
}
