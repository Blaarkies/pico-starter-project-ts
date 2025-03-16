import { getHslAtKelvin } from 'common/internal/kelvin-temperature-table';
import {
    sequencedInterval,
    waitForDuration,
} from 'common/time';
import { makeHttpServer } from 'communication/http-server/server';
import { connectToWifiNetwork } from 'communication/wifi';
import { MultiActionButton } from 'devices/multi-action-button/multi-action-button';
import { Ws2812 } from 'devices/ws2812/ws2812';
import { PicoCYW43 } from 'pico_cyw43';
import { IPWM } from 'pwm';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';
import { Subject } from 'rxjs/internal/Subject';
import { ColorCycler } from 'state/color-selection';
import { PixelsAnimator } from 'state/pixels-animator';
import { setupServer } from './server';

let picoCyw43 = new PicoCYW43();
let stateLed = false;
let setBoardLed = (isOn: boolean) => {
    return picoCyw43.putGpio(0, stateLed = isOn);
};
let toggleBoardLed = () => {
    return picoCyw43.putGpio(0, stateLed = !stateLed);
};

export async function setupLightsWithBooster() {
    toggleBoardLed();

    let colorCycler = new ColorCycler(
        {
            warm: getHslAtKelvin(2000),
            cold: getHslAtKelvin(4000),
        },
        [.15, .4, 1],
    );

    let pinButtonA = 0;
    let pinButtonB = 1;
    let pinPixels = 2;
    let pinBrightLed = 4;

    let brightLedPwm = board.pwm(pinBrightLed, 1500, .3) as IPWM;

    let pixels = new Ws2812(pinPixels, 74);
    pixels.fillAllColor([0, 0, 0]);

    let pixelsAnimator = new PixelsAnimator(pixels);
    pixelsAnimator.setColor(colorCycler.selectedRgb, {
        animationType: 'sweep-center-out',
    });

// Buttons
    let longPress = {b: false, c: false};

    let buttonC = new MultiActionButton(pinButtonA);
    buttonC.onLongPress({
        startFn: () => longPress.c = true,
        endFn: () => longPress.c = false,
    });

    let buttonB = new MultiActionButton(pinButtonB);
    buttonB.onLongPress({
        startFn: () => longPress.b = true,
        endFn: () => longPress.b = false,
    });

    let isBusy = false;
    let shutdownNotification$ = new Subject<void>();

    function abortShutdown() {
        isBusy = false;
        shutdownNotification$.next();
        setBoardLed(false);
    }

    function shutdownLights() {
        let oldColor = colorCycler.selectedRgb;
        colorCycler.toggle();
        let selectedColor = colorCycler.selectedRgb;

        pixelsAnimator.setColor(selectedColor, {
            animationType: 'fade',
            duration: 8e3,
            fromRgb: oldColor,
        });
    }

    buttonC.onRelease(async () => {
        if (longPress.b) {
            colorCycler.cycleColor();
            pixelsAnimator.setColor(colorCycler.selectedRgb);

            (colorCycler.selected.colorIndex === 1)
            ? brightLedPwm.start()
            : brightLedPwm.stop();

            return;
        }

        if (isBusy) {
            abortShutdown();
            return;
        }

        if (colorCycler.isPoweredOn) {
            isBusy = true;
            sequencedInterval([100, 200, 300, 400, 500])
                .pipe(takeUntil(shutdownNotification$))
                .subscribe(() => toggleBoardLed());
            await waitForDuration(20e3);

            if (!isBusy) {
                return;
            }
            abortShutdown();
        }

        shutdownLights();
    });

    buttonB.onRelease(() => {
        colorCycler.cyclePower(longPress.c ? -1 : 1);
        pixelsAnimator.setColor(colorCycler.selectedRgb);
    });

    try {
        await setupServer({
            colorCycler,
            pixelsAnimator,
            brightLedPwm,
        });
    } catch (e) {
        console.log('\n---------\nFatal Error: \n', e);
    }
}
