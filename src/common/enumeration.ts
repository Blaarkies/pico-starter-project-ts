export function makeNumberList(count: number, offset: number = 0): number[] {
    let safeCount = Math.round(count);
    let list = Array.from(Array(safeCount).keys());
    return offset
           ? list.map(n => n + offset)
           : list;
}