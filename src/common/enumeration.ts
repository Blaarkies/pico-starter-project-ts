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
