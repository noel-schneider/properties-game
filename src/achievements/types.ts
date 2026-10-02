export type GameEvent =
    | { type: 'board-dealt'; at: number; groups: number }
    | { type: 'concept-toggled'; name: string }
    | {
          type: 'guess';
          at: number;
          correct: boolean;
          property?: string;
          /** The answer was the property's own name rather than one of its aliases. */
          exactName: boolean;
          selection: string[];
      };

/** Counters that outlive the tab. Persisted. */
export interface Lifetime {
    unlocked: string[];
    propertiesFound: string[];
    aliasAnswers: number;
    exactAnswers: number;
}

/** Counters that only mean anything within one sitting. Never persisted. */
export interface Session {
    finds: number;
    streak: number;
    boardMistakes: number;
    boardFinds: number;
    boardGroups: number;
    cleanBoardsInARow: number;
    boardDealtAt: number | null;
    toggleCounts: Record<string, number>;
    lastWrongSelection: string[] | null;
    boardJustCleared: boolean;
    /** This guess redeemed the exact selection that had just been refused. */
    redeemedLastMiss: boolean;
}

export interface Progress {
    lifetime: Lifetime;
    session: Session;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    /** Hidden in the panel until earned. */
    secret: boolean;
    /** Pure: true when this progress, reached by this event, earns it. */
    earnedBy: (progress: Progress, event: GameEvent) => boolean;
}
