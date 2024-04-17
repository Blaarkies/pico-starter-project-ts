export { gpioController } from './gpio';
export { asmController } from './asm';
export { stateMachineController } from './state-machine';

export const mockMillis = jest.fn();
global.millis = mockMillis;
