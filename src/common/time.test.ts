import { Stream } from 'kefir';
import {
    sequencedInterval,
    waitForDuration,
} from './time';

describe('sequencedInterval()', () => {

    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
        jest.clearAllTimers();
    });

    test('returns a new stream', () => {
        let sequence$ = sequencedInterval([100, 200]);

        expect(sequence$).toBeInstanceOf(Stream);
    });

    test('emits the iteration number', async () => {
        let sequence$ = sequencedInterval([100]);

        let spyCallback = jest.fn();
        sequence$.onValue(spyCallback);

        await jest.advanceTimersByTimeAsync(100);

        expect(spyCallback).toHaveBeenCalledWith(0);
    });

    test('emits only at specified intervals', async () => {
        let sequence$ = sequencedInterval([100, 500]);

        let spyCallback = jest.fn();
        sequence$.onValue(spyCallback);

        // 99 ms
        await jest.advanceTimersByTimeAsync(99);
        expect(spyCallback).not.toHaveBeenCalled();

        // 100 ms
        await jest.advanceTimersByTimeAsync(1);
        expect(spyCallback).toHaveBeenCalledTimes(1);

        // 599 ms
        await jest.advanceTimersByTimeAsync(499);
        expect(spyCallback).toHaveBeenCalledTimes(1);

        // 600 ms
        await jest.advanceTimersByTimeAsync(1);
        expect(spyCallback).toHaveBeenCalledTimes(2);
    });

    test('calling stop() prevents more emits', async () => {
        let sequence$ = sequencedInterval([100]);

        let spyCallback = jest.fn();
        sequence$.onValue(spyCallback);

        sequence$.stop();

        await jest.advanceTimersByTimeAsync(100);

        expect(spyCallback).not.toHaveBeenCalled();
    });

    test('sequence repeats', async () => {
        let sequence$ = sequencedInterval([100, 500]);

        let spyCallback = jest.fn();
        sequence$.onValue(spyCallback);

        // 100 ms
        await jest.advanceTimersByTimeAsync(100);
        expect(spyCallback).toHaveBeenCalledTimes(1);

        // 600 ms
        await jest.advanceTimersByTimeAsync(500);
        expect(spyCallback).toHaveBeenCalledTimes(2);

        // 700 ms
        await jest.advanceTimersByTimeAsync(100);
        expect(spyCallback).toHaveBeenCalledTimes(3);

        // 1200 ms
        await jest.advanceTimersByTimeAsync(500);
        expect(spyCallback).toHaveBeenCalledTimes(4);
    });

});

describe('waitForDuration()', () => {

    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
        jest.clearAllTimers();
    });

    test('returns a new promise', () => {
        let promise = waitForDuration(100);

        expect(promise).toBeInstanceOf(Promise);
    });

    test('emits void after durationMs the iteration number', async () => {
        let promise = waitForDuration(100);

        let spyCallback = jest.fn();
        promise.then(spyCallback);

        expect(spyCallback).not.toHaveBeenCalled();
        await jest.advanceTimersByTimeAsync(100);

        expect(spyCallback).toHaveBeenCalledWith(void 0);
    });

});