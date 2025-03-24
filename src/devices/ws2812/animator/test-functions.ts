import { lerpRgbPixelLinear } from 'devices/ws2812/animator/lerp-color-channels';
import { AnimationConfig } from 'devices/ws2812/animator/pixel-animator';
import { Ws2812 } from 'devices/ws2812/ws2812';
import { Subject } from 'rxjs';

export function makeMockWs2812(ledCount = 10): jest.Mocked<Ws2812> {
    return <Partial<jest.Mocked<Ws2812>>>{
        write: jest.fn(),
        replaceBuffer: jest.fn(),
        setLed: jest.fn(),
        setLedColor: jest.fn(),
        fillAllColor: jest.fn(),
        ledCount,
    } as jest.Mocked<Ws2812>;
}

interface MockConfigArgs {
    ledCount?: number;
}

export function makeMockConfig(
    {
        animationFn,
        duration = 2e3,
        toRgb = [100, 200, 255],
        ledCount = 10,
        fps = 10,
    }: Partial<AnimationConfig> & MockConfigArgs) {
    let pixels = makeMockWs2812(ledCount);

    let config: AnimationConfig = {
        animationFn,
        duration,
        fromRgb: [0, 0, 0],
        toRgb,
        rgbLerpFn: lerpRgbPixelLinear,
        fps,
        stop$: new Subject(),
        pixels,
        intervalMs: undefined,
        stepCount: undefined,
    };
    config.intervalMs = 1e3 / config.fps;
    config.stepCount = Math.floor(config.duration / config.intervalMs);

    return {pixels, toRgb, config};
}

export function getUpdatedPixelIndexes(
    pixels: ReturnType<typeof makeMockWs2812>)
    : number[] {
    return pixels.setLedColor.mock.calls.map(([i]) => i);
}