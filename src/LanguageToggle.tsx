import './LanguageToggle.css'
import { LANGUAGES, useTranslator } from './i18n'
import type { Language } from './i18n'

const FLAGS: Record<Language, string> = { en: '🇬🇧', fr: '🇫🇷' };

function LanguageToggle() {
    const { language, setLanguage, t } = useTranslator();

    return (
        <div className="language" role="group" aria-label={t('language.group')}>
            {LANGUAGES.map((code) => (
                <button
                    key={code}
                    type="button"
                    className={code === language ? 'language__flag language__flag--on' : 'language__flag'}
                    onClick={() => setLanguage(code)}
                    aria-pressed={code === language}
                    // A flag is a country, not a language, so the name carries
                    // the meaning for anyone not reading the picture.
                    aria-label={t(`language.${code}` as 'language.en' | 'language.fr')}
                    title={t(`language.${code}` as 'language.en' | 'language.fr')}
                >
                    <span aria-hidden="true">{FLAGS[code]}</span>
                </button>
            ))}
        </div>
    );
}

export default LanguageToggle;
