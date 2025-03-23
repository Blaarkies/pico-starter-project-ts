import { ColorRgb } from 'common/color-space';
import {
    pickRandomElement,
    sum,
} from 'common/enumerate';
import {
    sequencedInterval,
    waitForDuration,
} from 'common/time';
import {
    toExp,
    toLog,
} from 'common/transform';
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
import { interval } from 'rxjs/internal/observable/interval';
import { take } from 'rxjs/internal/operators/take';
import { ColorSelection } from './color-selection';

export async function setupServer(controls: {
    colorCycler: ColorSelection;
    pixelAnimator: PixelAnimator;
    brightLedPwm: IPWM;
    toggleBoardLed: () => void;
    setBoardLed: (isOn: boolean) => void;
}) {
    console.log('>< Starting server setup...');
    sequencedInterval([100, 300, 200])
        .pipe(take(20))
        .subscribe(() => controls.toggleBoardLed());

    let wifi = await connectToWifiNetwork(
        '<<SECRET_WIFI_SSID>>',
        '<<SECRET_WIFI_PASSWORD>>',
        '<<SECRET_WIFI_SECURITY>>',
    );

    makeHttpServer({
        onStartupFn: async (baseUrl: string) => {
            console.log(`>> Pico controller server is online!`);
            let config = {animationFn: animateCenterFloodOut, duration: 300};
            for (let i = 0; i < 3; i++) {
                controls.toggleBoardLed();
                controls.pixelAnimator.setToColor([0, 0, 0], config);
                await waitForDuration(config.duration);
                controls.pixelAnimator.setToColor([0, 15, 0], config);
                controls.toggleBoardLed();
                await waitForDuration(config.duration);
            }
            controls.pixelAnimator.setToColor(controls.colorCycler.selectedRgb,
                {animationFn: animateCenterFloodIn, duration: 3e3});
            controls.setBoardLed(true);
        },

        routes: {
            '/': async request => {
                interval(200).pipe(take(4)).subscribe(() => controls.toggleBoardLed());

                let message = makeHtmlDocument({
                    title: 'Pico Controller',
// @formatter:off
                    body: // language=html
`<div>Pico Controller</div>
<button id="pow">Power</button>
<button id="cybr">Brightness</button>
<input id="sule" list="sule-ticks" type="range" min="0" max="99" step="1" value="0"/>
<hr/>
<label for="anty">Animation</label>
<select id="anty">
<option value="fade">Fade</option>
<option value="sweep-r">Sweep right</option>
<option value="sweep-l">Sweep left</option>
<option value="flood-out">Flood out</option>
<option value="flood-in">Flood in</option>
<option>Random</option>
</select>
<input id="colo" type="color"/>`, // @formatter:on
                    styleSrc: 'style.css',
                    scriptSrc: 'script.js',
                });

                return {
                    message,
                    contentType: contentTypes.html,
                };
            },

            '/style.css': async request => {
                return {
                    message: '',
                    contentType: contentTypes.css,
                };
            },

            '/script.js': async request => {
// @formatter:off
let message = // language=JavaScript
`let [cybr, pow, sule, anty, colo] = ['cybr', 'pow', 'sule', 'anty', 'colo']
    .map(id => document.getElementById(id));

cybr.addEventListener('click', () => fetch('api/cycle-brightness'));
pow.addEventListener('click', () => fetch('api/power-button'));

function throttle(fn, delay) {
    let lastCalled = 0;
    return (...args) => {
        let now = new Date().getTime();
        if(now - lastCalled < delay) {
            return;
        }
        lastCalled = now;
        return fn(...args);
    }
}
let tdSuperLed = throttle(() => fetch('api/set-super-led', {
    method: 'POST',
    headers: {'Content-Type': 'text/json; charset=utf-8'},
    body: JSON.stringify({power: Number(sule.value)})
}), 300);
let tdColorSet = throttle(() => fetch('api/set-new-color', {
        method: 'POST',
        headers: {'Content-Type': 'text/json; charset=utf-8'},
        body: JSON.stringify({animationType: anty.value, toRgb: colo.value})
}), 300);
sule.addEventListener('change', tdSuperLed);
colo.addEventListener('input', tdColorSet);`; // @formatter:on

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
                let newColor = cycler.selectedRgb;
                controls.pixelAnimator.setToColor(
                    newColor,
                    {
                        fromRgb: oldColor,
                        duration: 5e3,
                    },
                );

                sum(newColor)
                ? controls.setBoardLed(true)
                : controls.setBoardLed(false);

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

                let normalized = newValue / 100;
                let curvedValue = toExp(normalized, 20);

                let pwm = controls.brightLedPwm;
                let safetyFactor = .6;
                pwm.setDuty(curvedValue * safetyFactor);
                curvedValue > 0
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

                let parsedValue = {
                    animationFn: animationMap[newValue.animationType]
                        ?? pickRandomElement(Object.values(animationMap)),
                    toRgb: hexToRgbColor(newValue.toRgb),
                };

                if (!parsedValue.animationFn
                    || !Array.isArray(parsedValue.toRgb)) {
                    return {
                        message: JSON.stringify({error: 'Invalid value'}),
                        status: 400,
                    };
                }

                controls.pixelAnimator.setToColor(parsedValue.toRgb, {
                    animationFn: parsedValue.animationFn,
                });

                return {message: JSON.stringify(newValue.toRgb)};
            },

        },

    });

}

let animationMap = {
    'fade': animateFade,
    'sweep-r': animateSweepRight,
    'sweep-l': animateSweepLeft,
    'flood-out': animateCenterFloodOut,
    'flood-in': animateCenterFloodIn,
};

function hexToRgbColor(htmlHexColor: string): ColorRgb {
    return [
        parseInt(htmlHexColor.slice(1, 3), 16),
        parseInt(htmlHexColor.slice(3, 5), 16),
        parseInt(htmlHexColor.slice(5, 7), 16),
    ];
}