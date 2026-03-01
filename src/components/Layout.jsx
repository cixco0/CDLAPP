import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { getActiveDetention } from '../services/detentionService';
import { hasTodayPreTrip } from '../services/inspectionService';
import { getElapsedTime, getTodayStr } from '../utils/formatters';

// SF Symbols-style SVG icons
const icons = {
    home: (active) => (
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill={active ? 'rgba(0,122,255,0.15)' : 'none'} />
            <path d="M9 21V12h6v9" />
        </svg>
    ),
    loads: (active) => (
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" fill={active ? 'rgba(0,122,255,0.15)' : 'none'} />
            <path d="M8 8h8M8 12h6M8 16h4" />
        </svg>
    ),
    capture: (active) => (
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" fill={active ? 'rgba(0,122,255,0.15)' : 'none'} />
            <circle cx="12" cy="13" r="4" />
        </svg>
    ),
    inspect: (active) => (
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" fill={active ? 'rgba(0,122,255,0.15)' : 'none'} />
        </svg>
    ),
    more: (active) => (
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={active ? '#007AFF' : '#8E8E93'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1.5" fill={active ? '#007AFF' : '#8E8E93'} />
            <circle cx="12" cy="12" r="1.5" fill={active ? '#007AFF' : '#8E8E93'} />
            <circle cx="12" cy="19" r="1.5" fill={active ? '#007AFF' : '#8E8E93'} />
        </svg>
    ),
};

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
        { path: '/', label: 'Home', iconKey: 'home' },
        { path: '/loads', label: 'Loads', iconKey: 'loads' },
        { path: '/capture', label: 'Capture', iconKey: 'capture' },
        { path: '/inspect', label: 'Inspect', iconKey: 'inspect' },
        { path: '/more', label: 'More', iconKey: 'more' },
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="h-full flex flex-col bg-black">
            {/* Detention bar */}
            {detention && (
                <div className="detention-bar bg-accent-red/90 px-4 py-2.5 flex items-center justify-between text-white text-ios-footnote font-semibold shrink-0">
                    <span>⏱️ Detention: {detentionTime}</span>
                    {detention.location && (
                        <span className="text-ios-caption2 opacity-80">📍 {detention.location}</span>
                    )}
                </div>
            )}

            {/* Pre-trip warning */}
            {!hasPreTrip && (
                <div className="bg-accent-orange/90 px-4 py-2.5 text-white text-ios-footnote font-semibold shrink-0">
                    ⚠️ Pre-Trip Inspection Not Completed
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 overflow-hidden">
                {children}
            </div>

            {/* iOS-style frosted glass bottom tab bar */}
            <nav
                className="shrink-0 glass-bar border-t border-white/[0.08] flex items-stretch justify-around"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="flex flex-col items-center justify-center py-1.5 px-3 min-h-[50px] min-w-[56px]"
                        >
                            <div className="mb-0.5">
                                {icons[item.iconKey](active)}
                            </div>
                            <span
                                className="text-[10px] font-medium"
                                style={{ color: active ? '#007AFF' : '#8E8E93' }}
                            >
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
}
