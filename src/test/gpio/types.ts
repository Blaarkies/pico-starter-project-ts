export type GpioState = typeof LOW | typeof HIGH;

export type IrqStatusType =
    | typeof FALLING
    | typeof RISING
    | typeof CHANGE;

export type IrqEvent = { pin: number, status: IrqStatusType };
