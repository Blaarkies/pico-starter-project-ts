import { boardController } from '../board-controller';

export const mockPinMode = jest.fn(<typeof pinMode>(
    (pin: number | number[], mode?: number) =>
        boardController.pinMode(pin, mode)));

global.pinMode = mockPinMode;