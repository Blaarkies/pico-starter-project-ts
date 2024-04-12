import { subject } from '../common';
import { SimulatedGpio } from './simulated-gpio';

type IrqStatusType =
    | typeof FALLING
    | typeof RISING
    | typeof CHANGE;

type IrqEvent = { pin: number, status: IrqStatusType };

type MethodName = 'constructor' | keyof SimulatedGpio;

type MockedUsages = { constructor: jest.Mock; }
    & { [key in (keyof SimulatedGpio)]: jest.Mock[]; };

export class SimulatedGpioController {

    private usages = this.getDefaultUsages();

    irqEvent$ = subject<IrqEvent>();

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
        this.irqEvent$ = subject<IrqEvent>();
    }

    getMock(methodName: MethodName, pin?: number): jest.Mock {
        return methodName === 'constructor'
               ? this.usages.constructor
               : this.usages[methodName][pin]
                   ?? jest.fn();
    }

    triggerIrq(pin: number, status: IrqStatusType) {
        this.irqEvent$.next({pin, status});
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