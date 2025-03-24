import { lerp } from 'common/interpolate';
import { waitForDuration } from 'common/time';

type DisposeFn = () => void;

type PollEvent<T> = (newValue: T, oldValue: T) => void;

interface PollConfig<T> {
    calibrationTransform: (value: number) => T;
    intervalLimits: number[];
    minDistance: number;
}

/**
 * Periodically reads the value on an ADC pin, transforms the value
 * and then runs the listener function. The read interval duration
 * dynamically adjusts on each iteration to prioritize quick responses
 * during user activity and longer sleep cycles when no activity is present.
 *
 * Constructor `config` provides fine-tuning for better results.
 */
export class Poller<T = number> {

    private adc: IADC;
    private config: PollConfig<T>;
    private fn: PollEvent<T>;
    private stopped = true;
    private oldReading: number;
    private oldValue: T;
    private newValue: T;

    constructor(pin: number, config: PollConfig<T>) {
        this.adc = board.adc(pin);
        this.config = {
            ...config,
        };
    }

    onChange(fn: PollEvent<T>): DisposeFn {
        this.fn = fn;
        let wasStopped = this.stopped;
        this.stopped = false;

        if (wasStopped) {
            this.startPolling();
        }
        return () => {
            this.stopped = true;
            this.fn = undefined;
        };
    }

    private async startPolling() {
        let minInterval = this.config.intervalLimits[0];
        let maxInterval = this.config.intervalLimits[1];
        let interval = maxInterval;

        for (let iteration = 0; true; iteration++) {
            if (this.stopped) {
                break;
            }

            let reading = this.adc.read();
            let distance = Math.abs(reading - this.oldReading);

            if (distance > this.config.minDistance || isNaN(this.oldReading)) {
                this.oldReading = reading;

                let transformedValue = this.config
                    .calibrationTransform(reading);
                this.oldValue = this.newValue;
                this.newValue = transformedValue;

                this.fn(this.newValue, this.oldValue);

                interval = minInterval;
            } else {
                interval = lerp(interval, maxInterval, .05);
            }

            await waitForDuration(interval);
        }
    }
}