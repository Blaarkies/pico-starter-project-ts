import { buildSync } from 'esbuild';

export const unixSep = '/';

/**
 * Returns an array of unique elements in `list`
 * @param {Array} list Array potentially containing duplicate elements
 * @returns {[]}
 */
export function distinct(list) {
    return Array.from(new Set(list));
}

/**
 * Returns a promise that resolves after `durationMs` milliseconds
 * @param {number} durationMs Duration to wait in milliseconds
 * @returns {Promise<void>}
 */
export function wait(durationMs) {
    return new Promise(r => setTimeout(r, durationMs));
}

/**
 * Debounces a function so that it discards executions that occur too close
 * together during `delay` interval, then consolidate them into a single
 * invocation.
 * @param {Function} callback Function to debounce
 * @param {number} delay=1000 Debounce delay in milliseconds
 */
export class Debouncer {
    #fn;
    #delay;
    #timer = null;

    constructor(callback, delay = 1e3) {
        this.#fn = callback;
        this.#delay = delay;
    }

    /** Runs the callback function with debounce */
    execute(...args) {
        this.cancel();
        this.#timer = setTimeout(
            () => this.#fn(args),
            this.#delay,
        );
    }

    /** Terminates any pending run of the callback function */
    cancel() {
        if (this.#timer) {
            clearTimeout(this.#timer);
        }
    }

    /**
     * Runs the callback function immediately without debounce, and
     * cancels any pending run
     */
    trigger(...args) {
        this.cancel();
        this.#fn.apply(this, args);
    }

    /**
     * Updates the debounce delay. Any pending run of
     * the callback function remains unaffected */
    setDelay(delay) {
        this.#delay = delay;
    }

}

/**
 * Returns the minified version of `contents`
 * @param {string} contents Code block to minify
 * @returns {string}
 */
export function minify(contents) {
    return buildSync({
        write: false,
        minify: true,
        stdin: {contents},
    })
        .outputFiles[0]
        .text;
}

/**
 * Returns a serialize-deserialize string based on `obj` to transfer simple
 * data structures into string templates (such as injecting it into code blocks)
 * @param {Object} obj Plain javascript object to transfer
 * @returns {string}
 * @example
 * let files = ['index.html', 'style.css'];
 * // Code being sent to Pico
 * `let list = ${transferJson(files)};`
 * // This results in `list` being a valid JS object in the Pico
 */
export function transferJson(obj) {
    return `JSON.parse('${JSON.stringify(obj)}')`;
}