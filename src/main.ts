import { PicoCYW43 } from 'pico_cyw43';
import { interval } from 'rxjs/internal/observable/interval';

let picoCyw43 = new PicoCYW43();

let setLed = (isOn: boolean) => {
    picoCyw43.putGpio(0, isOn);
};
let stateLed = false;
let toggleLed = () => setLed(stateLed = !stateLed);

interval(500).subscribe(i => {
    toggleLed();
});
