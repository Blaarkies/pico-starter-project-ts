import { minify, transferJson, wait } from './common.js';
import { sendCommand } from './pico-port-control.js';
import { readdir } from 'fs';

/**
 * Removes all files and directories from the Pico.
 * Returns a list of paths removed.
 * @returns {Promise<string[]>}
 */
export async function removeAllPaths() {
    let codeBlock = //language=js
`(() => {
let {readdir, stat, rm, rmdir} = require('fs');

let results = [];
let queue = [''];
while (queue.length) {
    let path = queue.pop();
    let contents = readdir(path);

    if (!contents.length) {
        if (path) {
            rmdir(path);
            results.push(path);
        }
        continue;
    }

    for (let p of contents) {
        let fullPath = [path, p].join('/');
        let pathStats = stat(fullPath);
        if (pathStats.isFile()) {
            rm(fullPath);
            results.push(fullPath);
        } else {
            queue.push(fullPath);
            queue.unshift('');
        }
    }
}
process.stdout.write(new TextEncoder().encode(
results.join(String.fromCharCode(10))
));
})();
`;
    let minified = minify(codeBlock);

    let output = await sendCommand(minified, {echo: false});
    await wait(200);
    return output;
}

/**
 * Create all directories given a list of paths.
 * @param {string[]} destinations Directory paths to create
 * @returns {Promise<string[]>}
 */
export async function makeAllDirs(destinations) {
    let codeBlock = //language=js
`
(() => {
let {exists, mkdir} = require('fs');
let destinations = ${transferJson(destinations)};

let results = [];
for (let destination of destinations) {
    if (!exists(destination)) {
        mkdir(destination);
        results.push(destination);
    }
}
process.stdout.write(new TextEncoder().encode(
    results.join(String.fromCharCode(10))
));
})();
`;
    let minified = minify(codeBlock);

    let output = await sendCommand(minified, {echo: false});
    await wait(200);
    return output;
}
