export { gpioController } from './gpio';

export const mockMillis = jest.fn();
global.millis = mockMillis;
