import { waitForDuration } from '../../../common';
import { ButtonLongPressConfig } from '../multi-action-button';

export class ButtonHoldLoopHandler {

    timeAtPress = 0;
    timeAtRelease = 0;

    private transitionHandle = 0;
    private loopActive: boolean;

    get wasReleasedAsShortPress(): boolean {
        return (this.timeAtRelease - this.timeAtPress) < this.transitionMs;
    }

    constructor(
        private getButtonState: () => number,
        private repeatFn: ButtonLongPressConfig['repeatFn'],
        private startFn: ButtonLongPressConfig['startFn'],
        private endFn: ButtonLongPressConfig['endFn'],
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
                this.startFn?.();

                if (this.repeatFn) {
                    this.loopActive = true;

                    for (let iteration = 0; this.loopActive; iteration++) {
                        if (this.getButtonState() === HIGH) {
                            this.loopActive = false;
                            break;
                        }

                        this.repeatFn(iteration);
                        await waitForDuration(this.intervalMs);
                    }
                }
            }, this.transitionMs) as unknown as number;

            return;
        }

        // Button released
        if (!this.wasReleasedAsShortPress) {
            this.endFn?.();
        }
        this.loopActive = false;
        clearTimeout(this.transitionHandle);
    }

    dispose() {
        this.endFn?.();
        this.loopActive = false;
        clearTimeout(this.transitionHandle);
    }
}