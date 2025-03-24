import {
    close,
    exists,
    open,
    write,
    writeFile,
    stat,
} from 'fs';
import {
    Logger,
    LoggerSeverity,
} from 'network/http-server/types';


function now(): string {
    return new Date().toISOString();
}

type FileReadFlags = Parameters<typeof open>[1];

/**
 * A logger that saves logs to a specified text file in utf8 format. It will
 * overwrite previous logs when the file exceeds `maxFileSize`
 */
export class FileLogger implements Logger {

    get logsFilename(): string {
        return this.filename;
    }

    private currentFileSize: number;

    constructor(
        private filename = 'logs.txt',
        private maxFileSize = 20 * 1024,
    ) {
        if (!exists(filename)) {
            writeFile(this.filename, Uint8Array.from([]));
            this.currentFileSize = 0;
            return;
        }

        this.currentFileSize = stat(filename).size;
    }

    log(message: string, severity: LoggerSeverity = 'info'): void {
        let output = `${now()} ${severity.toUpperCase()} ${message}`;
        if (severity === 'info') {
            console.log(output);
        } else {
            console.error(output);
        }

        // When file is full, overwrite it instead
        let writeMode: FileReadFlags = 'a';
        if (this.currentFileSize > this.maxFileSize) {
            this.currentFileSize = 0;
            writeMode = 'w';
        }

        let fileDescriptor = open(this.filename, writeMode);

        let dataBuffer = output.split('').map(c => c.charCodeAt(0));
        this.currentFileSize += dataBuffer.length;

        write(fileDescriptor, Uint8Array.from(dataBuffer));

        close(fileDescriptor);
    }

}