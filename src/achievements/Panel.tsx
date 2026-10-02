import { useEffect, useState } from 'react'
import './Panel.css'
import { CATALOGUE } from './catalogue'
import { useTranslator } from '../i18n'
import type { Achievement } from './types'

interface PanelProps {
    unlocked: string[];
    muted: boolean;
    onToggleMute: () => void;
    /** Plays the unlock chime once, so it can be judged without earning anything. */
    onTestSound: () => void;
}

function Entry({ achievement, earned }: { achievement: Achievement; earned: boolean }) {
    const { t, achievement: wording } = useTranslator();
    const { name, description } = wording(achievement.id);

    // A secret still to be found gives nothing away: no name, no description,
    // no icon. Only that there is something there.
    const concealed = achievement.secret && !earned;

    return (
        <li className="panel__entry" data-testid={`entry-${achievement.id}`} data-earned={String(earned)}>
            <span className="panel__icon" aria-hidden="true">{concealed ? '🔒' : achievement.icon}</span>
            {concealed ? (
                <span className="panel__text">
                    <span className="panel__name panel__name--secret">{t('panel.secretName')}</span>
                    <span className="panel__description">{t('panel.secretDescription')}</span>
                </span>
            ) : (
                <span className="panel__text">
                    <span className="panel__name">{name}</span>
                    <span className="panel__description">{description}</span>
                </span>
            )}
        </li>
    );
}

function Panel({ unlocked, muted, onToggleMute, onTestSound }: PanelProps) {
    const { t } = useTranslator();
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
                    🏆 {t('panel.open')} <span className="panel__count">{earned.size} / {CATALOGUE.length}</span>
                </button>
                <button
                    type="button"
                    className="panel__button panel__button--icon"
                    onClick={onToggleMute}
                    aria-label={muted ? t('panel.unmute') : t('panel.mute')}
                    title={muted ? t('panel.unmute') : t('panel.mute')}
                >
                    {muted ? '🔇' : '🔊'}
                </button>
                <button
                    type="button"
                    className="panel__button panel__button--icon"
                    onClick={onTestSound}
                    disabled={muted}
                    aria-label={muted ? t('panel.testSoundMuted') : t('panel.testSound')}
                    title={muted ? t('panel.testSoundMuted') : t('panel.testSound')}
                >
                    🎵
                </button>
            </div>

            {open && (
                <div className="panel__sheet" role="dialog" aria-modal="true" aria-label={t('panel.title')}>
                    <div className="panel__header">
                        <h2 className="panel__title">{t('panel.title')}</h2>
                        <button
                            type="button"
                            className="panel__button panel__button--icon"
                            onClick={() => setOpen(false)}
                            aria-label={t('panel.close')}
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
