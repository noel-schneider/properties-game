import data from './concepts.json'


export class Concept {
    private name: string;
    private allProperties: string[];
    private foundProperties: string[];

    constructor(name: string, properties: string[]) {
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