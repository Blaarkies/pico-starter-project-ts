export function mirrorList(list: number[], final: number): number[] {
    return list.map(n => final - n);
}