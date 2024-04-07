import { ButtonHoldConfig } from '../multi-action-button';
import { waitForDuration } from '../time';

export class ButtonHoldLoopHandler {

    timeDown = 0;
    timeUp = 0;

    private transitionHandle = 0;
    private loopActive: boolean;

    constructor(
        private getButtonState: () => typeof LOW | typeof HIGH,
        private callbackRepeat: ButtonHoldConfig['callbackRepeat'],
        private callbackStart: ButtonHoldConfig['callbackStart'],
        private callbackEnd: ButtonHoldConfig['callbackEnd'],
        public transitionMs: ButtonHoldConfig['transitionMs'],
        private intervalMs: ButtonHoldConfig['intervalMs'],
    ) {
    }

    update() {
        let isPressing = this.timeDown > this.timeUp;

        // Button pressed
        if (isPressing) {
            this.loopActive = false;
            clearTimeout(this.transitionHandle);

            this.transitionHandle = setTimeout(async () => {
                this.callbackStart?.();

                if (!this.callbackRepeat) {
                    return;
                }

                this.loopActive = true;
                for (let iteration = 0; this.loopActive; iteration++) {
                    if (this.getButtonState() === HIGH) {
                        this.loopActive = false;
                    }

                    this.callbackRepeat(iteration);
                    await waitForDuration(this.intervalMs);
                }

                this.callbackEnd?.();
            }, this.transitionMs) as unknown as number;
            return;
        }

        // Button released
        this.loopActive = false;
        clearTimeout(this.transitionHandle);
    }

    dispose() {
        this.loopActive = false;
        clearTimeout(this.transitionHandle);
    }
}