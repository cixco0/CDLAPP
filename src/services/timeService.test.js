import { describe, it, expect } from 'vitest';
import { calculateDailyHours, isClockedIn, getLastClockIn } from './timeService';

const t = (iso) => ({ timestamp: iso });

describe('calculateDailyHours', () => {
    it('sums completed clock-in/out pairs', () => {
        const entries = [
            { type: 'clock-in', timestamp: '2024-01-01T08:00:00.000Z' },
            { type: 'clock-out', timestamp: '2024-01-01T12:00:00.000Z' },
            { type: 'clock-in', timestamp: '2024-01-01T13:00:00.000Z' },
            { type: 'clock-out', timestamp: '2024-01-01T15:00:00.000Z' },
        ];
        // 4h + 2h = 6h
        expect(calculateDailyHours(entries)).toBe(6 * 60 * 60 * 1000);
    });

    it('counts an open clock-in up to now', () => {
        const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const ms = calculateDailyHours([{ type: 'clock-in', timestamp: tenMinAgo }]);
        // ~10 minutes, allow a little slack for execution time
        expect(ms).toBeGreaterThanOrEqual(9 * 60 * 1000);
        expect(ms).toBeLessThan(11 * 60 * 1000);
    });

    it('returns 0 for no entries', () => {
        expect(calculateDailyHours([])).toBe(0);
    });
});

describe('isClockedIn', () => {
    it('is true when the last entry is a clock-in', () => {
        expect(isClockedIn([{ type: 'clock-in', timestamp: 'x' }])).toBe(true);
    });
    it('is false when the last entry is a clock-out', () => {
        expect(isClockedIn([
            { type: 'clock-in', timestamp: 'a' },
            { type: 'clock-out', timestamp: 'b' },
        ])).toBe(false);
    });
    it('is false for empty/undefined', () => {
        expect(isClockedIn([])).toBe(false);
        expect(isClockedIn(undefined)).toBe(false);
    });
});

describe('getLastClockIn', () => {
    it('returns the most recent clock-in timestamp', () => {
        const entries = [
            t('a'),
            { type: 'clock-in', timestamp: 'first' },
            { type: 'clock-out', timestamp: 'mid' },
            { type: 'clock-in', timestamp: 'second' },
        ];
        // only clock-in entries are considered
        expect(getLastClockIn(entries.filter((e) => e.type))).toBe('second');
    });
    it('returns null when never clocked in', () => {
        expect(getLastClockIn([{ type: 'clock-out', timestamp: 'x' }])).toBe(null);
    });
});
