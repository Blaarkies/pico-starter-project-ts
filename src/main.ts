import { interval } from 'kefir';
import { LED } from 'led';
import {
    hslToRgb,
    makeNumberList,
    sequencedInterval,
    subject,
} from './common';
import { adcToCelsius } from './common/unit-of-measure';
import { Ws2812 } from './devices';


// Display results in debug console
let output = {
    temperature: '-',
    potentiometer: '-',
};

let update$ = subject();
update$.throttle(500)
    .onValue(() => console.log(`\n\n
Temperature:   ${output.temperature}
Potentiometer: ${output.potentiometer}
`));


// Blink internal
const internalLed = new LED(board.LED);
let wink$ = sequencedInterval([100, 800, 300, 400, 100]);
wink$.onValue(() => {
    internalLed.toggle();
});


// Internal Temperature
let tempAdc = board.adc(30);
interval(1000, 0).onValue(() => {
    let tempCelsius = adcToCelsius(tempAdc.read());
    output.temperature = tempCelsius.toFixed(2) + ' °C';
    update$.next();
});


// Buttons
let buttonAPin = 3;
board.button(buttonAPin)
    .addListener('click', () => {
        console.log(`Button A was pressed!`);
    });

let buttonBPin = 4;
board.button(buttonBPin)
    .addListener('click', () => {
        console.log(`Button B was pressed!`);
    });


// Potentiometer
let potPin = 28;
let potAdc = board.adc(potPin);
let previousPotValue: number;
interval(100, 0).onValue(() => {
    let newValue = potAdc.read();
    let threshold = .05;
    let hasDifference = Math.abs(previousPotValue - newValue) > threshold;

    // Blocks small changes (due to signal noise) from flooding the output
    if (hasDifference) {
        previousPotValue = newValue;
        let barLength = 15;
        let barString = makeNumberList(newValue * barLength)
            .map(() => '#')
            .join('')
            .padEnd(barLength, '*');

        output.potentiometer = barString;
        update$.next();
    }
});


// WS2812 - Individually addressable led strip
let pixelsPin = 2;
let pixels = new Ws2812(pixelsPin, 2);
interval(150, null)
    .scan((acc, _) => acc + 1, -1)
    .onValue(i => {
        let resolution = 50;
        let h1 = (i % resolution) / resolution;
        let h2 = ((100 + i * 1.2) % resolution) / resolution;

        pixels.setLedColor(0, hslToRgb(h1, 1, .5));
        pixels.setLedColor(1, hslToRgb(h2, 1, .5));

        pixels.write();
    });
