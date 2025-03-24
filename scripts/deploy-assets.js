import { readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

function wait(durationMs) {
    return new Promise(r => setTimeout(r, durationMs));
}

let webServerAssetsPath = 'src/communication/http-server/assets';
let assetFiles = readdirSync(webServerAssetsPath, {recursive: true});
let unixSep = '/';

for (let path of assetFiles) {
    let filepath = [webServerAssetsPath, path].join(unixSep);
    let destination = ['', path].join(unixSep);

    let command = `kaluma put ${filepath} ${destination}`;
    console.log(`>> Running command \n   ${command}\n`);

    execSync(command, {stdio: 'inherit'});
    await wait(100);
    console.log(`>> Completed upload: [${path}]\n`);
}






