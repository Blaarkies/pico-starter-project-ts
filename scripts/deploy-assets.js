import {
    createReadStream,
    createWriteStream,
    existsSync,
    mkdirSync,
    readdirSync,
    statSync,
} from 'node:fs';
import { sep } from 'node:path';
import { execSync } from 'node:child_process';
import { createGzip } from 'node:zlib';
import { makeAllDirs, removeAllPaths } from './kaluma-script-control.js';
import { distinct, unixSep } from './common.js';
import { closeSerialPort } from './pico-port-control.js';

/**
 * Web Server assets deployment script.
 *
 * This script copies files from this project's `webServerAssetsPath` directory
 * to the `destinationDir` on the Pico.
 *
 * It is intended as a build step to update html/css/js assets for a website
 * server hosted on the Pico.
 *
 * Script steps:
 * - Remove all files from the Pico
 * - Create empty directories for the new web server assets files
 * - Copy each web server assets into the correct directory
 *
 * @faq
 * - The KalumaJS CLI `put` command fails on copying octet(binary) data, such as
 * `.ico` files or any other none text based data.
 * - Gzip files are not yet supported, because it is an octet data format.
 */

let webServerAssetsPath = 'web-server-assets';
let destinationDir = 'assets';

/**
 * Compress the file given by `inflatedPath` and write it to `gzipPath`
 * @param inflatedPath
 * @param gzipPath
 * @returns {Promise<void>}
 */
async function gzipFile(inflatedPath, gzipPath) {
    let dirPath = gzipPath.split(unixSep).slice(0, -1).join(unixSep);
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath);
    }

    let {promise, resolve} = Promise.withResolvers();

    createReadStream(inflatedPath)
        .pipe(createGzip())
        .pipe(createWriteStream(gzipPath))
        .on('close', resolve);

    return promise;
}

async function run() {
    // let gzipDirectory = 'gzip';
    // let gzipDirCheck = ['', gzipDirectory, ''].join(unixSep);
    let paths = Array.from(readdirSync(webServerAssetsPath, {recursive: true}))
        .map(p => [webServerAssetsPath, p]
            .join(unixSep)
            .replace(sep, unixSep));
    // .filter(p => !p.includes(gzipDirCheck));

    let inflatedFiles = paths
        .filter(p => !p.includes('.ico')) // octet(binary) files not supported by kaluma put
        .filter(path => statSync(path).isFile())
        .map(filepath => {
            let internalPath = filepath.split(webServerAssetsPath + unixSep).at(-1);

            // add leading "/" for the Pico unix file system
            let destination = ['', destinationDir, internalPath].join(unixSep);

            return [filepath, destination];
        });

    let directoriesOfFiles = distinct(
        paths.filter(path => statSync(path).isDirectory()),
    )
        .map(dirPath => {
            let internalPath = dirPath.split(webServerAssetsPath + unixSep).at(-1);
            return [destinationDir, internalPath].join(unixSep);
        });
    let directories = [destinationDir, ...directoriesOfFiles];

// let deflatedFiles = [];
// for (let fileLink of inflatedFiles) {
//     let inflatedPath = fileLink[0];
//
//     // replace 1st separator '/' with the gzip dir name,
//     // wrapped in separators
//     let gzipPath = inflatedPath.replace(unixSep, gzipDirCheck)
//         + '.gz';
//     await gzipFile(inflatedPath, gzipPath);
//
//     deflatedFiles.push([gzipPath, fileLink[1]])
// }

    let removeNotes = await removeAllPaths();
    console.log('Removed dirs/files: ', removeNotes);

    let makeDirNotes = await makeAllDirs(directories);
    console.log('Made dirs: ', makeDirNotes);

    await closeSerialPort();

    let results = [];
    for (let [origin, destination] of inflatedFiles) {
        execSync(`kaluma put ${origin} ${destination}`);
        results.push(destination);
    }
    console.log('Copied files:', results);
}

run();
