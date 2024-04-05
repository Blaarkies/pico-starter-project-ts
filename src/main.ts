import {
    Emitter,
    interval,
    stream,
} from 'kefir';
import { makeNumberList } from './common/enumeration';
import { adcToCelsius } from './common/unit-of-measure';


// Display results in debug console
let emitter$: Emitter<void, any>;
let update$ = stream(e => {
    emitter$ = e;
});

let output = {
    temperature: '-',
    potentiometer: '-',
};

update$
    .throttle(500)
    .onValue(() => {
        console.log('\n\n');
        console.log(`
Temperature:   ${output.temperature}
Potentiometer: ${output.potentiometer}
`);
    });


// Blink internal LED
let ledPin = board.LED;
pinMode(ledPin, OUTPUT);
interval(1000, 0).onValue(() => {
    digitalToggle(ledPin);
});


// Internal Temperature
let tempAdc = board.adc(30);
interval(100, 0).onValue(() => {
    let tempCelsius = adcToCelsius(tempAdc.read());
    output.temperature = tempCelsius.toFixed(2) + ' °C';
    emitter$.value();
});


// Buttons
let buttonAPin = 2;
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

    if (hasDifference) {
        previousPotValue = newValue;
        let barLength = 15;
        let barString = makeNumberList(newValue * barLength)
            .map(() => '#')
            .join('')
            .padEnd(barLength, '*');

        output.potentiometer = barString;
        emitter$.value();
    }
});