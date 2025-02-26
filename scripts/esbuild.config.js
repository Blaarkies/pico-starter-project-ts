import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

let additionalArgs = process.argv
    .filter(arg => arg.startsWith('--'))
    .reduce((sum, c) => {
        let arg = c.split('--')[1];
        sum[arg] = true;
        return sum;
    }, {});

let config = {
    entryPoints: ['src/main.ts'],
    bundle: true,
    outdir: 'dist',
    platform: 'node',
    target: 'node14',
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
    ...additionalArgs,
};
await build(config).catch(() => process.exit(1));

if (additionalArgs.minify) {
    let outputFileName = config.entryPoints[0]
        .split('/')[1]
        .replace('ts', 'js');
    let filePath = `${config.outdir}/${outputFileName}`;

    let fileContents = readFileSync(filePath, {encoding: 'utf8'});

    let regexConsoleX = /console\.(log|warn|error|info)\(([^)]*)\);?/g;
    let regexStringMessages = /(["'`])(?:(?=(\\?))\2.)*?\1/g;

    let tinyfied = fileContents
        .replace('\n', '')
        .replace(regexConsoleX, 'void 0')
        .replace(regexStringMessages,
            s => (s.includes(' ') && s.split(' ').length > 2) ? '""' : s);

    writeFileSync(filePath, tinyfied, {encoding: 'utf8'});

    function inBytes(text) {
        let rounding = 1e1;
        let size = Math.round(rounding * text.length / 1024);
        return `${(size / rounding).toFixed(1)}KB`;
    }

    console.log(
        `▶Super minified build from ${inBytes(fileContents)} to ${inBytes(tinyfied)}
        `);
}
