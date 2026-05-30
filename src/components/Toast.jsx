import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(null);

const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
const COLORS = {
    success: 'bg-[#30D158]',
    error:   'bg-[#FF453A]',
    warning: 'bg-[#FF9F0A]',
    info:    'bg-[#007AFF]',
};

function ToastItem({ message, type, visible }) {
    return (
        <div
            className={`
                ${COLORS[type] ?? COLORS.info}
                flex items-center gap-3 px-4 py-3 rounded-ios shadow-xl
                transition-all duration-300 ease-out
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
        >
            <span className="text-white font-bold text-base leading-none shrink-0">
                {ICONS[type]}
            </span>
            <span className="text-white text-ios-footnote font-semibold flex-1 leading-snug">
                {message}
            </span>
        </div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(0);

    const show = useCallback((message, type = 'success', duration = 2800) => {
        const id = ++nextId.current;
        setToasts((prev) => [...prev, { id, message, type, visible: false }]);
        // Trigger entrance transition on next frame
        requestAnimationFrame(() =>
            setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: true } : t)))
        );
        // Fade out then remove
        setTimeout(() => {
            setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)));
            setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 350);
        }, duration);
    }, []);

    return (
        <ToastContext.Provider value={show}>
            {children}
            {/* Sits above the nav bar, below any modals */}
            <div
                className="fixed left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
                style={{ bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))' }}
            >
                {toasts.map((t) => (
                    <ToastItem key={t.id} message={t.message} type={t.type} visible={t.visible} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

/** Call `toast('Message')` or `toast('Error', 'error')` from any screen inside ToastProvider. */
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
}
