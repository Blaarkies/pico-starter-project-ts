import {
    AbstractSimulatedController,
    MockedUsages,
} from '../abstract-simulated-controller';
import { SimulatedAsm } from './simulated-asm';

export class SimulatedAsmController
    extends AbstractSimulatedController<SimulatedAsm> {

    override getDefaultUsages(): MockedUsages<SimulatedAsm> {
        return {
            ...super.getDefaultUsages(),
            label: [],
            out: [],
            side: [],
            delay: [],
            jmp: [],
            nop: [],
        };
    }

}