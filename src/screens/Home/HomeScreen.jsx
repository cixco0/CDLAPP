import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSettings, getSetting, setSetting } from '../../services/settingsService';
import { getTodayEntries, isClockedIn, getLastClockIn, calculateDailyHours, getWeekEntries, getEntriesByDate, clockIn, clockOut } from '../../services/timeService';
import { getLoadsByDate } from '../../services/loadService';
import { getAllCredentials } from '../../services/credentialService';
import { hasTodayPreTrip, getAllInspections } from '../../services/inspectionService';
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
    const [recentInspections, setRecentInspections] = useState([]);
    const [recentShifts, setRecentShifts] = useState([]);

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
        const allInsp = await getAllInspections();
        const sorted = allInsp.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
        setRecentInspections(sorted);

        // Build recent shifts from all time entries
        const allEntries = await import('../../db/db').then(m => m.default.timeEntries.toArray());
        const byDate = {};
        allEntries.forEach(e => {
            if (!byDate[e.date]) byDate[e.date] = [];
            byDate[e.date].push(e);
        });
        const shiftDays = Object.keys(byDate).sort().reverse().slice(0, 7).map(date => {
            const entries = byDate[date].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
            const firstIn = entries.find(e => e.type === 'clock-in');
            const lastOut = [...entries].reverse().find(e => e.type === 'clock-out');
            const hours = calculateDailyHours(entries);
            return { date, entries, firstIn, lastOut, hours };
        });
        setRecentShifts(shiftDays);
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
        <div className="screen-scroll px-4 pt-6 pb-safe">
            {/* iOS Large Title Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <p className="text-ios-large-title font-bold tracking-tight">{formatTime(now)}</p>
                    <p className="text-text-secondary text-ios-subhead">{formatDate(now)}</p>
                    {settings.driverName && (
                        <p className="text-text-secondary text-ios-footnote mt-1">{settings.driverName}</p>
                    )}
                    {settings.truckNumber && (
                        <p className="text-text-tertiary text-ios-caption1">Truck #{settings.truckNumber}</p>
                    )}
                </div>
                <button
                    onClick={handleStatusChange}
                    className={`${statusColors[driverStatus]} px-4 py-2 rounded-full text-ios-footnote font-semibold min-h-touch press-effect`}
                >
                    {driverStatus}
                </button>
            </div>

            {/* Time Clock Card */}
            <div className="ios-card p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-ios-headline">Time Clock</h2>
                    {clockedIn && lastClockInTime && (
                        <span className="text-text-secondary text-ios-caption1">
                            In since {formatTime(lastClockInTime)}
                        </span>
                    )}
                </div>

                <button
                    onClick={handleClockToggle}
                    className={`w-full py-4 rounded-ios-lg text-ios-body font-bold min-h-touch-lg press-effect ${clockedIn
                        ? 'bg-accent-red'
                        : 'bg-accent-green'
                        }`}
                >
                    {clockedIn ? '⏹ CLOCK OUT' : '▶ CLOCK IN'}
                </button>

                {clockedIn && (
                    <div className="mt-3 text-center">
                        <p className="text-ios-title2 font-bold text-accent-green">
                            {formatDuration(todayHoursMs)}
                        </p>
                        <p className="text-text-tertiary text-ios-caption1">worked today</p>
                    </div>
                )}

                {/* Weekly Hours */}
                <div className="mt-4 pt-3 border-t border-ios-separator">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-text-secondary text-ios-footnote">This Week</span>
                        <span className="text-ios-footnote">
                            <span className="font-bold">{totalWeekHours}h</span>
                            <span className="text-text-tertiary"> / {WEEKLY_HOUR_LIMIT}h</span>
                        </span>
                    </div>
                    <div className="flex gap-1 mb-2">
                        {dailyData.map((d) => (
                            <div key={d.label} className="flex-1 text-center">
                                <div className="h-8 rounded-sm mx-auto flex items-end justify-center">
                                    <div
                                        className={`w-full rounded-sm ${d.isToday ? 'bg-accent-blue' : 'bg-accent-blue/40'}`}
                                        style={{ height: `${Math.min(100, (d.hours / 14) * 100)}%`, minHeight: d.hours > 0 ? '4px' : '0px' }}
                                    />
                                </div>
                                <span className={`text-[10px] ${d.isToday ? 'text-accent-blue font-bold' : 'text-text-tertiary'}`}>
                                    {d.label}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="text-text-tertiary text-ios-caption2 text-center">
                        {hoursRemaining}h remaining before {WEEKLY_HOUR_LIMIT}h limit
                    </p>
                </div>
            </div>

            {/* Today's Loads Card */}
            <div className="ios-card mb-4">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <h2 className="text-ios-headline">Today's Loads</h2>
                    <span className="text-text-tertiary text-ios-caption1">{todayLoads.length} loads</span>
                </div>

                {todayLoads.length === 0 ? (
                    <p className="text-text-tertiary text-ios-footnote py-4 text-center">No loads assigned today</p>
                ) : (
                    <div>
                        {todayLoads.map((load, idx) => (
                            <div key={load.id}>
                                {idx > 0 && <div className="ios-separator" />}
                                <button
                                    onClick={() => navigate(`/loads/${load.id}`)}
                                    className="w-full px-4 py-3 text-left press-effect flex items-center justify-between"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <span className="font-semibold text-ios-body">{load.containerNumber || 'No Container #'}</span>
                                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium status-${load.status === 'In Progress' ? 'in-progress' : load.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                                {load.status}
                                            </span>
                                            {load.moveType?.includes('Prepull') && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold move-prepull">
                                                    PREPULL
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-text-secondary text-ios-footnote truncate">
                                            {load.pickupTerminal || 'Pickup'} → {load.deliveryAddress || 'Delivery'}
                                        </p>
                                        {load.pickupAppointment && (
                                            <p className="text-text-tertiary text-ios-caption1 mt-0.5">
                                                Appt: {formatTime(load.pickupAppointment)}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-text-tertiary text-ios-body ml-2">›</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Alerts Card */}
            {(expiringCreds.length > 0 || !hasPreTrip || detention) && (
                <div className="ios-card p-4 mb-4">
                    <h2 className="text-ios-headline mb-3">Alerts</h2>
                    <div className="space-y-2">
                        {!hasPreTrip && (
                            <div className="bg-accent-orange-dim rounded-ios p-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-ios-sm bg-accent-orange/20 flex items-center justify-center text-sm">📝</div>
                                <div>
                                    <p className="text-accent-orange font-semibold text-ios-footnote">Pre-Trip Not Done</p>
                                    <p className="text-text-secondary text-ios-caption1">Complete your inspection before driving</p>
                                </div>
                            </div>
                        )}
                        {detention && (
                            <div className="bg-accent-red-dim rounded-ios p-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-ios-sm bg-accent-red/20 flex items-center justify-center text-sm">⏱️</div>
                                <div>
                                    <p className="text-accent-red font-semibold text-ios-footnote">Detention Running</p>
                                    <p className="text-text-secondary text-ios-caption1">{getElapsedTime(detention.startTime)}</p>
                                </div>
                            </div>
                        )}
                        {expiringCreds.map((c) => {
                            const color = expirationColor(c.daysLeft);
                            const colorMap = { green: 'accent-green', yellow: 'accent-yellow', red: 'accent-red' };
                            const colorClass = colorMap[color] || 'accent-yellow';
                            return (
                                <div key={c.id} className={`bg-${colorClass}-dim rounded-ios p-3 flex items-center gap-3`}>
                                    <div className={`w-8 h-8 rounded-ios-sm bg-${colorClass}/20 flex items-center justify-center text-sm`}>🪪</div>
                                    <div>
                                        <p className={`text-${colorClass} font-semibold text-ios-footnote`}>{c.name || c.type}</p>
                                        <p className="text-text-secondary text-ios-caption1">
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
            <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                    { icon: '📸', label: 'Photo', action: () => navigate('/capture?mode=photo') },
                    { icon: '🧾', label: 'Receipt', action: () => navigate('/capture?mode=receipt') },
                    { icon: '⏱️', label: 'Detention', action: () => navigate('/loads?detention=start') },
                    { icon: '📝', label: 'Inspect', action: () => navigate('/inspect/tractor') },
                ].map((item) => (
                    <button
                        key={item.label}
                        onClick={item.action}
                        className="ios-card p-3 flex flex-col items-center gap-2 min-h-touch-lg press-effect"
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-ios-caption1 text-text-secondary">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Recent Inspections */}
            {recentInspections.length > 0 && (
                <div className="ios-card mb-6">
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <h2 className="text-ios-headline">Recent Inspections</h2>
                        <button onClick={() => navigate('/more/documents')} className="text-accent-blue text-ios-footnote font-medium press-effect">See All</button>
                    </div>
                    {recentInspections.map((insp, idx) => {
                        const defects = (insp.items || []).filter(i => i.status === 'defect').length;
                        const typeLabel = insp.type === 'tractor' ? `Tractor ${insp.subType === 'post-trip' ? 'Post-Trip' : 'Pre-Trip'}` :
                            insp.type === 'chassis' ? 'Chassis' : 'Container';
                        const typeIcon = insp.type === 'tractor' ? '🚛' : insp.type === 'chassis' ? '🔗' : '📦';
                        const inspDate = new Date(insp.createdAt);
                        return (
                            <div key={insp.id}>
                                {idx > 0 && <div className="ios-separator" />}
                                <div className="ios-row press-effect cursor-pointer" onClick={() => navigate(`/inspect/detail/${insp.id}`)}>
                                    <div className={`ios-row-icon ${insp.rejected ? 'bg-accent-red' : defects > 0 ? 'bg-accent-yellow' : 'bg-accent-green'} text-white`}>
                                        {typeIcon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-ios-body">{typeLabel}</p>
                                        <p className="text-text-tertiary text-ios-caption1">
                                            {inspDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {inspDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {insp.rejected ? (
                                            <span className="text-accent-red text-ios-caption1 font-bold">Rejected</span>
                                        ) : defects > 0 ? (
                                            <span className="text-accent-yellow text-ios-caption1 font-bold">{defects} defect{defects > 1 ? 's' : ''}</span>
                                        ) : (
                                            <span className="text-accent-green text-ios-caption1 font-bold">Pass</span>
                                        )}
                                        <span className="text-text-tertiary text-lg">›</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Recent Shifts */}
            {recentShifts.length > 0 && (
                <div className="ios-card mb-6">
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <h2 className="text-ios-headline">Recent Shifts</h2>
                    </div>
                    {recentShifts.map((shift, idx) => {
                        const d = new Date(shift.date + 'T12:00:00');
                        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        const hrs = Math.floor(shift.hours / (1000 * 60 * 60));
                        const mins = Math.floor((shift.hours % (1000 * 60 * 60)) / (1000 * 60));
                        const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                        const firstInTime = shift.firstIn ? new Date(shift.firstIn.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—';
                        const lastOutTime = shift.lastOut ? new Date(shift.lastOut.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Active';
                        return (
                            <div key={shift.date}>
                                {idx > 0 && <div className="ios-separator" />}
                                <div className="ios-row press-effect cursor-pointer" onClick={() => navigate(`/shift/${shift.date}`)}>
                                    <div className="ios-row-icon bg-accent-blue text-white">⏱️</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-ios-body">{dayLabel}</p>
                                        <p className="text-text-tertiary text-ios-caption1">{firstInTime} → {lastOutTime}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold text-ios-footnote ${hrs >= 8 ? 'text-accent-green' : 'text-text-secondary'}`}>{timeStr}</span>
                                        <span className="text-text-tertiary text-lg">›</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
