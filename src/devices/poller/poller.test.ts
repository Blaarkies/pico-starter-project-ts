import { boardController } from '../../test';
import { TimeStepRecorder } from '../../test/time-step-recorder';
import { Poller } from './poller';

describe('Poller', () => {

    let pin = 69;

    describe('constructor()', () => {
        beforeEach(() => boardController.restore());

        test('sets the correct pin', () => {
            new Poller(pin, {
                minDistance: .001,
                intervalLimits: [.1, .9],
                calibrationTransform: v => v,
            });

            let mock = boardController.mocks.boardAdc;
            expect(mock).toHaveBeenCalled();
            expect(mock).toHaveBeenCalledWith(pin);
        });
    });

    describe('onChange()', () => {

        let adcState: number;

        function toggleAdc(): number[] {
            let oldValue = adcState;
            adcState = adcState > 50 ? 10 : 90;
            boardController.mocks.boardAdc
                .mockReturnValue({
                    read: () => adcState,
                } as IADC);
            return [adcState, oldValue];
        }

        let poller: Poller;

        beforeAll(() => {
            jest.useFakeTimers();
        });

        afterAll(() => {
            jest.useRealTimers();
            jest.clearAllTimers();
        });

        beforeEach(() => {
            boardController.restore();
            jest.clearAllTimers();
        });

        test('calls callback with new read value', () => {
            let testPinValue = 42;
            boardController.mocks.boardAdc
                .mockReturnValue({
                    read: () => testPinValue,
                } as IADC);

            poller = new Poller(pin, {
                minDistance: .1,
                intervalLimits: [1, 100],
                calibrationTransform: v => v,
            });

            let callback = jest.fn();
            let disposeFn = poller.onChange(callback);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith(testPinValue, undefined);

            disposeFn();
        });

        test('calls callback on multiple polling events', async () => {
            let [testNewValue, testOldValue] = toggleAdc();

            poller = new Poller(pin, {
                minDistance: .1,
                intervalLimits: [1, 100],
                calibrationTransform: v => v,
            });

            let callback = jest.fn();
            let disposeFn = poller.onChange(callback);

            expect(callback).toHaveBeenCalledWith(testNewValue, testOldValue);

            [testNewValue, testOldValue] = toggleAdc();
            await jest.advanceTimersToNextTimerAsync();
            expect(callback).toHaveBeenCalledWith(testNewValue, testOldValue);

            disposeFn();
        });

        test('calling disposeFn stops polling events', async () => {
            toggleAdc();

            poller = new Poller(pin, {
                minDistance: .1,
                intervalLimits: [1, 100],
                calibrationTransform: v => v,
            });

            let callback = jest.fn();
            let disposeFn = poller.onChange(callback);

            expect(callback).toHaveBeenCalled();
            callback.mockClear();

            disposeFn();

            toggleAdc();
            await jest.advanceTimersToNextTimerAsync();
            expect(callback).not.toHaveBeenCalled();
        });

        describe('polling frequency', () => {

            let onChangeCallback: ReturnType<typeof jest.fn>;
            let disposeFn: ReturnType<Poller['onChange']>;

            beforeEach(() => {
                toggleAdc();

                poller = new Poller(pin, {
                    minDistance: .1,
                    intervalLimits: [1, 100],
                    calibrationTransform: v => v,
                });

                onChangeCallback = jest.fn();
                disposeFn = poller.onChange(onChangeCallback);

                expect(onChangeCallback).toHaveBeenCalled();
                onChangeCallback.mockClear();
            });

            afterEach(() => {
                disposeFn();
            })

            test('decelerates on read value stagnation', async () => {
                let recorder = new TimeStepRecorder();
                for (let i = 0; i < 10; i++) {
                    await jest.advanceTimersToNextTimerAsync();
                    recorder.mark();
                }

                expect(onChangeCallback).not.toHaveBeenCalled();

                let analysis = recorder.getAnalysis();
                expect(analysis.averageChange > 0).toBe(true);
                expect(analysis.averageAcceleration > 0).toBe(true);
                expect(analysis.isUniDirectional).toBe(true);
            });

            test('accelerates on read value changes', async () => {
                // Read stagnate values to reduce the polling frequency
                for (let i = 0; i < 10; i++) {
                    await jest.advanceTimersToNextTimerAsync();
                }

                let recorder = new TimeStepRecorder();
                recorder.mark();
                for (let i = 0; i < 5; i++) {
                    toggleAdc();
                    await jest.advanceTimersToNextTimerAsync();
                    recorder.mark();
                }

                expect(onChangeCallback).toHaveBeenCalled();

                let analysis = recorder.getAnalysis();
                expect(analysis.averageAcceleration < 0).toBe(true);
                expect(analysis.isUniDirectional).toBe(true);
            });

        });
    });

});