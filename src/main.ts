import { interval } from 'kefir';
import { makeNumberList } from './common/enumeration';

let ledPin = board.LED;
pinMode(ledPin, OUTPUT);
interval(1000, 0).onValue(() => {
    digitalToggle(ledPin);
});


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
        console.log('Potentiometer: ', barString);
    }
});