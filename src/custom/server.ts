import { makeHtmlDocument } from 'communication/http-server/boilerplate';
import { readRequestBody } from 'communication/http-server/process';
import { makeHttpServer } from 'communication/http-server/server';
import { contentTypes } from 'communication/http-server/types';
import { connectToWifiNetwork } from 'communication/wifi';
import { IPWM } from 'pwm';
import { ColorCycler } from 'state/color-selection';
import { PixelsAnimator } from 'state/pixels-animator';

export async function setupServer(controls: {
    colorCycler: ColorCycler;
    pixelsAnimator: PixelsAnimator;
    brightLedPwm: IPWM;
}) {
    console.log('Starting server setup...');

    let wifi = await connectToWifiNetwork(
        '<<SECRET_WIFI_SSID>>',
        '<<SECRET_WIFI_PASSWORD>>',
        '<<SECRET_WIFI_SECURITY>>',
    );

    makeHttpServer({
        onStartupFn: (baseUrl: string) => {
            console.log(`>> Custom server is up!`);
        },

        routes: {
            '/': async request => {

                let message = makeHtmlDocument({
                    title: 'Pico Controller',
                    body: // language=html
// @formatter:off
                        `
<div class="layout">
    <div>Pico Controller</div>
    <div id="led" class="led"></div>
    <button id="cycle-brightness">Cycle Brightness</button>
    <button id="power">
        <div class="power-icon">I</div>
    </button>
</div>
                        `,
                    style: // language=css
                        `
body {
    display: grid;
    gap: 10px;
    justify-items: center;
    width: max-content;
    padding: 10px;
}

.layout {
    display: grid;
    gap: 10px;
}

.led {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 4px solid darkslategray;
    background: gray;

    &.on {
        background: lime;
    }
}

.power-icon {
    border: 2px solid black;
    border-radius: 50%;
    aspect-ratio: 1;
    height: 1em;
    font-weight: bold;
}
                        `,
                    script: // language=JavaScript
                        `
let [
    ledElement,
    cycleBrightnessElement,
    powerElement,
] = ['led', 'cycle-brightness', 'power']
    .map(id => document.getElementById(id));

let latestState = {
    active: ${controls.colorCycler.isPoweredOn},
    color: ${JSON.stringify(controls.colorCycler.selectedRgb)},
    bright: ${!!controls.brightLedPwm.getDuty()},
};
updateState(latestState);

cycleBrightnessElement.addEventListener('click', async () => {
    let response = await fetch('api/cycle-brightness');
    if (isResponseBad(response)) {
        return
    }
    
    let newColorArray = await response.json();
    latestState.color = newColorArray;
    updateState();
});

powerElement.addEventListener('click', async () => {
    let response = await fetch('api/power-button');
    if (isResponseBad(response)) {
        return
    }

    let newActiveBoolean = await response.json();
    latestState.active = newActiveBoolean;
    updateState();
});

function isResponseBad(response) {
    return response.status < 200 || 299 < response.status;
}

function updateState() {
    console.log('latestState:', latestState);
    
    ledElement.style.setProperty('background', 
        'rgb(' 
        + latestState.color.map(c => Math.log(c)*255) 
        + ')');
    if (latestState.active) {
        ledElement.classList.add('on');
    } else {
        ledElement.classList.remove('on');
    }
}
                        `,
// @formatter:on
                });

                return {
                    message,
                    contentType: contentTypes.html,
                };
            },

            '/api/cycle-brightness': async request => {
                let cycler = controls.colorCycler;
                cycler.cyclePower();
                let newColor = cycler.selectedRgb;
                controls.pixelsAnimator.setColor(newColor);

                return {
                    message: JSON.stringify(newColor),
                    contentType: contentTypes.json,
                };
            },

            '/api/power-button': async request => {
                let cycler = controls.colorCycler;
                let oldColor = cycler.selectedRgb;
                cycler.toggle();
                controls.pixelsAnimator.setColor(
                    cycler.selectedRgb,
                    {
                        animationType: 'fade',
                        fromRgb: oldColor,
                    },
                );

                return {
                    message: JSON.stringify(cycler.isPoweredOn),
                    contentType: contentTypes.json,
                };
            },

            '/api/set-state': async request => {
                let newValue;

                try {
                    let body: any = await readRequestBody(request);
                    newValue = body.state;
                } catch (e) {
                    return {status: 400, message: 'Bad input format'};
                }

                if (typeof newValue !== 'boolean') {
                    return {
                        message: JSON.stringify({error: 'Invalid value'}),
                        status: 400,
                    };
                }


                return {message: JSON.stringify(newValue)};
            },
        },

    });

}
