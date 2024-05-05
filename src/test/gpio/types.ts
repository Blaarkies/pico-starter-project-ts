export type GpioState = typeof LOW | typeof HIGH;

export type GpioMode = number
    | typeof INPUT
    | typeof OUTPUT
    | typeof INPUT_PULLUP
    | typeof INPUT_PULLDOWN;

export type IrqStatusType =
    | typeof FALLING
    | typeof RISING
    | typeof CHANGE;

export type IrqEvent = { pin: number, status: IrqStatusType };
