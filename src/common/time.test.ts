import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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

    test('returns an observable', () => {
        const sequence$ = sequencedInterval([100, 200]);

        expect(typeof sequence$.subscribe).toBe('function');
    });

    test('emits the iteration number', async () => {
        const sequence$ = sequencedInterval([100]);
        const values: number[] = [];

        const subscription = sequence$.subscribe(val => values.push(val));

        await jest.advanceTimersByTimeAsync(100);
        expect(values).toEqual([0]);

        subscription.unsubscribe();
    });

    test('emits only at specified intervals', async () => {
        const sequence$ = sequencedInterval([100, 500]);
        const values: number[] = [];

        const subscription = sequence$.subscribe(val => values.push(val));

        await jest.advanceTimersByTimeAsync(99);
        expect(values).toEqual([]);

        await jest.advanceTimersByTimeAsync(1);
        expect(values).toEqual([0]);

        await jest.advanceTimersByTimeAsync(499);
        expect(values).toEqual([0]);

        await jest.advanceTimersByTimeAsync(1);
        expect(values).toEqual([0, 1]);

        subscription.unsubscribe();
    });

    test('can be stopped with takeUntil', async () => {
        const stop$ = new Subject<void>();
        const sequence$ = sequencedInterval([100]).pipe(
            takeUntil(stop$),
        );

        const values: number[] = [];
        const subscription = sequence$.subscribe(val => values.push(val));

        stop$.next(); // Stop immediately

        await jest.advanceTimersByTimeAsync(100);
        expect(values).toEqual([]);

        subscription.unsubscribe();
    });

    test('sequence repeats', async () => {
        const sequence$ = sequencedInterval([100, 500]);
        const values: number[] = [];

        const subscription = sequence$.subscribe(val => values.push(val));

        await jest.advanceTimersByTimeAsync(100);
        expect(values).toEqual([0]);

        await jest.advanceTimersByTimeAsync(500);
        expect(values).toEqual([0, 1]);

        await jest.advanceTimersByTimeAsync(100);
        expect(values).toEqual([0, 1, 2]);

        await jest.advanceTimersByTimeAsync(500);
        expect(values).toEqual([0, 1, 2, 3]);

        subscription.unsubscribe();
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