import { Observable } from 'rxjs/internal/Observable';
import { concat } from 'rxjs/internal/observable/concat';
import { timer } from 'rxjs/internal/observable/timer';
import { repeat } from 'rxjs/internal/operators/repeat';
import { scan } from 'rxjs/internal/operators/scan';

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
