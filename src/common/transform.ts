/**
 * Transforms `value` logarithmically by the amount of `skewFactor`
 * @example
 * // To skew a distribution of numbers to larger values
 * let initial = .5;
 * let adjusted = toLog(initial);
 * // adjusted == 0.747
 * @param value
 * @param skewFactor
 */
export function toLog(value: number, skewFactor: number = 10): number {
    return Math.log10(value * skewFactor + 1) / Math.log10(skewFactor + 1);
}

/**
 * Transforms `value` exponentially by the amount of `skewFactor`
 * @example
 * // The apparent brightness of lights follow a log curve
 * let ledLightLevel = 0.5; // Seems fairly bright in reality
 *                          // for only 50% power
 * let adjustedLevel = toExp(ledLightLevel);
 * // adjustedLevel == 0.24
 * @param value
 * @param skewFactor
 */
export function toExp(value: number, skewFactor: number = 10): number {
    return (Math.pow(skewFactor, value) - 1) / (skewFactor - 1);
}


/**
 * Coerces `value` into the range limits of `min` and `max`.
 * @param value
 * @param min
 * @param max
 */
export function coerce(value: number,
                       min = Number.MIN_SAFE_INTEGER,
                       max = Number.MAX_SAFE_INTEGER): number {
    return value < min
           ? min
           : value > max
             ? max
             : value;
}

/**
 * Normalizes `value` between `min` and `max` so that it fits in the range
 * [0, 1]. Values beyond this range will be coerced into the range [0, 1].
 * @param value
 * @param min
 * @param max
 */
export function normalize(value: number, min: number, max: number): number {
    let normalized = (value - min) / (max - min);
    return coerce(normalized, 0, 1);
}
