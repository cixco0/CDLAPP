import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { getActiveDetention } from '../services/detentionService';
import { hasTodayPreTrip } from '../services/inspectionService';
import { getElapsedTime, getTodayStr } from '../utils/formatters';

export default function Layout({ children }) {
    const location = useLocation();
    const [detention, setDetention] = useState(null);
    const [hasPreTrip, setHasPreTrip] = useState(true);
    const [detentionTime, setDetentionTime] = useState('');

    useEffect(() => {
        const check = async () => {
            const active = await getActiveDetention();
            setDetention(active);
            const preTrip = await hasTodayPreTrip(getTodayStr());
            setHasPreTrip(preTrip);
        };
        check();
        const interval = setInterval(check, 10000);
        return () => clearInterval(interval);
    }, [location]);

    // Update detention timer every second
    useEffect(() => {
        if (!detention) return;
        const update = () => setDetentionTime(getElapsedTime(detention.startTime));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [detention]);

    const navItems = [
        { path: '/', label: 'Home', icon: '🏠' },
        { path: '/loads', label: 'Loads', icon: '📋' },
        { path: '/capture', label: 'Capture', icon: '📸' },
        { path: '/inspect', label: 'Inspect', icon: '🔧' },
        { path: '/more', label: 'More', icon: '☰' },
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="h-full flex flex-col bg-surface">
            {/* Detention bar */}
            {detention && (
                <div className="detention-bar bg-accent-red px-4 py-2 flex items-center justify-between text-white text-sm font-semibold shrink-0">
                    <span>⏱️ Detention: {detentionTime}</span>
                    {detention.location && (
                        <span className="text-xs opacity-80">📍 {detention.location}</span>
                    )}
                </div>
            )}

            {/* Pre-trip warning */}
            {!hasPreTrip && (
                <div className="bg-accent-yellow px-4 py-2 text-black text-sm font-semibold shrink-0">
                    ⚠️ Pre-Trip Inspection Not Completed
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 overflow-hidden">
                {children}
            </div>

            {/* Bottom Navigation */}
            <nav className="shrink-0 bg-surface-card border-t border-border flex items-stretch justify-around"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center justify-center py-2 px-3 min-h-touch min-w-[56px] transition-smooth ${isActive(item.path)
                                ? 'text-accent-green'
                                : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        <span className="text-xl leading-none mb-0.5">{item.icon}</span>
                        <span className="text-[11px] font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
