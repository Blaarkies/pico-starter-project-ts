import { BoardController } from './board-controller';

type GlobalWithBoard = typeof global & {board: Partial<typeof board>};

export const mockedBoard = {
    adc: jest.fn(),
};
(global as GlobalWithBoard).board = mockedBoard;

export const boardController = new BoardController();