import { gpioController } from '../test';
import { MultiActionButton } from './multi-action-button';

describe('MultiActionButton', () => {

    describe('constructor()', () => {

        let pin = 69;

        beforeEach(() => gpioController.restore());

        test('sets the correct pin', () => {
            new MultiActionButton(pin);

            let mock = gpioController.getMock('constructor');
            expect(mock).toHaveBeenCalled();
            expect(mock).toHaveBeenCalledWith(
                pin, INPUT_PULLUP);
        });

        test('sets an irq event', () => {
            new MultiActionButton(pin);

            let mock = gpioController.getMock('irq', pin);
            expect(mock).toHaveBeenCalled();
            expect(mock).toHaveBeenCalledWith(
                expect.any(Function), CHANGE);
        });
    });

    describe('dispose()', () => {

        beforeEach(() => gpioController.restore());

        test('removes the irq the pin', () => {
            let pin = 69;
            let button = new MultiActionButton(pin);

            button.dispose();

            let mock = gpioController.getMock('irq', pin);
            expect(mock).toHaveBeenCalled();
            expect(mock).toHaveBeenLastCalledWith(undefined);
        });
    });

    describe('onPress()', () => {

        let pin = 69;

        beforeEach(() => gpioController.restore());

        test('callback runs when button presses', () => {
            let button = new MultiActionButton(pin);

            let callback = jest.fn();
            button.onPress(callback);

            gpioController.triggerIrq(pin, FALLING);

            expect(callback).toHaveBeenCalled();
        });
    });
});