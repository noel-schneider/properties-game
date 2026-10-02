import { useEffect, useState } from 'react'
import './Reset.css'
import { useTranslator } from './i18n'

interface ResetProps {
    onReset: () => void;
}

/**
 * Starting over, behind a confirmation.
 *
 * It throws away a game that can take half an hour, so one stray click must
 * not be enough — and the confirmation says what goes and what stays rather
 * than asking "are you sure?".
 */
function Reset({ onReset }: ResetProps) {
    const { t } = useTranslator();
    const [asking, setAsking] = useState(false);

    useEffect(() => {
        if (!asking) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setAsking(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [asking]);

    return (
        <>
            <button
                type="button"
                className="panel__button panel__button--icon"
                onClick={() => setAsking(true)}
                aria-label={t('reset.open')}
                title={t('reset.open')}
            >
                ↺
            </button>

            {asking && (
                <div className="reset" role="dialog" aria-modal="true" aria-label={t('reset.open')}>
                    <div className="reset__card">
                        <h2 className="reset__title">{t('reset.title')}</h2>
                        <p className="reset__text">{t('reset.what')}</p>
                        <div className="reset__actions">
                            <button
                                type="button"
                                className="reset__button"
                                onClick={() => setAsking(false)}
                            >
                                {t('reset.cancel')}
                            </button>
                            <button
                                type="button"
                                className="reset__button reset__button--danger"
                                onClick={() => {
                                    setAsking(false);
                                    onReset();
                                }}
                            >
                                {t('reset.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Reset;
