import SerialPort from '../node_modules/serialport/lib/index.js';
import { EventEmitter } from 'node:events';
import { Debouncer, wait } from './common.js';

const serialOptions = {
    autoOpen: false,
    baudRate: 115200,
};

// TODO: export code from @kaluma node_modules
async function findPort(portOrQuery = '@2e8a', exit = true) {
    let port = null;
    const ports = await SerialPort.list();
    ports.forEach((p) => {
        if (p.vendorId) {
            p.vendorId = p.vendorId.toLowerCase();
        }
        if (p.productId) {
            p.productId = p.productId.toLowerCase();
        }
    });
    if (portOrQuery.startsWith('@')) {
        const query = portOrQuery.substr(1).toLowerCase();
        let vid = null;
        let pid = null;
        if (query.includes(':')) {
            const terms = query.split(':');
            vid = terms[0];
            pid = terms[1];
        } else {
            vid = query;
        }
        let result = ports.find(
            (p) => p.vendorId === vid && (pid === null || p.productId === pid),
        );
        if (result) {
            port = result.path;
        }
    } else {
        let result = ports.find((p) => p.path === portOrQuery);
        if (result) {
            port = result.path;
        }
    }
    if (exit && port === null) {
        console.log(`port not found: ${portOrQuery}`);
        process.exit(2);
    }
    return port;
}

const dataEvent = new EventEmitter();

const port = await findPort();
const serial = new SerialPort(port, serialOptions);

let serialHandleData = data => {
    dataEvent.emit('data', data);
    serialCloseDebouncer.execute();
};

let serialCloseDebouncer = new Debouncer(() => {
    serial.close();
    serial.removeListener('data', serialHandleData);
}, 1e3);

/**
 * Close the serial port and wait for confirmation or error
 * @returns {Promise<Error | null>}
 */
export function closeSerialPort() {
    return new Promise(resolve => {
        serial.on('close', resolve);
        serialCloseDebouncer.trigger();
    });
}

/**
 * Return an open serial connection (and opens a new one if none are available).
 * The serial connection is automatically closed after `timeout` milliseconds
 * of inactivity to the `data` event.
 * @param timeout {number} Inactivity timeout in milliseconds
 * @returns {Promise<SerialPort>}
 */
export async function getOpenSerialPort(timeout = 500) {
    if (!serial.isOpen) {
        await openSerialPort();
    }

    serialCloseDebouncer.cancel();
    serialCloseDebouncer.setDelay(timeout);
    serialCloseDebouncer.execute();

    return serial;
}

/**
 * Open the serial port to connected Pico, with a data handler attached.
 * @returns {Promise<void>}
 */
async function openSerialPort() {
    let {promise, resolve, reject} = Promise.withResolvers();

    serial.on('data', serialHandleData);

    serial.open(async (err) => {
        if (err) {
            console.error(err);
            reject(err);
        }

        serialCloseDebouncer.execute();
        resolve();
    });

    return promise;
}

/**
 * Remove ANSI color codes from the string
 * @param text {string}
 * @returns {string}
 */
function ripAnsiCode(text) {
    return text.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

/**
 * Removes ANSI color codes and other fluff from the Kaluma shell output
 * @param lines {string[]} Array of strings to clean up
 * @returns {string[]}
 */
function lintLines(lines) {
    return lines.map(l => ripAnsiCode(l)
        .replaceAll('\r', '')
        .trim())
        .filter(l => !!l);
}

/**
 * Open the Kaluma shell on connected Pico, then sends the command to shell.
 * @param command {string} Input in the Kaluma shell
 * @param argsConfig {{echo: boolean}} Configuration for command handler
 * @returns {Promise<string[]>}
 */
export async function sendCommand(command, argsConfig = {}) {
    let config = Object.assign({echo: true}, argsConfig);

    let serial = await getOpenSerialPort();

    if (!config.echo) {
        serial.write(`\r.echo off\r`);
        await wait(10);
    }

    serial.write(`\r${command}\r`);

    if (!config.echo) {
        serial.write(`\r.echo on\r`);
    }

    let {promise, resolve, reject} = Promise.withResolvers();

    serial.drain(err => {
        if (err) {
            reject(err);
            return;
        }

        let output = [];
        let handleData = chunk => {
            output.push(...chunk);
            endDebouncer.execute();
        };

        let endDebouncer = new Debouncer(() => {
            dataEvent.removeListener('data', handleData);
            let outputLines = output
                .map(n => String.fromCharCode(n))
                .join('')
                .split('\n');
            let sanitized = lintLines(outputLines);

            if (!config.echo && sanitized.length) {
                // Remove 'undefined' string that is always returned by shell
                let lastIndex = sanitized.length - 1;
                sanitized[lastIndex] = sanitized[lastIndex]?.slice(0, -9);
            }
            resolve(sanitized);
        }, 50);

        dataEvent.addListener('data', handleData);
    });

    return promise;
}
