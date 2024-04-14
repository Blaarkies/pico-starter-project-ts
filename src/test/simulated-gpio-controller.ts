import { subject } from '../common';
import { SimulatedGpio } from './simulated-gpio';

type GpioState = typeof LOW | typeof HIGH;

type IrqStatusType =
    | typeof FALLING
    | typeof RISING
    | typeof CHANGE;

type IrqEvent = { pin: number, status: IrqStatusType };

type MethodName = 'constructor' | keyof SimulatedGpio;

type MockedUsages = { constructor: jest.Mock; }
    & { [key in (keyof SimulatedGpio)]: jest.Mock[]; };

export class SimulatedGpioController {

    irqEvent$ = subject<IrqEvent>();

    private usages = this.getDefaultUsages();
    private gpioStates: GpioState[] = [];

    addMethodCall(methodName: MethodName, pin: number, ...args) {
        if (methodName === 'constructor') {
            this.usages.constructor(...args);
            return;
        }

        let methodList = this.usages[methodName];
        let mockFn = methodList[pin];
        if (!mockFn) {
            methodList[pin] = jest.fn();
        }

        methodList[pin](...args);
    }

    restore() {
        this.usages = this.getDefaultUsages();
        this.gpioStates = [];
        this.irqEvent$ = subject<IrqEvent>();
    }

    getMock(methodName: MethodName, pin?: number): jest.Mock {
        return methodName === 'constructor'
               ? this.usages.constructor
               : this.usages[methodName][pin]
                   ?? jest.fn();
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

    private getDefaultUsages(): MockedUsages {
        return {
            constructor: jest.fn(),
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