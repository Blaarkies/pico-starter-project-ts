import {
    boardController,
    mockMillis,
} from '../../test';
import { MultiActionButton } from './multi-action-button';

describe('MultiActionButton', () => {

    let pin = 69;

    describe('constructor()', () => {

        beforeEach(() => boardController.restore());

        test('sets the correct pin', () => {
            new MultiActionButton(pin);

            let mock = boardController.mocks.pinMode;
            expect(mock).toHaveBeenCalled();
            expect(mock).toHaveBeenCalledWith(pin, INPUT_PULLUP);
        });

        test('sets a watch on the pin', () => {
            new MultiActionButton(pin);

            let mock = boardController.mocks.setWatch;
            expect(mock).toHaveBeenCalled();
            expect(mock).toHaveBeenCalledWith(
                expect.any(Function), pin, CHANGE, expect.any(Number));
        });
    });

    describe('dispose()', () => {

        beforeEach(() => boardController.restore());

        test('removes the watch', () => {
            let watchId = 1;
            boardController.setWatchId = watchId;

            let button = new MultiActionButton(pin);
            button.dispose();

            let mock = boardController.mocks.clearWatch;
            expect(mock).toHaveBeenCalled();
            expect(mock).toHaveBeenLastCalledWith(watchId);
        });
    });

    describe('onPress()', () => {

        let button: MultiActionButton;

        beforeEach(() => {
            boardController.restore();
            mockMillis.mockReturnValue(0);
            button = new MultiActionButton(pin);
        });

        test('callback runs when button presses', () => {
            let callback = jest.fn();
            button.onPress(callback);

            boardController.triggerIrq(pin, FALLING);

            expect(callback).toHaveBeenCalled();
        });

        test('callback is removed when returned DisposeFn is called', () => {
            let callback = jest.fn();
            let disposeFn = button.onPress(callback);

            disposeFn();

            boardController.triggerIrq(pin, FALLING);

            expect(callback).not.toHaveBeenCalled();
        });

        test('nothing runs when button releases', () => {
            let callback = jest.fn();
            button.onPress(callback);

            boardController.triggerIrq(pin, RISING);
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('onRelease()', () => {

        let button: MultiActionButton;

        beforeEach(() => {
            boardController.restore();
            mockMillis.mockReturnValue(0);
            button = new MultiActionButton(pin);
        });

        test('callback runs when button releases', () => {
            let callback = jest.fn();
            button.onRelease(callback);

            boardController.triggerIrq(pin, RISING);

            expect(callback).toHaveBeenCalled();
        });

        test('callback runs when button releases long after a previous ' +
            'event', () => {
            let callback = jest.fn();
            button.onRelease(callback);

            // Trigger a button press, check that it is ignored
            boardController.triggerIrq(pin, FALLING);
            expect(callback).not.toHaveBeenCalled();

            mockMillis.mockReturnValue(500);
            boardController.triggerIrq(pin, RISING);

            expect(callback).toHaveBeenCalled();
        });

        test('callback is removed when returned DisposeFn is called', () => {
            let callback = jest.fn();
            let disposeFn = button.onRelease(callback);

            disposeFn();

            boardController.triggerIrq(pin, RISING);

            expect(callback).not.toHaveBeenCalled();
        });

        test('nothing runs when button presses', () => {
            let callback = jest.fn();
            button.onRelease(callback);

            boardController.triggerIrq(pin, FALLING);
            expect(callback).not.toHaveBeenCalled();
        });

    });

    describe('onChange()', () => {

        let button: MultiActionButton;

        beforeEach(() => {
            boardController.restore();
            mockMillis.mockReturnValue(0);
            button = new MultiActionButton(pin);
        });

        test('callback runs when button changes', () => {
            let now = 0;

            let callback = jest.fn();
            button.onChange(callback);

            boardController.triggerIrq(pin, RISING);
            expect(callback).toHaveBeenCalled();

            mockMillis.mockReturnValue(now += 50);
            boardController.triggerIrq(pin, FALLING);
            expect(callback).toHaveBeenCalledTimes(2);

            mockMillis.mockReturnValue(now += 50);
            boardController.triggerIrq(pin, CHANGE);
            expect(callback).toHaveBeenCalledTimes(3);
        });

        test('callback runs when button changes long after a previous ' +
            'event', () => {
            let callback = jest.fn();
            button.onChange(callback);

            // Trigger a button press, check that it is ignored
            boardController.triggerIrq(pin, FALLING);
            expect(callback).toHaveBeenCalled();

            mockMillis.mockReturnValue(500);
            boardController.triggerIrq(pin, RISING);

            expect(callback).toHaveBeenCalledTimes(2);
        });

        test('callback is removed when returned DisposeFn is called', () => {
            let callback = jest.fn();
            let disposeFn = button.onRelease(callback);

            disposeFn();

            boardController.triggerIrq(pin, RISING);

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('onLongPress()', () => {

        let button: MultiActionButton;
        let transitionMs = 500;

        beforeAll(() => {
            jest.useFakeTimers();
        });

        afterAll(() => {
            jest.useRealTimers();
            jest.clearAllTimers();
        });

        beforeEach(() => {
            boardController.restore();
            mockMillis.mockReturnValue(0);
            button = new MultiActionButton(pin);
            jest.clearAllTimers();
        });

        test('startFn runs when button is held down for transitionMs' +
            '', () => {
            let now = 100;
            mockMillis.mockReturnValue(now);

            let startFn = jest.fn();
            button.onLongPress({
                startFn,
                transitionMs,
            });

            boardController.triggerIrq(pin, FALLING);
            expect(startFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(transitionMs - 1);
            expect(startFn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(1);
            expect(startFn).toHaveBeenCalled();
        });

        test('endFn runs when button is released after transitionMs' +
            '', () => {
            let now = 100;
            mockMillis.mockReturnValue(now);

            let endFn = jest.fn();
            button.onLongPress({
                endFn,
                transitionMs,
            });

            boardController.triggerIrq(pin, FALLING);
            expect(endFn).not.toHaveBeenCalled();

            mockMillis.mockReturnValue(now += transitionMs);
            jest.advanceTimersByTime(transitionMs);
            expect(endFn).not.toHaveBeenCalled();

            boardController.triggerIrq(pin, RISING);
            expect(endFn).toHaveBeenCalled();
        });

        test('repeatFn runs repeatedly when button is held down after ' +
            'transitionMs', async () => {

            let now = 100;
            let intervalMs = 100;
            mockMillis.mockReturnValue(now);

            let repeatFn = jest.fn();
            button.onLongPress({
                repeatFn,
                transitionMs,
                intervalMs,
            });

            boardController.triggerIrq(pin, FALLING);
            expect(repeatFn).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(transitionMs);
            expect(repeatFn).toHaveBeenCalledTimes(1);

            await jest.advanceTimersByTimeAsync(intervalMs);
            expect(repeatFn).toHaveBeenCalledTimes(2);

            // Confirm that it stopped repeating after releasing button
            repeatFn.mockReset();

            boardController.triggerIrq(pin, RISING);
            await jest.advanceTimersByTimeAsync(intervalMs);
            expect(repeatFn).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(intervalMs);
            expect(repeatFn).not.toHaveBeenCalled();
        });

        test('onRelease callback run when button releases before transitionMs' +
            '', () => {
            let now = 100;
            mockMillis.mockReturnValue(now);

            button.onLongPress({transitionMs});
            let callback = jest.fn();
            button.onRelease(callback);

            boardController.triggerIrq(pin, FALLING);

            mockMillis.mockReturnValue(now += transitionMs - 1);

            boardController.triggerIrq(pin, RISING);

            expect(callback).toHaveBeenCalled();
        });
    });
});
