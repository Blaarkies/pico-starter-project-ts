import {
    Emitter,
    Stream,
    stream,
} from 'kefir';

export type Subject<T, S> = Stream<T, S> & { next: (value: T) => void };

export function subject<T = void, S = unknown>(): Subject<T, S> {
    let streamEmitter: Emitter<T, S>;
    let source$ = stream<T, S>(emitter => {
        streamEmitter = emitter;
    }) as Subject<T, S>;

    // Trigger stream to set emitter
    let callback = () => undefined;
    source$.onValue(callback);
    source$.offValue(callback);

    source$.next = value => streamEmitter.value(value);

    return source$;
}
