import { makeNumberList } from 'common/enumerate';

/**
 * Generates a list of LEDs that need updating according to a cursor moving
 * across the LED strip, while keeping track of previous LEDs that were already
 * updated.
 */
export class LedListGenerator {
    private lastStepIndex: number;
    private lastLedIndex: number;
    private oldLedIndex = -1;

    positionRatio: number;

    constructor(stepCount: number, ledCount: number) {
        this.lastStepIndex = stepCount - 1;
        this.lastLedIndex = ledCount - 1;
    }

    generate(index: number): number[] {
        this.positionRatio = index / this.lastStepIndex;
        let ledCursorIndex = Math.round(
            this.positionRatio * this.lastLedIndex);
        let updateCount = ledCursorIndex - this.oldLedIndex;

        let list = makeNumberList(updateCount, this.oldLedIndex + 1);

        this.oldLedIndex += updateCount;

        return list;
    }
}