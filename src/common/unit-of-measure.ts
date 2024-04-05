export function adcToCelsius(analog: number): number {
    let volts = analog * 3.3;
    let celsius = 27 - (volts - 0.706) / 0.001721;
    return celsius;
}
