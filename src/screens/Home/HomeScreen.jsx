import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSettings, getSetting, setSetting } from '../../services/settingsService';
import { getTodayEntries, isClockedIn, getLastClockIn, calculateDailyHours, getWeekEntries, getEntriesByDate, clockIn, clockOut } from '../../services/timeService';
import { getLoadsByDate } from '../../services/loadService';
import { getAllCredentials } from '../../services/credentialService';
import { hasTodayPreTrip } from '../../services/inspectionService';
import { getActiveDetention } from '../../services/detentionService';
import { formatTime, formatDate, formatDuration, getElapsedTime, daysUntil, expirationColor, getTodayStr } from '../../utils/formatters';
import { DRIVER_STATUSES, WEEKLY_HOUR_LIMIT } from '../../utils/constants';

export default function HomeScreen() {
    const navigate = useNavigate();
    const [now, setNow] = useState(new Date());
    const [settings, setSettings] = useState({});
    const [driverStatus, setDriverStatus] = useState('Off Duty');
    const [todayEntries, setTodayEntries] = useState([]);
    const [weekEntries, setWeekEntries] = useState([]);
    const [todayLoads, setTodayLoads] = useState([]);
    const [credentials, setCredentials] = useState([]);
    const [hasPreTrip, setHasPreTrip] = useState(true);
    const [detention, setDetention] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const s = await getAllSettings();
        setSettings(s);
        const status = await getSetting('driverStatus');
        setDriverStatus(status || 'Off Duty');
        const entries = await getTodayEntries();
        setTodayEntries(entries);
        const week = await getWeekEntries();
        setWeekEntries(week);
        const loads = await getLoadsByDate(getTodayStr());
        setTodayLoads(loads);
        const creds = await getAllCredentials();
        setCredentials(creds);
        const preTrip = await hasTodayPreTrip(getTodayStr());
        setHasPreTrip(preTrip);
        const det = await getActiveDetention();
        setDetention(det);
    }

    const clockedIn = isClockedIn(todayEntries);
    const todayHoursMs = calculateDailyHours(todayEntries);
    const lastClockInTime = getLastClockIn(todayEntries);

    async function handleClockToggle() {
        if (clockedIn) {
            await clockOut();
        } else {
            await clockIn();
        }
        await loadData();
    }

    async function handleStatusChange() {
        const idx = DRIVER_STATUSES.indexOf(driverStatus);
        const next = DRIVER_STATUSES[(idx + 1) % DRIVER_STATUSES.length];
        setDriverStatus(next);
        await setSetting('driverStatus', next);
    }

    // Calculate weekly hours per day
    function getWeeklyHours() {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const nowDate = new Date();
        const dayOfWeek = nowDate.getDay();
        const monday = new Date(nowDate);
        monday.setDate(nowDate.getDate() - ((dayOfWeek + 6) % 7));

        let totalWeekMs = 0;
        const dailyData = days.map((label, i) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            const dateStr = day.toISOString().split('T')[0];
            const dayEntries = weekEntries.filter(e => e.date === dateStr);
            const ms = calculateDailyHours(dayEntries);
            totalWeekMs += ms;
            return { label, hours: Math.round(ms / 3600000 * 10) / 10, isToday: dateStr === getTodayStr() };
        });

        return { dailyData, totalWeekHours: Math.round(totalWeekMs / 3600000 * 10) / 10 };
    }

    const { dailyData, totalWeekHours } = getWeeklyHours();
    const hoursRemaining = Math.max(0, WEEKLY_HOUR_LIMIT - totalWeekHours);

    // Expiring credentials
    const expiringCreds = credentials
        .map(c => ({ ...c, daysLeft: daysUntil(c.expirationDate) }))
        .filter(c => c.daysLeft <= 90)
        .sort((a, b) => a.daysLeft - b.daysLeft);

    const statusColors = {
        'Off Duty': 'bg-text-secondary',
        'On Duty': 'bg-accent-green',
        'On Load': 'bg-accent-blue',
    };

    return (
        <div className="screen-scroll px-4 pt-4 pb-safe">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <p className="text-3xl-touch font-bold">{formatTime(now)}</p>
                    <p className="text-text-secondary text-touch">{formatDate(now)}</p>
                    {settings.driverName && (
                        <p className="text-text-secondary text-sm mt-1">{settings.driverName}</p>
                    )}
                    {settings.truckNumber && (
                        <p className="text-text-muted text-xs">Truck #{settings.truckNumber}</p>
                    )}
                </div>
                <button
                    onClick={handleStatusChange}
                    className={`${statusColors[driverStatus]} px-4 py-2 rounded-full text-sm font-semibold min-h-touch transition-smooth active:scale-95`}
                >
                    {driverStatus}
                </button>
            </div>

            {/* Clock In/Out Card */}
            <div className="bg-surface-card rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">Time Clock</h2>
                    {clockedIn && lastClockInTime && (
                        <span className="text-text-secondary text-sm">
                            In since {formatTime(lastClockInTime)}
                        </span>
                    )}
                </div>

                <button
                    onClick={handleClockToggle}
                    className={`w-full py-4 rounded-xl text-lg font-bold min-h-touch-lg transition-smooth active:scale-[0.98] ${clockedIn
                            ? 'bg-accent-red hover:bg-red-600'
                            : 'bg-accent-green hover:bg-green-600'
                        }`}
                >
                    {clockedIn ? '🔴 CLOCK OUT' : '🟢 CLOCK IN'}
                </button>

                {clockedIn && (
                    <div className="mt-3 text-center">
                        <p className="text-2xl-touch font-bold text-accent-green">
                            {formatDuration(todayHoursMs)}
                        </p>
                        <p className="text-text-muted text-sm">worked today</p>
                    </div>
                )}

                {/* Weekly Hours */}
                <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-text-secondary text-sm">This Week</span>
                        <span className="text-sm">
                            <span className="font-bold">{totalWeekHours}h</span>
                            <span className="text-text-muted"> / {WEEKLY_HOUR_LIMIT}h</span>
                        </span>
                    </div>
                    <div className="flex gap-1 mb-2">
                        {dailyData.map((d) => (
                            <div key={d.label} className="flex-1 text-center">
                                <div
                                    className="h-8 rounded-sm mx-auto flex items-end justify-center"
                                    style={{ width: '100%' }}
                                >
                                    <div
                                        className={`w-full rounded-sm ${d.isToday ? 'bg-accent-green' : 'bg-accent-blue'}`}
                                        style={{ height: `${Math.min(100, (d.hours / 14) * 100)}%`, minHeight: d.hours > 0 ? '4px' : '0px' }}
                                    />
                                </div>
                                <span className={`text-[10px] ${d.isToday ? 'text-accent-green font-bold' : 'text-text-muted'}`}>
                                    {d.label}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="text-text-secondary text-xs text-center">
                        {hoursRemaining}h remaining before {WEEKLY_HOUR_LIMIT}h limit
                    </p>
                </div>
            </div>

            {/* Today's Loads Card */}
            <div className="bg-surface-card rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">Today's Loads</h2>
                    <span className="text-text-muted text-sm">{todayLoads.length} loads</span>
                </div>

                {todayLoads.length === 0 ? (
                    <p className="text-text-muted text-sm py-3 text-center">No loads assigned today</p>
                ) : (
                    <div className="space-y-2">
                        {todayLoads.map((load) => (
                            <button
                                key={load.id}
                                onClick={() => navigate(`/loads/${load.id}`)}
                                className="w-full bg-surface-elevated rounded-xl p-3 text-left transition-smooth active:scale-[0.98]"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-touch">{load.containerNumber || 'No Container #'}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium status-${load.status === 'In Progress' ? 'in-progress' : load.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {load.status}
                                    </span>
                                </div>
                                <p className="text-text-secondary text-sm truncate">
                                    {load.pickupTerminal || 'Pickup'} → {load.deliveryAddress || 'Delivery'}
                                </p>
                                {load.pickupAppointment && (
                                    <p className="text-text-muted text-xs mt-1">
                                        Appt: {formatTime(load.pickupAppointment)}
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Alerts Card */}
            {(expiringCreds.length > 0 || !hasPreTrip || detention) && (
                <div className="bg-surface-card rounded-2xl p-4 mb-4">
                    <h2 className="text-lg font-semibold mb-3">⚠️ Alerts</h2>
                    <div className="space-y-2">
                        {!hasPreTrip && (
                            <div className="bg-accent-yellow-dim rounded-xl p-3 flex items-center gap-3">
                                <span className="text-xl">📝</span>
                                <div>
                                    <p className="text-accent-yellow font-semibold text-sm">Pre-Trip Not Done</p>
                                    <p className="text-text-secondary text-xs">Complete your inspection before driving</p>
                                </div>
                            </div>
                        )}
                        {detention && (
                            <div className="bg-accent-red-dim rounded-xl p-3 flex items-center gap-3">
                                <span className="text-xl">⏱️</span>
                                <div>
                                    <p className="text-accent-red font-semibold text-sm">Detention Running</p>
                                    <p className="text-text-secondary text-xs">{getElapsedTime(detention.startTime)}</p>
                                </div>
                            </div>
                        )}
                        {expiringCreds.map((c) => {
                            const color = expirationColor(c.daysLeft);
                            return (
                                <div key={c.id} className={`bg-accent-${color}-dim rounded-xl p-3 flex items-center gap-3`}>
                                    <span className="text-xl">🪪</span>
                                    <div>
                                        <p className={`text-accent-${color} font-semibold text-sm`}>{c.name || c.type}</p>
                                        <p className="text-text-secondary text-xs">
                                            {c.daysLeft <= 0 ? 'EXPIRED' : `${c.daysLeft} days remaining`}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                <button
                    onClick={() => navigate('/capture?mode=photo')}
                    className="bg-surface-card rounded-2xl p-3 flex flex-col items-center gap-2 min-h-touch-lg transition-smooth active:scale-95"
                >
                    <span className="text-2xl">📸</span>
                    <span className="text-xs text-text-secondary">Photo</span>
                </button>
                <button
                    onClick={() => navigate('/capture?mode=receipt')}
                    className="bg-surface-card rounded-2xl p-3 flex flex-col items-center gap-2 min-h-touch-lg transition-smooth active:scale-95"
                >
                    <span className="text-2xl">🧾</span>
                    <span className="text-xs text-text-secondary">Receipt</span>
                </button>
                <button
                    onClick={() => navigate('/loads?detention=start')}
                    className="bg-surface-card rounded-2xl p-3 flex flex-col items-center gap-2 min-h-touch-lg transition-smooth active:scale-95"
                >
                    <span className="text-2xl">⏱️</span>
                    <span className="text-xs text-text-secondary">Detention</span>
                </button>
                <button
                    onClick={() => navigate('/inspect/tractor')}
                    className="bg-surface-card rounded-2xl p-3 flex flex-col items-center gap-2 min-h-touch-lg transition-smooth active:scale-95"
                >
                    <span className="text-2xl">📝</span>
                    <span className="text-xs text-text-secondary">Inspect</span>
                </button>
            </div>
        </div>
    );
}
