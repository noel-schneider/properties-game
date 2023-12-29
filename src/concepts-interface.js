import data from './concepts.json'

export function getAllData() {
    return data;
}

export function getAllConcepts() {
    return Object.fromEntries(
        Object.entries(data).map(([name, properties]) => [
            name,
            new Concept(name, properties),
        ])
    );
}