//util functions

export function getNRandomElements(array, n) {
    const shuffled = array.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
}