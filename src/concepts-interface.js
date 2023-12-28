import data from './concepts.json'

export function getAllData() {
    return data;
}

export function readAllConcepts() {
    return Object.keys(data);
}