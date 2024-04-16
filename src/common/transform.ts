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
