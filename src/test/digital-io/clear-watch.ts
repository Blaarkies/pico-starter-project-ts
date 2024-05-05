import { boardController } from '../board-controller';

export const mockClearWatch = jest.fn(<typeof clearWatch>(
    (pin: number) => boardController.clearWatch(pin)));

global.clearWatch = mockClearWatch;