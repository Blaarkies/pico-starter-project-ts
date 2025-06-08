import { ColorRgb } from 'common/color-space';
import {
    pickRandomElement,
    sum,
} from 'common/enumerate';
import {
    sequencedInterval,
    waitForDuration,
} from 'common/time';
import { toExp } from 'common/transform';
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
import { MuWebServer } from 'network/http-server/mu-web-server';
import { connectToWifiNetwork } from 'network/wifi';
import { IPWM } from 'pwm';
import { take } from 'rxjs/internal/operators/take';
import { ColorSelection } from './color-selection';

export async function setupServer(controls: {
    colorCycler: ColorSelection;
    pixelAnimator: PixelAnimator;
    brightLedPwm: IPWM;
    toggleBoardLed: () => void;
    setBoardLed: (isOn: boolean) => void;
}) {
    console.log('>> Starting server setup...');

    sequencedInterval([100, 300, 200])
        .pipe(take(20))
        .subscribe(() => controls.toggleBoardLed());

    let wifi = await connectToWifiNetwork(
        '<<SECRET_WIFI_SSID>>',
        '<<SECRET_WIFI_PASSWORD>>',
        '<<SECRET_WIFI_SECURITY>>',
    );

    new MuWebServer({assetsPath: 'assets'})
        .start(async (error: Error) => {
            if (error) {
                return;
            }
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
        })

        .redirect('/', '/index.html')

        .get('/favicon.ico', (req, res) => {
            res.writeHead(204, 'No favicon');
            res.end();
        })

        .get('/api/cycle-brightness', async () => {
            let cycler = controls.colorCycler;
            cycler.cyclePower();
            let newColor = cycler.selectedRgb;
            controls.pixelAnimator.setToColor(newColor);

            return JSON.stringify(newColor);
        })

        .get('/api/power-button', async () => {
            let cycler = controls.colorCycler;
            let oldColor = cycler.selectedRgb;
            cycler.toggle();
            let newColor = cycler.selectedRgb;
            controls.pixelAnimator.setToColor(
                newColor,
                {fromRgb: oldColor, duration: 5e3});

            controls.setBoardLed(sum(newColor) > 0);

            return JSON.stringify(cycler.isPoweredOn);
        })

        .post('/api/set-super-led', async request => {
            let newValue = (request as any).body.power;

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

            return JSON.stringify(newValue);
        })

        .post('/api/set-new-color', async request => {
            let newValue = (request as any).body.power;

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

            return JSON.stringify(newValue.toRgb);
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
