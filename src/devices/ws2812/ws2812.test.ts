// @formatter:off
/** Package mock must precede Ws2812 import */
jest.mock('rp2', () => ({
    ASM: SimulatedAsm,
    PIO: {FIFO_JOIN_TX: 0},
    StateMachine: SimulatedStateMachine,
}), {virtual: true});
// @formatter:on

import {
    asmController,
    gpioController,
    stateMachineController,
} from '../../test';
import { SimulatedAsm } from '../../test/asm';
import { SimulatedStateMachine } from '../../test/state-machine';
import { Ws2812 } from './ws2812';

describe('Ws2812', () => {

    let pin = 69;

    describe('constructor()', () => {

        beforeEach(() => {
            gpioController.restore();
            asmController.restore();
            stateMachineController.restore();
        });

        test('given a bad amount of LEDs, throw error', () => {
            expect(() => new Ws2812(pin, 0)).toThrow();
        });

        test('creates ASM instance', () => {
            new Ws2812(pin, 1);
            let spyAsmConstructor = asmController.getMock('constructor', 0);

            expect(spyAsmConstructor).toHaveBeenCalled();
            expect(spyAsmConstructor).toHaveBeenCalledWith(
                expect.objectContaining({sideset: 1}));
        });

        test('calls ASM methods to create assembly program', () => {
            new Ws2812(pin, 1);

            let label = asmController.getMock('label', 0);
            let out = asmController.getMock('out', 0);
            let side = asmController.getMock('side', 0);
            let delay = asmController.getMock('delay', 0);
            let jmp = asmController.getMock('jmp', 0);
            let nop = asmController.getMock('nop', 0);

            expect(label).toHaveBeenCalled();
            expect(out).toHaveBeenCalled();
            expect(side).toHaveBeenCalled();
            expect(delay).toHaveBeenCalled();
            expect(jmp).toHaveBeenCalled();
            expect(nop).toHaveBeenCalled();
        });

        test('creates StateMachine instance', () => {
            let id = 0;
            SimulatedStateMachine.availableId = id;
            new Ws2812(pin, 1);

            let spySmConstructor = stateMachineController.getMock('constructor', 0);

            expect(spySmConstructor).toHaveBeenCalled();
            expect(spySmConstructor).toHaveBeenCalledWith(
                id,
                expect.any(SimulatedAsm),
                expect.objectContaining({
                    freq: 8e6,
                    autopull: true,
                    pullThreshold: 24,
                    fifoJoin: 0,
                    sidesetBase: pin,
                }));
        });

        test('calls active() on StateMachine instance', () => {
            new Ws2812(pin, 1);

            let spySmActive = stateMachineController.getMock('active', 0);

            expect(spySmActive).toHaveBeenCalled();
            expect(spySmActive).toHaveBeenCalledWith(true);
        });

        test('initializes buffer with ledAmount entries', () => {
            let pixels = new Ws2812(pin, 1);
            pixels.write();

            let spySmPut = stateMachineController.getMock('put', 0);
            expect(spySmPut).toHaveBeenCalled();
            expect(spySmPut).toHaveBeenCalledWith(expect.any(Array));

            let lastCallArgs = spySmPut.mock.lastCall;
            let newBufferArg = lastCallArgs[0];
            expect(newBufferArg.length).toBe(1);
        });

    });

    describe('static valueFromColor()', () => {

        test.each`
rgb                | binaryString                 
${[255, 255, 255]} | ${'111111111111111111111111'}
${[255, 255, 0]}   | ${'000000001111111111111111'}
${[255, 0, 255]}   | ${'111111111111111100000000'}
${[0, 255, 255]}   | ${'111111110000000011111111'}
${[128, 255, 0]}   | ${'000000000000000111111111'}
${[0, 0, 0]}       | ${'000000000000000000000000'}
`('given RGB $rgb it returns binary $binaryString',
            ({rgb, binaryString}) => {
                let result = Ws2812.valueFromColor(rgb);
                let binary = parseInt(binaryString, 2);
                expect(result).toBe(binary);
            });

    });

    describe('test requiring Uint32Array mock', () => {
        type Uint32ArrayType = typeof Uint32Array;
        let RealUint32Array: Uint32ArrayType = Uint32Array;

        let mockConstructor = jest.fn();
        let mockBuffer = jest.fn();

        class MockUint32Array {
            constructor(...args) {
                let fakeThis = Array(args[0]);
                mockConstructor(...args);
                mockBuffer(fakeThis);
                return fakeThis;
            }
        }

        Uint32Array = MockUint32Array as Uint32ArrayType;

        beforeEach(() => {
            mockConstructor.mockClear();
            mockBuffer.mockClear();
            stateMachineController.restore();
        });

        afterAll(() => {
            Uint32Array = RealUint32Array;
        });

        test('write() calls stateMachine.put() with buffer', () => {
            let pixels = new Ws2812(pin, 1);
            pixels.write();

            expect(mockConstructor).toHaveBeenCalled();
            expect(mockConstructor).toHaveBeenCalledWith(1);

            let lastCallArgs = stateMachineController.getMock('put', 0)
                .mock.lastCall;
            let newBufferArg = lastCallArgs[0];
            let mockBufferValue = mockBuffer.mock.lastCall[0];

            expect(newBufferArg).toBe(mockBufferValue);
        });

        test('replaceBuffer() changes buffer values', () => {
            let pixels = new Ws2812(pin, 1);
            let testBuffer = new RealUint32Array([42]);
            pixels.replaceBuffer(testBuffer);

            pixels.write();

            let lastCallArgs = stateMachineController.getMock('put', 0)
                .mock.lastCall;
            let newBufferArg = lastCallArgs[0];
            expect(newBufferArg.length).toBe(1);
            expect(newBufferArg[0]).toBe(42);
        });

        test('setLed() updates correct buffer element', () => {
            let pixels = new Ws2812(pin, 4);
            pixels.setLed(2, 128);

            let mockBufferValue = mockBuffer.mock.lastCall[0];
            expect(mockBufferValue[2]).toBe(128);
        });

        test('setLedColor() updates buffer element using rgb color', () => {
            let pixels = new Ws2812(pin, 4);
            pixels.setLedColor(2, [0, 128, 255]);

            let mockBufferValue = mockBuffer.mock.lastCall[0];

            // Hex value looks backwards?
            // That's because the Ws2812 requires reversed bit order
            expect(mockBufferValue[2]).toBe(0xFF0001);
        });

        test('fillAllColor() updates all buffer elements using rgb color' +
            '', () => {
            let pixels = new Ws2812(pin, 4);

            pixels.fillAllColor([7, 63, 92]);

            let mockBufferValue = mockBuffer.mock.lastCall[0];
            expect(mockBufferValue[0]).toBe(0x3AE0FC);
            expect(mockBufferValue[0]).toBe(mockBufferValue[1]);
            expect(mockBufferValue[1]).toBe(mockBufferValue[2]);
            expect(mockBufferValue[2]).toBe(mockBufferValue[3]);
        });

    });

});