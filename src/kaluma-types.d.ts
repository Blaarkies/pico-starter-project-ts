declare const storage: Storage;

/** https://kalumajs.org/docs/api/rp2 */
declare module 'rp2' {

    class ASM {
        constructor(o: {}) {
        }

        label(...args): ASM;

        out(...args): ASM;

        side(...args): ASM;

        delay(...args): ASM;

        jmp(...args): ASM;

        nop(...args): ASM;
    }

    class PIO {
        static FIFO_JOIN_TX: number;
    }

    class StateMachine {
        constructor(
            id: number,
            asm: ASM,
            options: {
                freq?: number,
                inBase?: number,
                inCount?: number,
                outBase?: number,
                outCount?: number,
                setBase?: number,
                setCount?: number,
                sidesetBase?: number,
                jmpPin?: number,
                inShiftDir?: number,
                autopush?: boolean,
                pushThreshold?: number,
                outShiftDir?: number,
                autopull?: boolean,
                pullThreshold?: number,
                fifoJoin?: number,
                outSticky?: boolean,
                outEnablePin?: number,
                movStatusSel?: number,
                movStatusN?: number,
            },
        ) {
        }

        static getAvailableId(): number;

        active(enable: boolean): number;

        put(value: number | Uint32Array): void;

        irq(handler: (interrupt: number) => void): number;
    }
}


declare module 'pwm' {

    interface IPWM {

        /** Start to generate PWM signal */
        start(): void;

        /**
         * Set the new PWM duty
         * @param duty number 0 to 1
         */
        setDuty(duty: number): void;

    }

    class PWM implements IPWM {
    }

}

declare module 'spi' {

    interface ISPI {

        /** Send data via SPI bus */
        send(data: Uint8Array | string, timeout?: number, count?: number): number;

        /** Closes the SPI bus */
        close(): void;

        new(bus: number, options: SPIOptions): ISPI;

    }

}