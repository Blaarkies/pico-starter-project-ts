import { bitwiseAndMask } from '../../common';
import { boardController } from '../board-controller';

export const mockSetWatch = jest.fn(<typeof setWatch>(
    (callback, watchPin, events, debounce) => {
        boardController.setWatch(callback, watchPin, events, debounce);

        boardController.irqEvent$
            .filter(({pin, status}) => pin === watchPin
                && bitwiseAndMask(status, events))
            .onValue(({pin}) => callback(pin));

        return boardController.idForSetWatch();
    }));

global.setWatch = mockSetWatch;