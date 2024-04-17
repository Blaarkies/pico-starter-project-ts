import { ButtonLongPressConfig } from '../../devices/multi-action-button/multi-action-button';
import { waitForDuration } from '../time';

export class ButtonHoldLoopHandler {

    timeAtPress = 0;
    timeAtRelease = 0;

    private transitionHandle = 0;
    private loopActive: boolean;

    constructor(
        private getButtonState: () => typeof LOW | typeof HIGH,
        private callbackRepeat: ButtonLongPressConfig['callbackRepeat'],
        private callbackStart: ButtonLongPressConfig['callbackStart'],
        private callbackEnd: ButtonLongPressConfig['callbackEnd'],
        public transitionMs: ButtonLongPressConfig['transitionMs'],
        private intervalMs: ButtonLongPressConfig['intervalMs'],
    ) {
    }

    update() {
        let isPressing = this.timeAtPress > this.timeAtRelease;

        // Button pressed
        if (isPressing) {
            this.loopActive = false;
            clearTimeout(this.transitionHandle);

            this.transitionHandle = setTimeout(async () => {
                this.callbackStart?.();

                if (this.callbackRepeat) {
                    this.loopActive = true;

                    for (let iteration = 0; this.loopActive; iteration++) {
                        if (this.getButtonState() === HIGH) {
                            this.loopActive = false;
                            break;
                        }

                        this.callbackRepeat(iteration);
                        await waitForDuration(this.intervalMs);
                    }
                }
            }, this.transitionMs) as unknown as number;

            return;
        }

        // Button released
        this.callbackEnd?.();
        this.loopActive = false;
        clearTimeout(this.transitionHandle);
    }

    dispose() {
        this.callbackEnd?.();
        this.loopActive = false;
        clearTimeout(this.transitionHandle);
    }
}