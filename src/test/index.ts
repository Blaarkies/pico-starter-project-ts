export * from './gpio';
export * from './asm';
export * from './state-machine';
export * from './board-controller';
export * from './digital-io';

export const mockMillis = jest.fn();
global.millis = mockMillis;
