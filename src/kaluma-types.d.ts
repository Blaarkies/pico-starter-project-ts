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

    /** Stop generating PWM signal */
    stop(): void;

    /** Close the PWM port */
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

    /** Get the current PWM duty cycle */
    getDuty(): number;

    /** Get the frequency of the PWM instance */
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

declare module 'pico_cyw43' {

  class PicoCYW43 {

    /** Returns the GPIO state, where high is true and low is false */
    getGpio(gpio: number): boolean;

    /** Set the GPIO state, where high is true and low is false */
    putGpio(gpio: number, value: boolean);

  }

}

declare module 'wifi' {

  type SecurityTypes = 'OPEN' | 'WEP' | 'WPA' | 'PSK' | 'WPA2' | 'WPA2-EAP';

  class WiFi {
    /** Reset the Wi-Fi device */
    reset(callback: () => void);

    /** Scans for available Wi-Fi networks */
    scan(callback: (err, scanResults: {
        security: SecurityTypes;
        ssid: string;
        rssi: number;
        bssid: string;
        channel: number;
      }) => void,
    );

    /** Connects to a Wi-Fi network */
    connect(
      connectInfo: {
        ssid: string;
        password: string;
        bssid: string; //  O_**_BSSID. (Typically MAC address)
        /** Default: OPEN if password is not set or length of the password is less
         * than 8 characters. WPA2_WPA_PSK if length of the password is greater or
         * equal to 8 characters. */
        security: SecurityTypes;
        /** When true, enforce to connect even if there is already a Wi-Fi
         * connection. Otherwise, do not try to connect if there is Wi-Fi
         * connection. Default: false. */
        enforce: boolean;
      },
      callback: (err, connectInfo: {}) => void,
    );

    /** Disconnect from currently connected Wi-Fi network */
    disconnect(callback: (error) => void);

    /** Get connection information of currently connected Wi-Fi network */
    getConnection(callback: (error, connectionInfo: {
      ssid: string;
      bssid: string;
    }) => void);
  }

}
