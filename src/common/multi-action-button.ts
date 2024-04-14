import { GPIO } from 'gpio';
import { ButtonHoldLoopHandler } from './internal/button-hold-loop-handler';

type DisposeFn = () => void;

type ListenerAsyncFn = (...args: Parameters<ListenerFn>) => Promise<ReturnType<ListenerFn>>;
type ButtonActionFn = ListenerFn | ListenerAsyncFn;

/**
 * Defines the configuration of a press-hold button.
 *
 * When the button is held down for a duration defined by `transitionMs`,
 * the `callbackStart` function is called and a loop begins to
 * repeatedly call the `callbackRepeat` function at a tempo
 * defined by `intervalMs`. When the button is finally released,
 * the loop stops and the `callbackEnd` function is called.
 *
 * Failing to hold down the button for the duration set by
 * `transitionMs` will have no effect.
 *
 * @example
 * Timeline  ^^____|___|___|_|^^
 * Event           |S  |R  |R|
 *   order         |R  |   | |E
 *
 * transitionMs=4; intervalMs=3; ^=up; _=down;
 *   S=start; R=repeat; E=end; |=delimiter
 */
export interface ButtonHoldConfig {
    /** Called repeatedly while button is held down */
    callbackRepeat?: (iteration: number) => void;
    /** Called when transition starts */
    callbackStart?: ButtonActionFn;
    /** Called when transition ends */
    callbackEnd?: ButtonActionFn;
    /** Amount of time to hold down the button */
    transitionMs?: number;
    /** Interval duration for calls to `callbackRepeat`*/
    intervalMs?: number;
}

/**
 * Manages multiple actions on a single hardware button.
 *
 * Supports running a list of callbacks for each type of change
 * (pressing, releasing, any state change).
 *
 * Additionally supports [press-and-hold]{@link ButtonHoldConfig} callbacks for:
 * - when transitioning to a hold state
 * - when held down during and after transitioning
 * - when releasing after a transition
 */
export class MultiActionButton {

    private pressFnSet = new Set<ButtonActionFn>();
    private releaseFnSet = new Set<ButtonActionFn>();
    private changeFnSet = new Set<ButtonActionFn>();
    private readonly pin: GPIO;
    private loopHandler: ButtonHoldLoopHandler;
    private lastEventTimestamp: number;

    constructor(pinIndex: number, debounceDurationMs = 50) {
        this.lastEventTimestamp = millis() - debounceDurationMs;

        this.pin = new GPIO(pinIndex, INPUT_PULLUP);

        this.pin.irq((_, status) => {
            let now = millis();

            // Filter noisy events during the debounce period
            let timeSinceLastEvent = now - this.lastEventTimestamp;
            if (timeSinceLastEvent < debounceDurationMs) {
                return;
            }
            this.lastEventTimestamp = now;

            let isPress = status === FALLING;

            // onChange() callbacks
            this.changeFnSet.forEach(fn => fn());

            // onPress() callbacks
            if (isPress) {
                this.pressFnSet.forEach(fn => fn());
            }

            // onHold() callback
            if (this.loopHandler) {
                this.manageHoldTransition(isPress, now);
            } else if (!isPress) {
                // Basic release functions only run when no OnHold function
                // was added, else this gets handled by the loopHandler
                this.releaseFnSet.forEach(fn => fn());
            }
        }, CHANGE);
    }

    private manageHoldTransition(isPress: boolean, now: number) {
        let lh = this.loopHandler;

        if (isPress) {
            lh.timeAtPress = now;
            lh.update();

            return;
        }

        lh.timeAtRelease = now;
        lh.update();

        let releasedBeforeHold =
            (lh.timeAtRelease - lh.timeAtPress) < lh.transitionMs;
        // Determine if this button release happened before a hold transition
        if (releasedBeforeHold) {
            this.releaseFnSet.forEach(fn => fn());
        }
    }

    dispose() {
        this.pin.irq(undefined);
    }

    onPress(callback: ButtonActionFn): DisposeFn {
        this.pressFnSet.add(callback);
        return () => this.pressFnSet.delete(callback);
    }

    onRelease(callback: ButtonActionFn): DisposeFn {
        this.releaseFnSet.add(callback);
        return () => this.releaseFnSet.delete(callback);
    }

    onChange(callback: ButtonActionFn): DisposeFn {
        this.changeFnSet.add(callback);
        return () => this.changeFnSet.delete(callback);
    }

    onHold(config: ButtonHoldConfig): DisposeFn {
        this.loopHandler?.dispose();

        let getButtonState = this.pin.read.bind(this.pin);

        this.loopHandler = new ButtonHoldLoopHandler(
            getButtonState,
            config.callbackRepeat,
            config.callbackStart,
            config.callbackEnd,
            config.transitionMs ?? 500,
            config.intervalMs ?? 500);

        return () => {
            this.loopHandler?.dispose();
            delete this.loopHandler;
        };
    }

}