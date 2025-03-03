import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

let additionalArgs = process.argv
    .filter(arg => arg.startsWith('--'))
    .reduce((sum, c) => {
        let arg = c.split('--')[1];
        sum[arg] = true;
        return sum;
    }, {addSecrets: true});

let config = {
    entryPoints: ['src/main.ts'],
    bundle: true,
    outdir: 'dist',
    platform: 'node',
    target: 'es2018',
    legalComments: 'none',
    external: [
        'led',
        'rp2',
        'storage',
        'gpio',
        'wifi',
        'http',
        'pico_cyw43',
    ],
    minify: additionalArgs.minify,
    treeShaking: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    sourcemap: false,
    logLevel: 'info',
};

await build(config).catch(e => {
    console.error(e);
    process.exit(1);
});

/*
// Analyze build imports
import {analyzeMetafile} from 'esbuild';
let result = await build({
    ...config,
    metafile: true,
});
console.log(await analyzeMetafile(result.metafile));
*/

/**
 * Post build steps
 * - Remove console.logs
 * - Replace secrets placeholders with local-secret.json
 */

/** Read built file into string contents */
let outputFileName = config.entryPoints[0]
    .split('/')[1]
    .replace('ts', 'js');
let filePath = `${config.outdir}/${outputFileName}`;

let fileContents;

/** Perform additional minification (remove console logs) */
if (additionalArgs.minify) {
    fileContents ??= readFileSync(filePath, {encoding: 'utf8'});

    let regexConsoleX = /console\.(log|warn|error|info)\(([^)]*)\);?/g;
    let regexStringMessages = /(["'`])(?:(?=(\\?))\2.)*?\1/g;

    function inBytes(text) {
        let rounding = 1e1;
        let size = Math.round(rounding * text.length / 1024);
        return `${(size / rounding).toFixed(1)}KB`;
    }

    let oldSize = inBytes(fileContents);

    fileContents = fileContents
        .replace('\n', '')
        .replace(regexConsoleX, 'void 0')
        .replace(regexStringMessages,
            s => (s.includes(' ') && s.split(' ').length > 2) ? '""' : s);
    let newSize = inBytes(fileContents);

    console.log(
        `▶Super minified build from ${oldSize} to ${newSize}, `
        + `saving ${oldSize - newSize} bytes.
        `);
}

/** Replace secrets tags with those found in the secrets file */
if (additionalArgs.addSecrets) {
    let secretsContent = readFileSync('local-secret.json',
        {encoding: 'utf8'});
    let secrets = JSON.parse(secretsContent);

    fileContents ??= readFileSync(filePath, {encoding: 'utf8'});

    Object.entries(secrets).forEach(([placeholder, secret]) => {
        fileContents = fileContents.replace(placeholder, secret);
    });
}

/** Write out dist file once */
if (fileContents) {
    writeFileSync(filePath, fileContents, {encoding: 'utf8'});
}