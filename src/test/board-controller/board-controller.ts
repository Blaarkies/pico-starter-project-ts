import { Subject } from 'rxjs';
import {
    GpioMode,
    GpioState,
    IrqEvent,
    IrqStatusType,
} from '../gpio/types';
import { mockedBoard } from './index';
import { DigitalIoMocks } from './types';

export class BoardController {

    irqEvent$ = new Subject<IrqEvent>();
    mocks = this.makeMocks();
    setWatchId = 0;

    private pinStates: GpioState[] = [];
    private pinModes: GpioMode[] = [];

    private setBoardMocks() {
        mockedBoard.adc.mockRestore();
    }

    restore() {
        this.irqEvent$.complete();
        this.irqEvent$ = new Subject<IrqEvent>();
        this.mocks = this.makeMocks();

        this.setWatchId = 0;
        this.pinStates = [];
        this.pinModes = [];

        this.setBoardMocks();
    }

    triggerIrq(pin: number, status: IrqStatusType) {
        switch (status) {
            case FALLING:
                this.pinStates[pin] = LOW;
                break;
            case RISING:
                this.pinStates[pin] = HIGH;
                break;
            case CHANGE:
                this.pinStates[pin] = this.pinStates[pin] === LOW
                                      ? HIGH
                                      : LOW;
                break;
        }

        this.irqEvent$.next({pin, status});
    }

    digitalRead(pin: number): number {
        this.mocks.digitalRead(pin);

        return this.pinStates[pin];
    }

    pinMode(pin: number | number[], mode: number) {
        this.mocks.pinMode(pin, mode);

        if (Array.isArray(pin)) {
            pin.forEach(p => this.pinModes[p] = mode);
            return;
        }

        this.pinModes[pin] = mode;
    }

    setWatch(...args: Parameters<typeof setWatch>) {
        this.mocks.setWatch(...args);
    }

    clearWatch(pin: number) {
        this.mocks.clearWatch(pin);
    }

    idForSetWatch(): number {
        return this.setWatchId++;
    }

    private makeMocks(): DigitalIoMocks {
        return {
            digitalRead: jest.fn(),
            pinMode: jest.fn(),
            setWatch: jest.fn(),
            clearWatch: jest.fn(),
            boardAdc: mockedBoard.adc,
        };
    }
}