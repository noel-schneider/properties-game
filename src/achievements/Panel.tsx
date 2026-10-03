import { useEffect, useState } from 'react'
import './Panel.css'
import { CATALOGUE } from './catalogue'
import { useTranslator } from '../i18n'
import type { Achievement } from './types'

interface PanelProps {
    /** Throws away every achievement earned, and the counts behind them. */
    onForget?: () => void;
    unlocked: string[];
}

function Entry({ achievement, earned }: { achievement: Achievement; earned: boolean }) {
    const { t, achievement: wording } = useTranslator();
    const { name, description } = wording(achievement.id);

    // A secret still to be found gives nothing away: no name, no description,
    // no icon. Only that there is something there.
    const concealed = achievement.secret && !earned;

    return (
        <li
            className="panel__entry"
            data-testid={`entry-${achievement.id}`}
            data-earned={String(earned)}
            data-secret={String(achievement.secret ?? false)}
        >
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

function Panel({ unlocked, onForget}: PanelProps) {
    const { t } = useTranslator();
    const [open, setOpen] = useState(false);
    // Clearing cannot be undone, so it is asked for twice and never on a stray
    // click. Shut again whenever the sheet is.
    const [asking, setAsking] = useState(false);
    const earned = new Set(unlocked);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setOpen(false); setAsking(false); }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    return (
        <div className="panel">
            <button
                type="button"
                className={open ? 'control control--on' : 'control'}
                onClick={() => setOpen((current) => !current)}
            >
                🏆 {t('panel.open')}{' '}
                <span className="control__count">{earned.size} / {CATALOGUE.length}</span>
            </button>

            {open && (
                <div className="panel__sheet" role="dialog" aria-modal="true" aria-label={t('panel.title')}>
                    <div className="panel__header">
                        <h2 className="panel__title">{t('panel.title')}</h2>
                        {/*
                          * Clearing sits in the header beside closing, as an
                          * icon the size of every other icon in the game. On a
                          * row of its own it was a wide button with nothing
                          * beside it, which read as a mistake.
                          */}
                        {onForget && (
                            <button
                                type="button"
                                className={asking ? 'control control--icon control--on' : 'control control--icon'}
                                disabled={earned.size === 0}
                                onClick={() => setAsking((current) => !current)}
                                aria-label={t('panel.forget')}
                                title={t('panel.forget')}
                                aria-expanded={asking}
                            >
                                <svg className="control__glyph" viewBox="0 0 16 16" aria-hidden="true">
                                    <path className="control__wave" d="M3 4.3 h10" />
                                    <path className="control__wave" d="M6.2 4.3 V2.9 h3.6 v1.4" />
                                    <path className="control__wave" d="M4.4 4.3 l0.7 8.8 h5.8 l0.7 -8.8" />
                                </svg>
                            </button>
                        )}
                        <button
                            type="button"
                            className="control control--icon"
                            onClick={() => setOpen(false)}
                            aria-label={t('panel.close')}
                            title={t('panel.close')}
                        >
                            ✕
                        </button>
                    </div>
                    {onForget && asking && (
                        <div className="panel__clearing">
                            <p className="panel__warning">{t('panel.forgetSure')}</p>
                            <div className="panel__choices">
                                <button
                                    type="button"
                                    className="control"
                                    onClick={() => setAsking(false)}
                                >
                                    {t('panel.forgetKeep')}
                                </button>
                                <button
                                    type="button"
                                    className="control control--danger"
                                    onClick={() => {
                                        setAsking(false);
                                        onForget();
                                    }}
                                >
                                    {t('panel.forgetYes')}
                                </button>
                            </div>
                        </div>
                    )}
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
