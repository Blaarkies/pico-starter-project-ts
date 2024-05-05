export interface DigitalIoMocks {
    digitalRead: jest.Mocked<typeof digitalRead>;
    pinMode: jest.Mocked<typeof pinMode>;
    setWatch: jest.Mocked<typeof setWatch>;
    clearWatch: jest.Mocked<typeof clearWatch>;
}