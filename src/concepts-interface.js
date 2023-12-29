import data from './concepts.json'


class Concept {
    constructor(name, properties) {
        this.name = name;
        this.allProperties = properties;
        this.foundProperties = [];
    }

}

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