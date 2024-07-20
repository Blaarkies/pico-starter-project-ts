export function makeNumberList(count: number, offset: number = 0): number[] {
    let safeCount = Math.round(count);
    let list = Array.from(Array(safeCount).keys());
    return offset
           ? list.map(n => n + offset)
           : list;
}

export function pickRandomElement<T>(list: T[]): T {
    let randomIndex = Math.round(Math.random() * (list.length - 1));
    return list[randomIndex];
}

export function sum(list: number[]): number {
    let sum = 0;
    for (let element of list) {
        sum += element;
    }
    return sum;
}

export function average(list: number[]): number {
    return sum(list) / list.length;
}

function getDifferences(list: number[]): number[] {
    return list
        .map((t, i, self) => self[i + 1] - t)
        .slice(0, -1);
}

export function derivatives(list: number[], n: number = 1): number[] {
    if (list.length <= n) {
        throw new Error(`[list](length=${list.length}) is too short for `
            + `calculations at derivative depth [${n}]`);
    }
    let resultList = list;
    for (let i = 0; i < n; i++) {
        resultList = getDifferences(resultList);
    }
    return resultList;
}