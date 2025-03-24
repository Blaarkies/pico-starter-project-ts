import {
    average,
    derivatives,
} from 'common/enumerate';

interface TimeStepReport {
    averageChange: number;
    averageAcceleration: number;
    isUniDirectional: boolean;
}

export class TimeStepRecorder {

    get timeStepsList(): number[] {
        return this.timeSteps.slice();
    }

    private timeSteps: number[];

    constructor(private getTime: () => number = performance.now) {
        this.reset();
    }

    mark() {
        this.timeSteps.push(this.getTime());
    }

    reset() {
        this.timeSteps = [];
    }

    getAnalysis(): TimeStepReport {
        let differenceList = derivatives(this.timeStepsList);
        let averageChange = average(differenceList);

        let secondDerivative = derivatives(differenceList, 1);
        let averageAcceleration = average(secondDerivative);

        let isUniDirectional = averageChange > 0
                               ? differenceList.every(n => n > 0)
                               : averageChange < 0
                                 ? differenceList.every(n => n < 0)
                                 : differenceList.every(n => n === 0);

        return {
            averageChange,
            averageAcceleration,
            isUniDirectional,
        };
    }

}