import { ASM } from 'rp2';
import { asmController } from './index';

export class SimulatedAsm implements ASM {

    private readonly id: number;

    constructor(...args) {
        this.id = asmController.getNewId();
        asmController.addMethodCall('constructor', this.id, ...args);
    }

    label(...args): ASM {
        asmController.addMethodCall('label', this.id, ...args);
        return this;
    }

    out(...args): ASM {
        asmController.addMethodCall('out', this.id, ...args);
        return this;
    }

    side(...args): ASM {
        asmController.addMethodCall('side', this.id, ...args);
        return this;
    }

    delay(...args): ASM {
        asmController.addMethodCall('delay', this.id, ...args);
        return this;
    }

    jmp(...args): ASM {
        asmController.addMethodCall('jmp', this.id, ...args);
        return this;
    }

    nop(...args): ASM {
        asmController.addMethodCall('nop', this.id, ...args);
        return this;
    }

}
