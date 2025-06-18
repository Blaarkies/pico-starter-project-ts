import { EventEmitter } from 'events';

export class LoggingStream extends EventEmitter<'error'> {
    private decoder = new TextDecoder();

    write(chunk: Uint8Array) {
        console.log(this.decoder.decode(chunk));
    }

    // TODO implement `pipe()` method, extend `Writable`
}