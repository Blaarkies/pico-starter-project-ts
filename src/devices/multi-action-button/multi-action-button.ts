import { ButtonHoldLoopHandler } from './internal/button-hold-loop-handler';

type DisposeFn = () => void;

type ListenerAsyncFn = (...args: Parameters<ListenerFn>) => Promise<ReturnType<ListenerFn>>;
type ButtonActionFn = ListenerFn | ListenerAsyncFn;

/**
 * Defines the configuration of a long press button.
 *
 * When the button is held down for a duration defined by `transitionMs`,
 * the `startFn` function is called and a loop begins to
 * repeatedly call the `repeatFn` function at a tempo
 * defined by `intervalMs`. When the button is finally released,
 * the loop stops and the `endFn` function is called.
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
export interface ButtonLongPressConfig {
    /** Called repeatedly while button is held down */
    repeatFn?: (iteration: number) => void;
    /** Called when transition starts */
    startFn?: ButtonActionFn;
    /** Called when transition ends */
    endFn?: ButtonActionFn;
    /** Amount of time to hold down the button */
    transitionMs?: number;
    /** Interval duration for calls to `repeatFn`*/
    intervalMs?: number;
}

/**
 * Manages multiple actions on a single hardware button.
 *
 * Examples: Touch and hold an app icon on a mobile/tablet to initiate
 * a 'long press', allowing you to drag the icon around. This is extra
 * functionality on the same "button". We can do this with physical
 * hardware buttons as well.
 *
 * Supports running a list of callbacks for each type of change
 * (pressing, releasing, any state change).
 *
 * Additionally supports [long-press]{@link ButtonLongPressConfig} callbacks for:
 * - transitioning to a hold state
 * - when held down during and after transitioning
 * - releasing after a transition
 */
export class MultiActionButton {

    private pressFnSet = new Set<ButtonActionFn>();
    private releaseFnSet = new Set<ButtonActionFn>();
    private changeFnSet = new Set<ButtonActionFn>();

    private watchId: number;
    private loopHandler: ButtonHoldLoopHandler;

    constructor(private readonly pinIndex: number, debounceDurationMs = 30) {
        let handleButtonFn = () => {
            // pressing button grounds the circuit, reading 0
            let isPress = !digitalRead(pinIndex);

            this.changeFnSet.forEach(fn => fn?.());

            if (isPress) {
                this.pressFnSet.forEach(fn => fn?.());
            }

            // onLongPress() callback
            if (this.loopHandler) {
                this.manageLongPressTransition(isPress);
            } else if (!isPress) {
                // Basic release functions only run when no onLongPress
                // function was added, else this gets handled by
                // manageLongPressTransition()
                this.releaseFnSet.forEach(fn => fn?.());
            }
        };

        pinMode(pinIndex, INPUT_PULLUP);
        this.watchId = setWatch(
            handleButtonFn,
            pinIndex,
            CHANGE,
            debounceDurationMs);
    }

    private manageLongPressTransition(isPress: boolean) {
        let now = millis();
        let lh = this.loopHandler;

        if (isPress) {
            lh.timeAtPress = now;
            lh.update();

            return;
        }

        lh.timeAtRelease = now;
        lh.update();

        if (lh.wasReleasedAsShortPress) {
            this.releaseFnSet.forEach(fn => fn?.());
        }
    }

    dispose() {
        if (this.watchId !== undefined) {
            clearWatch(this.watchId);
            this.watchId = undefined;
        }
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

    onLongPress(config: ButtonLongPressConfig): DisposeFn {
        this.loopHandler?.dispose();

        let getButtonState = () => digitalRead(this.pinIndex);

        this.loopHandler = new ButtonHoldLoopHandler(
            getButtonState,
            config.repeatFn,
            config.startFn,
            config.endFn,
            config.transitionMs ?? 500,
            config.intervalMs ?? 500);

        return () => {
            this.loopHandler?.dispose();
            delete this.loopHandler;
        };
    }

}