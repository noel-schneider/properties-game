//util functions

export function getNRandomElements<T>(array: T[], n: number): T[] {
    const shuffled = array.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
}