import { GPIO } from 'gpio';
import { gpioController } from './index';

export class SimulatedGpio implements GPIO {

    pin: number;
    mode: 0 | 1 | 2 | 3;

    constructor(...args) {
        gpioController.addMethodCall('constructor', args[0], ...args);

        this.pin = args[0];
        this.mode = args[1];
    }

    read(): number {
        gpioController.addMethodCall('read', this.pin);
        return gpioController.getGpioState(this.pin);
    }

    write(value: 0 | 1) {
        throw new Error('Method not implemented.');
    }

    toggle() {
        throw new Error('Method not implemented.');
    }

    low() {
        throw new Error('Method not implemented.');
    }

    high() {
        throw new Error('Method not implemented.');
    }

    irq(...args) {
        gpioController.addMethodCall('irq', this.pin, ...args);
        gpioController
            .irqEvent$
            .filter(({pin}) => pin === this.pin)
            .onValue(({pin, status}) => {
                args[0](pin, status);
            });
    }

}
