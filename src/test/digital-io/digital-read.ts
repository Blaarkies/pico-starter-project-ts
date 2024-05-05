import { boardController } from '../board-controller';

export const mockDigitalRead = jest.fn(
    (pin: number) => boardController.digitalRead(pin));

global.digitalRead = mockDigitalRead;