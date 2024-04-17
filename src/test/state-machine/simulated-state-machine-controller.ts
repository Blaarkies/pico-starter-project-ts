import {
    AbstractSimulatedController,
    MockedUsages,
} from '../abstract-simulated-controller';
import { SimulatedStateMachine } from './simulated-state-machine';

export class SimulatedStateMachineController
    extends AbstractSimulatedController<SimulatedStateMachine> {

    override getDefaultUsages(): MockedUsages<SimulatedStateMachine> {
        return {
            ...super.getDefaultUsages(),
            active: [],
            put: [],
            irq: [],
            getAvailableId: [],
        };
    }

}