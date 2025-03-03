import {
    concat,
    Observable,
    timer,
} from 'rxjs';
import {
    repeat,
    scan,
} from 'rxjs/operators';

/**
 * Returns an observable that emits according to the time duration specified by
 * each element in `sequence`
 * @param sequence List of interval durations in milliseconds
 * @returns An observable that emits sequential numbers at the specified time intervals
 */
export function sequencedInterval(sequence: number[]): Observable<number> {
    return concat(...sequence.map(duration => timer(duration)))
        .pipe(
            repeat(),
            scan(acc => acc + 1, -1),
        );
}

/**
 * Returns a promise that resolves after the specified duration
 * @param durationMs Duration in milliseconds
 */
export function waitForDuration(durationMs: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, durationMs));
}
