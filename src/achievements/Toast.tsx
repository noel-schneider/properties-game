import { useEffect } from 'react'
import './Toast.css'
import { useTranslator } from '../i18n'
import type { Achievement } from './types'

export const TOAST_MS = 4000;

interface ToastProps {
    unlocked: Achievement[];
    onDismiss: (id: string) => void;
}

function Announcement({ achievement, onDismiss }: { achievement: Achievement; onDismiss: (id: string) => void }) {
    const { t, achievement: wording } = useTranslator();
    const { name, description } = wording(achievement.id);

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(achievement.id), TOAST_MS);
        return () => clearTimeout(timer);
    }, [achievement.id, onDismiss]);

    return (
        <div className="toast" role="alert">
            <span className="toast__icon" aria-hidden="true">{achievement.icon}</span>
            <span className="toast__text">
                <span className="toast__label">{t('toast.unlocked')}</span>
                <span className="toast__name">{name}</span>
                <span className="toast__description">{description}</span>
            </span>
        </div>
    );
}

function Toast({ unlocked, onDismiss }: ToastProps) {
    if (unlocked.length === 0) return null;

    return (
        <div className="toast-stack">
            {unlocked.map((achievement) => (
                <Announcement key={achievement.id} achievement={achievement} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

export default Toast;
