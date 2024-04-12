import { SimulatedGpio } from './simulated-gpio';
import { SimulatedGpioController } from './simulated-gpio-controller';

export const gpioController = new SimulatedGpioController();

export * from './simulated-gpio';
export * from './simulated-gpio-controller';

jest.mock('gpio', () => ({
    GPIO: SimulatedGpio,
}), {virtual: true});