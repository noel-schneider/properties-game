import { useEffect, useState } from 'react'
import './Panel.css'
import { CATALOGUE } from './catalogue'
import type { Achievement } from './types'

interface PanelProps {
    unlocked: string[];
    muted: boolean;
    onToggleMute: () => void;
}

function Entry({ achievement, earned }: { achievement: Achievement; earned: boolean }) {
    // A secret still to be found gives nothing away: no name, no description,
    // no icon. Only that there is something there.
    const concealed = achievement.secret && !earned;

    return (
        <li className="panel__entry" data-testid={`entry-${achievement.id}`} data-earned={String(earned)}>
            <span className="panel__icon" aria-hidden="true">{concealed ? '🔒' : achievement.icon}</span>
            {concealed ? (
                <span className="panel__text">
                    <span className="panel__name panel__name--secret">???</span>
                    <span className="panel__description">A secret achievement.</span>
                </span>
            ) : (
                <span className="panel__text">
                    <span className="panel__name">{achievement.name}</span>
                    <span className="panel__description">{achievement.description}</span>
                </span>
            )}
        </li>
    );
}

function Panel({ unlocked, muted, onToggleMute }: PanelProps) {
    const [open, setOpen] = useState(false);
    const earned = new Set(unlocked);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    return (
        <div className="panel">
            <div className="panel__controls">
                <button
                    type="button"
                    className="panel__button"
                    onClick={() => setOpen((current) => !current)}
                >
                    🏆 Achievements <span className="panel__count">{earned.size} / {CATALOGUE.length}</span>
                </button>
                <button
                    type="button"
                    className="panel__button panel__button--icon"
                    onClick={onToggleMute}
                    aria-label={muted ? 'Unmute achievement sound' : 'Mute achievement sound'}
                >
                    {muted ? '🔇' : '🔊'}
                </button>
            </div>

            {open && (
                <div className="panel__sheet" role="dialog" aria-modal="true" aria-label="Achievements">
                    <div className="panel__header">
                        <h2 className="panel__title">Achievements</h2>
                        <button
                            type="button"
                            className="panel__button panel__button--icon"
                            onClick={() => setOpen(false)}
                            aria-label="Close achievements"
                        >
                            ✕
                        </button>
                    </div>
                    <ul className="panel__list">
                        {CATALOGUE.map((achievement) => (
                            <Entry
                                key={achievement.id}
                                achievement={achievement}
                                earned={earned.has(achievement.id)}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default Panel;
