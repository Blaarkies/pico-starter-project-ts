import { promiseTry } from 'common/async';
import { waitForDuration } from 'common/time';
import { EventEmitter } from 'events';
import {
    close,
    open,
    read,
} from 'fs';
import { Writable } from 'stream';

type ReadableEvents =
    | 'close'
    | 'data'
    | 'end'
    | 'error'
    | 'pause'
    // | 'readable'
    | 'resume';

/**
 * Simple implementation of node.js `createFileReadStream()` function. Given a
 * file path it will open, read, and close the file according to the Stream API
 * interface. Use the `pipe()` method to send the file data into writable stream
 * @example
 * new FileReadStream('logs.txt').pipe(httpServerResponse);
 */
export class FileReadStream extends EventEmitter<ReadableEvents> {

    /*
    readable: boolean;
    readableAborted: boolean;
    readableDidRead: boolean;
    readableEncoding: boolean;
    readableLength: boolean;
    readableObjectMode: boolean;
    */

    private closed: boolean;
    private destroyed: boolean;
    private errored: boolean;
    private readableFlowing: boolean;
    private readableEnded: boolean;
    private readableHighWaterMark: number;
    private fileDescriptor: number = null;
    private internalBuffer: Uint8Array;

    constructor(
        private filePath: string,
        config?: { highWaterMark?: number },
    ) {
        super();

        this.readableHighWaterMark = config?.highWaterMark || 64;
        this.internalBuffer = new Uint8Array(this.readableHighWaterMark);

        promiseTry(() => this.fileDescriptor = open(this.filePath, 'r'))
            .catch((e: Error) => this.destroy(e));
    }

    isPaused() {
        return !this.readableFlowing;
    }

    read(size?: number) {
        if (this.closed || this.readableEnded || this.destroyed) {
            throw new Error('Cannot read a stopped stream');
        }

        let length = Math.min(
            size || this.readableHighWaterMark,
            this.readableHighWaterMark);

        promiseTry(() => {
            let bytesRead = read(
                this.fileDescriptor,
                this.internalBuffer,
                0,
                length);

            if (bytesRead === length) {
                this.push(this.internalBuffer);
            } else if (bytesRead) {
                this.readableEnded = true;
                this.push(this.internalBuffer.slice(0, bytesRead));
                this.end();
            } else {
                this.readableEnded = true;
                this.end();
            }
        })
            .catch((e: Error) => {
                console.error(`Could not read file ${this.filePath}`,
                    e?.message);
                this.destroy(e);
            });
    }

    private destroy(e?: Error) {
        if (e) {
            this.emit('error', e);
            this.errored = true;
        }

        if (this.fileDescriptor) {
            promiseTry(() => close(this.fileDescriptor))
                .catch((e: Error) =>
                    console.error(`Could not close file ${this.filePath}`,
                        e?.message));
        }

        this.emit('close');
        this.closed = true;
        this.destroyed = true;
        this.readableEnded = true;

        delete this.internalBuffer;

        super.removeAllListeners();
    }

    private pause() {
        this.readableFlowing = false;
        this.emit('pause');
    }

    private resume() {
        this.readableFlowing = true;
        this.emit('resume');
    }

    private push(chunk: Uint8Array) {
        this.emit('data', chunk);
    }

    end() {
        this.emit('end');
    }

    async readYield(size?: number): Promise<ReturnType<typeof this.read>> {
        await waitForDuration(0);
        return this.read();
    }

    pipe(destination: Writable): Writable {
        const onData = (chunk: Uint8Array) => {
            destination.write(chunk);
            if (!this.readableEnded) {
                this.readYield();
            }
        };

        const onEnd = async () => {
            destination.end();
            destination.off('error', onError);

            this.off('data', onData);
            this.off('error', onError);

            await waitForDuration(0);
            this.destroy();
        };
        const onError = (e: Error) => {
            console.log('onError', e?.message);
            this.destroy(e);
        };

        this.on('data', onData)
            .once('end', onEnd)
            .once('error', onError);

        destination.once('error', onError);

        this.readYield();

        return destination;
    }

    /*
    setEncoding(encoding)
    unpipe([destination])
    unshift(chunk[, encoding])
    wrap(stream)
    */

}