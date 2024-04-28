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

        /**
         * Returns the number of elements in the state machine's RX FIFO. The
         * size of RXFIFO is 0 in the PIO.FIFO_JOIN_TX mode, 4 in the
         * PIO.FIFO_JOIN_NONE mode, 8 in the PIO.FIFO_JOIN_RX mode. This
         * buffer size can be used to check RXFIFO full condition
         */
        rxfifo(): number;

        /**
         * Returns the number of elements in the state machine's TX FIFO. The
         * size of RXFIFO is 0 in the PIO.FIFO_JOIN_RX mode, 4 in the
         * PIO.FIFO_JOIN_NONE mode, 8 in the PIO.FIFO_JOIN_TX mode. This
         * buffer size can be used to check TXFIFO full condition.
         */
        txfifo(): number;

        /** Clear the state machine's TX FIFO and RX FIFO */
        clearFIFOs(): void;

        irq(handler: (interrupt: number) => void): number;
    }
}


declare module 'pwm' {

    interface IPWM {

        /** Start generating PWM signal */
        start(): void;

        /** Stop generating PWM signal. */
        stop(): void;

        /** Close the PWM port. */
        close(): void;

        /**
         * Set the new PWM duty cycle
         * @param duty number 0 to 1
         */
        setDuty(duty: number): void;

        /**
         * Set the new PWM frequency
         * @param frequency number in Hz
         */
        setFrequency(frequency: number): void;

        /**
         * Get the current PWM duty cycle
         */
        getDuty(): number;

        /**
         * Get the frequency of the PWM instance.
         */
        getFrequency(): number;

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