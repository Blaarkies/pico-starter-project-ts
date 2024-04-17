export type MethodName<T> = 'constructor' | keyof T;

export type MockedUsages<T> = { constructor: jest.Mock; }
    & { [key in (keyof T)]: jest.Mock[]; };

export abstract class AbstractSimulatedController<T> {

    protected usages = this.getDefaultUsages();

    private lastId = 0;

    getNewId() {
        return this.lastId++;
    }

    addMethodCall(methodName: MethodName<T>, id: number, ...args) {
        if (methodName === 'constructor') {
            this.usages.constructor(...args);
            return;
        }

        let methodList = this.usages[methodName];
        let mockFn = methodList[id];
        if (!mockFn) {
            methodList[id] = jest.fn();
        }

        methodList[id](...args);
    }

    restore() {
        this.usages = this.getDefaultUsages();
        this.lastId = 0;
    }

    getMock(methodName: MethodName<T>, id?: number): jest.Mock {
        return methodName === 'constructor'
               ? this.usages.constructor
               : this.usages[methodName][id]
                   ?? jest.fn();
    }

    protected getDefaultUsages(): MockedUsages<T> {
        return {
            constructor: jest.fn(),
        } as MockedUsages<T>;
    }

}