import * as fs from 'fs';

/**
 * Sets the global variables to match the Kaluma runtime environment
 * on the microcontroller.
 *
 * This gets the declarations from inside the Kaluma types file, which
 * provides values used when interacting with the microcontroller
 * such as button modes, events and resistor types.
 *
 * These values are available during runtime on the device, but not
 * on the Jest test environment unless initialized below.
 */
let typesFile = fs.readFileSync(
    './node_modules/@types/kaluma/index.d.ts',
    {encoding: 'utf8'});

let constDeclarations = typesFile.split('\n')
    .filter(l => l.includes(' const '));

constDeclarations
    .map(l => {
        let [left, right] = l.split(':');
        return [
            left.split('declare const ')[1],
            right.split(';')[0].trim(),
        ];
    })
    .map(([key, value]) => [key, parseInt(value)])
    .filter(([_, v]) => !Number.isNaN(v))
    .forEach(([k, v]) => global[k] = v);
