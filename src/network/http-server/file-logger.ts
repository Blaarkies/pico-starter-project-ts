import {
    Logger,
    LoggingSeverity,
} from 'network/http-server/types';
import {
    close,
    exists,
    open,
    write,
    writeFile,
    stat,
} from 'fs';

function now(): string {
    return new Date().toISOString();
}

export class FileLogger implements Logger {

    get logsFilename(): string {
        return this.filename;
    }

    private currentFileSize: number;

    constructor(
        private filename = 'logs.txt',
        private maxFileSize: number = 20 * 1024,
    ) {
        if (!exists(filename)) {
            writeFile(this.filename, Uint8Array.from([]));
            this.currentFileSize = 0;
            return;
        }

        this.currentFileSize = stat(filename).size;
    }

    write(message: string, severity: LoggingSeverity = 'info') {
        let output = `>> [${now()}] ${message}`;
        if (severity === 'info') {
            console.log(output);
        } else {
            console.error(output);
        }

        // When file is full, overwrite it instead
        let writeMode = 'a';
        if (this.currentFileSize > this.maxFileSize) {
            this.currentFileSize = 0;
            writeMode = 'w';
        }

        let fileDescriptor = open(this.filename, writeMode);

        let logString = `[${now()}] [${severity}] ${message.trim()}\n`;
        let dataBuffer = logString.split('').map(c => c.charCodeAt(0));
        this.currentFileSize += dataBuffer.length;

        write(fileDescriptor, Uint8Array.from(dataBuffer));

        close(fileDescriptor);
    }

}