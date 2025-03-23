import { ColorRgb } from 'common/color-space';
import { makeHtmlDocument } from 'communication/http-server/boilerplate';
import { readRequestBody } from 'communication/http-server/process';
import { makeHttpServer } from 'communication/http-server/server';
import { contentTypes } from 'communication/http-server/types';
import { connectToWifiNetwork } from 'communication/wifi';
import {
    animateCenterFloodIn,
    animateCenterFloodOut,
} from 'devices/ws2812/animator/animations/center-flood';
import { animateFade } from 'devices/ws2812/animator/animations/fade';
import {
    animateSweepLeft,
    animateSweepRight,
} from 'devices/ws2812/animator/animations/sweep';
import { PixelAnimator } from 'devices/ws2812/animator/pixel-animator';
import { IPWM } from 'pwm';
import { ColorSelection } from './color-selection';

export async function setupServer(controls: {
    colorCycler: ColorSelection;
    pixelAnimator: PixelAnimator;
    brightLedPwm: IPWM;
}) {
    console.log('< Starting server setup...');

    let wifi = await connectToWifiNetwork(
        '<<SECRET_WIFI_SSID>>',
        '<<SECRET_WIFI_PASSWORD>>',
        '<<SECRET_WIFI_SECURITY>>',
    );

    makeHttpServer({
        onStartupFn: (baseUrl: string) => {
            console.log(`>> Pico controller server is online!`);
            controls.pixelAnimator.setToColor([255, 0, 0]);
        },

        routes: {
            '/': async request => {
                let message = makeHtmlDocument({
                    title: 'Pico Controller',
// @formatter:off
                    body: // language=html
`<div class="layout">
    <div>Pico Controller</div>

    <div class="regular-controls">
        <div id="power" class="power">
            <div class="power-icon">I</div>
        </div>

        <div id="led" class="led"></div>
        <button id="cycle-brightness">🔄</button>

        <input id="input-super-led" list="super-led-ticks"
               class="super-led" type="range" min="0" max="99" step="1" value="0"/>

        <datalist id="super-led-ticks">
            <option value="0" label="0%"></option>
            <option value="49" label="50%"></option>
            <option value="99" label="100%"></option>
        </datalist>
    </div>

    <hr style="width: 100%"/>

    <label for="animation-type">Animation Type</label>
    <select id="animation-type">
        <option value="fade">Fade</option>
        <option value="sweep-r">Sweep right</option>
        <option value="sweep-l">Sweep left</option>
        <option value="flood-out">Flood out</option>
        <option value="flood-in">Flood in</option>
    </select>

    <label for="input-color">Next color</label>
    <input id="input-color" type="color"/>

    <button id="set-new-color-button">Set New Color</button>
</div>`, // @formatter:on
                });

                return {
                    message,
                    contentType: contentTypes.html,
                };
            },

            '/style.css': async request => {
// @formatter:off
let message = // language=css
`body {
    width: max-content;
    font-family: sans-serif;
}

.layout {
    display: grid;
    gap: 10px;
    justify-items: center;
}

.led {
    width: 50px;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 4px solid darkgray;
    background: black;
}

.power {
    cursor: pointer;
    border-radius: 50%;
    transition: .3s ease-in;
    color: darkred;

    &.on {
        color: forestgreen;
    }

    &:hover {
        background: darkgray;
    }

    .power-icon {
        border: 2px solid currentcolor;
        border-radius: 50%;
        aspect-ratio: 1;
        height: 26px;
        font-size: 30px;
        text-align: center;
        line-height: 27px;
        font-family: sans-serif;
    }
}

.super-led {
    appearance: slider-vertical;
    width: 20px;
}

.regular-controls {
    display: grid;
    grid: auto auto auto / auto auto;
    grid-template-areas:
'power super'
'led   super'
'cycle super';
    place-items: center;
    gap: 10px 20px;

    .super-led {
        grid-area: super;
    }
}
`; // @formatter:on

                return {
                    message,
                    contentType: contentTypes.css,
                };
            },

            '/script.js': async request => {
// @formatter:off
let message = // language=JavaScript
`let [ledElement, cycleBrightnessElement, powerElement, inputSuperLedElement, animationTypeSelectElement, inputColorElement, setNewColorButtonElement]
    = ['led', 'cycle-brightness', 'power', 'input-super-led', 'animation-type', 'input-color', 'set-new-color-button']
    .map(id => document.getElementById(id));

let latestState = {
    active: true,
    color: [0, 0, 0],
    bright: false,
};
updateState(latestState);

function linearToLogarithmic(value, strength) {
    const normalized = value / 255;
    const logValue = Math.pow(normalized, 1 / strength);
    return Math.round(logValue * 255);
}

function updateState() {
    console.log('latestState:', latestState);

    ledElement.style.setProperty('background',
        'rgb('
        + latestState.color.map(c => linearToLogarithmic(c, 2))
        + ')');
    
    latestState.active 
        ? powerElement.classList.add('on') 
        : powerElement.classList.remove('on');
}

function isResponseBad(response) {
    return response.status < 200 || 299 < response.status;
}

cycleBrightnessElement.addEventListener('click', async () => {
    let response = await fetch('api/cycle-brightness');
    if (isResponseBad(response)) {
        return;
    }

    let newColorArray = await response.json();
    latestState.color = newColorArray;
    updateState();
});

powerElement.addEventListener('click', async () => {
    let response = await fetch('api/power-button');
    if (isResponseBad(response)) {
        return;
    }

    let newActiveBoolean = await response.json();
    latestState.active = newActiveBoolean;
    updateState();
});

inputSuperLedElement.addEventListener('change', async () => {
    let response = await fetch('api/set-super-led', {
        method: 'POST',
        body: JSON.stringify({
            power: Number(inputSuperLedElement.value),
        }),
    });
    if (isResponseBad(response)) {
        return;
    }

    let newColorArray = await response.json();
    latestState.color = newColorArray;
    updateState();
});

setNewColorButtonElement.addEventListener('click', async () => {
    let response = await fetch('api/set-new-color', {
        method: 'POST',
        body: JSON.stringify({
            animationType: animationTypeSelectElement.value,
            toRgb: inputColorElement.value,
        }),
    });
    if (isResponseBad(response)) {
        return;
    }

    let newColorArray = await response.json();
    latestState.color = newColorArray;
    updateState();
});`; // @formatter:on
console.log('retunring JS message', message.length)
                return {
                    message,
                    contentType: contentTypes.javascript,
                };
            },

            '/api/cycle-brightness': async request => {
                let cycler = controls.colorCycler;
                cycler.cyclePower();
                let newColor = cycler.selectedRgb;
                controls.pixelAnimator.setToColor(newColor);

                return {
                    message: JSON.stringify(newColor),
                    contentType: contentTypes.json,
                };
            },

            '/api/power-button': async request => {
                let cycler = controls.colorCycler;
                let oldColor = cycler.selectedRgb;
                cycler.toggle();
                controls.pixelAnimator.setToColor(
                    cycler.selectedRgb,
                    {
                        fromRgb: oldColor,
                    },
                );

                return {
                    message: JSON.stringify(cycler.isPoweredOn),
                    contentType: contentTypes.json,
                };
            },

            '/api/set-super-led': async request => {
                let newValue;

                try {
                    let body: any = await readRequestBody(request);
                    newValue = body.power;
                } catch (e) {
                    return {status: 400, message: 'Bad input format'};
                }

                if (typeof newValue !== 'number') {
                    return {
                        message: JSON.stringify({error: 'Invalid value'}),
                        status: 400,
                    };
                }

                let pwm = controls.brightLedPwm;
                pwm.setDuty(newValue / 100);
                newValue > 0
                ? pwm.start()
                : pwm.stop();

                return {message: JSON.stringify(newValue)};
            },

            '/api/set-new-color': async request => {
                let newValue;

                try {
                    let body: any = await readRequestBody(request);
                    newValue = body;
                } catch (e) {
                    return {status: 400, message: 'Bad input format'};
                }

                if (typeof newValue.animationType !== 'string'
                    || typeof newValue.toRgb !== 'string') {
                    return {
                        message: JSON.stringify({error: 'Invalid value'}),
                        status: 400,
                    };
                }

                let animationMap = {
                    'fade': animateFade,
                    'sweep-r': animateSweepRight,
                    'sweep-l': animateSweepLeft,
                    'flood-out': animateCenterFloodOut,
                    'flood-in': animateCenterFloodIn,
                };

                let parsedValue = {
                    animationFn: animationMap[newValue.animationType],
                    toRgb: hexToRgbColor(newValue.toRgb),
                };

                if (!parsedValue.animationFn
                    || !Array.isArray(parsedValue.toRgb)) {
                    return {
                        message: JSON.stringify({error: 'Invalid value'}),
                        status: 400,
                    };
                }

                controls.pixelAnimator.setToColor(newValue.toRgb, {
                    animationFn: parsedValue.animationFn,
                });

                return {message: JSON.stringify(newValue.toRgb)};
            },

        },

    });

}

function hexToRgbColor(htmlHexColor: string): ColorRgb {
    return [
        parseInt(htmlHexColor.slice(1, 3), 16),
        parseInt(htmlHexColor.slice(3, 5), 16),
        parseInt(htmlHexColor.slice(5, 7), 16),
    ];
}