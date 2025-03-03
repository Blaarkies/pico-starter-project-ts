import { Subject } from 'rxjs';
import {
    AbstractSimulatedController,
    MockedUsages,
} from '../abstract-simulated-controller';
import { SimulatedGpio } from './simulated-gpio';
import {
    GpioState,
    IrqEvent,
    IrqStatusType,
} from './types';

export class SimulatedGpioController
    extends AbstractSimulatedController<SimulatedGpio> {

    irqEvent$ = new Subject<IrqEvent>();

    private gpioStates: GpioState[] = [];

    override restore() {
        super.restore();
        this.gpioStates = [];
        this.irqEvent$ = new Subject<IrqEvent>();
    }

    triggerIrq(pin: number, status: IrqStatusType, updateGpioState = true) {
        this.irqEvent$.next({pin, status});

        if (updateGpioState) {
            switch (status) {
                case FALLING:
                    this.gpioStates[pin] = LOW;
                    break;
                case RISING:
                    this.gpioStates[pin] = HIGH;
                    break;
                case CHANGE:
                    this.gpioStates[pin] = this.gpioStates[pin] === LOW
                                           ? HIGH
                                           : LOW;
                    break;
            }
        }
    }

    setGpioState(pin: number, state: GpioState) {
        this.gpioStates[pin] = state;
    }

    getGpioState(pin: number): GpioState {
        return this.gpioStates[pin];
    }

    override getDefaultUsages(): MockedUsages<SimulatedGpio> {
        return {
            ...super.getDefaultUsages(),
            pin: [],
            mode: [],
            read: [],
            write: [],
            toggle: [],
            low: [],
            high: [],
            irq: [],
        };
    }
}