export interface DigitalIoMocks {
    digitalRead: jest.MockedFn<typeof digitalRead>;
    pinMode: jest.MockedFn<typeof pinMode>;
    setWatch: jest.MockedFn<typeof setWatch>;
    clearWatch: jest.MockedFn<typeof clearWatch>;
    boardAdc: jest.MockedFn<typeof board.adc>;
}