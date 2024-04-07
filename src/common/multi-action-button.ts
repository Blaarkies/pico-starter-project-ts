import { GPIO } from 'gpio';
import { ButtonHoldLoopHandler } from './internal/button-hold-loop-handler';

type DisposeFn = () => void;

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
    callbackStart?: ListenerFn;
    /** Called when transition ends */
    callbackEnd?: ListenerFn;
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

    private pressFnSet = new Set<ListenerFn>();
    private releaseFnSet = new Set<ListenerFn>();
    private changeFnSet = new Set<ListenerFn>();
    private readonly pin: GPIO;
    private loopHandler: ButtonHoldLoopHandler;

    constructor(pinIndex: number) {
        this.pin = new GPIO(pinIndex, INPUT_PULLUP);
        this.pin.irq((_, status) => {
            if (status === FALLING || status === RISING) {
                this.changeFnSet.forEach(fn => fn());
            }
            if (status === FALLING) {
                this.pressFnSet.forEach(fn => fn());
            }

            if (this.loopHandler) {
                this.manageHoldTransition(status);
                return;
            }

            if (status === RISING) {
                this.releaseFnSet.forEach(fn => fn());
            }
        }, CHANGE);
    }

    private manageHoldTransition(status: number) {
        let lh = this.loopHandler;
        let now = millis();
        // Occasionally `status===CHANGE`. Unclear why, so ignore it
        if (status === FALLING) {
            lh.timeDown = now;
            lh.update();
        } else if (status === RISING) {
            lh.timeUp = now;
            lh.update();

            let releasedBeforeHold =
                (lh.timeUp - lh.timeDown) < lh.transitionMs;
            // Determine if this button release happened before a
            // loop transition
            if (releasedBeforeHold) {
                this.releaseFnSet.forEach(fn => fn());
            }
        }
    }

    dispose() {
        this.pin.irq(undefined);
    }

    onPress(callback: ListenerFn): DisposeFn {
        this.pressFnSet.add(callback);
        return () => this.pressFnSet.delete(callback);
    }

    onRelease(callback: ListenerFn) {
        this.releaseFnSet.add(callback);
        return () => this.releaseFnSet.delete(callback);
    }

    onChange(callback: ListenerFn) {
        this.changeFnSet.add(callback);
        return () => this.changeFnSet.delete(callback);
    }

    onHold({
               callbackRepeat,
               callbackStart,
               callbackEnd,
               transitionMs = 300,
               intervalMs = 500,
           }: ButtonHoldConfig): DisposeFn {
        this.loopHandler?.dispose();

        let getButtonState = this.pin.read.bind(this.pin);
        this.loopHandler = new ButtonHoldLoopHandler(
            getButtonState,
            callbackRepeat,
            callbackStart,
            callbackEnd,
            transitionMs,
            intervalMs);

        return () => {
            this.loopHandler?.dispose();
            delete this.loopHandler;
        };
    }

}