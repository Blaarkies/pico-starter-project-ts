import { SimulatedGpio } from './simulated-gpio';
import { SimulatedGpioController } from './simulated-gpio-controller';

export const gpioController = new SimulatedGpioController();

export * from './simulated-gpio';
export * from './simulated-gpio-controller';

export const mockMillis = jest.fn();
global.millis = mockMillis;

jest.mock('gpio', () => ({
    GPIO: SimulatedGpio,
}), {virtual: true});