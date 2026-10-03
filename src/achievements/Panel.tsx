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
                        <button
                            type="button"
                            className="control control--icon"
                            onClick={() => setOpen(false)}
                            aria-label={t('panel.close')}
                        >
                            ✕
                        </button>
                    </div>
                    {onForget && (
                        <div className="panel__clearing">
                            {asking ? (
                                <>
                                    <span className="panel__warning">{t('panel.forgetSure')}</span>
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
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="control"
                                    disabled={earned.size === 0}
                                    onClick={() => setAsking(true)}
                                >
                                    {t('panel.forget')}
                                </button>
                            )}
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
