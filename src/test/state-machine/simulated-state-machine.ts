import { StateMachine } from 'rp2';
import { stateMachineController } from './index';

export class SimulatedStateMachine implements StateMachine {

    static availableId = 0;

    private readonly id: number;

    constructor(...args) {
        this.id = stateMachineController.getNewId();
        stateMachineController.addMethodCall('constructor', this.id, ...args);
    }

    active(...args): number {
        stateMachineController.addMethodCall('active', this.id, ...args);
        return 0;
    }

    put(...args) {
        stateMachineController.addMethodCall('put', this.id, ...args);
    }

    irq(...args): number {
        stateMachineController.addMethodCall('irq', this.id, ...args);
        return 0;
    }

    getAvailableId(): number {
        throw new Error('Dummy Method should not have been called.');
    }

    static getAvailableId(): number {
        stateMachineController.addMethodCall('getAvailableId', this.availableId);
        return this.availableId;
    }

    clearFIFOs(): void {
    }

    rxfifo(): number {
        return 0;
    }

    txfifo(): number {
        return 0;
    }

}
