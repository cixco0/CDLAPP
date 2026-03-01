import db from '../db/db';
import { v4 as uuidv4 } from 'uuid';

export async function clockIn() {
    const now = new Date().toISOString();
    const entry = {
        id: uuidv4(),
        type: 'clock-in',
        timestamp: now,
        date: now.split('T')[0],
        createdAt: now,
        updatedAt: now,
        synced: false,
        gpsLat: null,
        gpsLng: null,
    };
    await db.timeEntries.add(entry);
    return entry;
}

export async function clockOut() {
    const now = new Date().toISOString();
    const entry = {
        id: uuidv4(),
        type: 'clock-out',
        timestamp: now,
        date: now.split('T')[0],
        createdAt: now,
        updatedAt: now,
        synced: false,
        gpsLat: null,
        gpsLng: null,
    };
    await db.timeEntries.add(entry);
    return entry;
}

export async function getTodayEntries() {
    const today = new Date().toISOString().split('T')[0];
    return db.timeEntries.where('date').equals(today).sortBy('timestamp');
}

export async function getEntriesByDate(date) {
    return db.timeEntries.where('date').equals(date).sortBy('timestamp');
}

export async function getWeekEntries() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const all = await db.timeEntries.toArray();
    return all
        .filter((e) => new Date(e.timestamp) >= monday)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * Calculate hours worked for a given day from time entries
 */
export function calculateDailyHours(entries) {
    let totalMs = 0;
    let clockInTime = null;

    for (const entry of entries) {
        if (entry.type === 'clock-in') {
            clockInTime = new Date(entry.timestamp).getTime();
        } else if (entry.type === 'clock-out' && clockInTime) {
            totalMs += new Date(entry.timestamp).getTime() - clockInTime;
            clockInTime = null;
        }
    }

    // If still clocked in, count time until now
    if (clockInTime) {
        totalMs += Date.now() - clockInTime;
    }

    return totalMs;
}

/**
 * Check if driver is currently clocked in
 */
export function isClockedIn(entries) {
    if (!entries || entries.length === 0) return false;
    const last = entries[entries.length - 1];
    return last.type === 'clock-in';
}

/**
 * Get last clock-in time
 */
export function getLastClockIn(entries) {
    if (!entries) return null;
    const clockIns = entries.filter((e) => e.type === 'clock-in');
    return clockIns.length > 0 ? clockIns[clockIns.length - 1].timestamp : null;
}
