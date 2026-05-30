import { describe, it, expect } from 'vitest';
import {
    formatContainerNumber,
    formatCurrency,
    formatDuration,
    daysUntil,
    expirationColor,
    isToday,
    getTodayStr,
} from './formatters';

describe('formatContainerNumber', () => {
    it('formats 4 letters + 7 digits with a space', () => {
        expect(formatContainerNumber('mscu1234567')).toBe('MSCU 1234567');
    });
    it('strips punctuation and uppercases', () => {
        expect(formatContainerNumber('ms-cu 123.4567')).toBe('MSCU 1234567');
    });
    it('returns just letters when no digits yet', () => {
        expect(formatContainerNumber('msc')).toBe('MSC');
    });
    it('handles empty input', () => {
        expect(formatContainerNumber('')).toBe('');
    });
});

describe('formatCurrency', () => {
    it('formats numbers to 2 decimals with $', () => {
        expect(formatCurrency(12.5)).toBe('$12.50');
    });
    it('handles null/NaN safely', () => {
        expect(formatCurrency(null)).toBe('$0.00');
        expect(formatCurrency(undefined)).toBe('$0.00');
        expect(formatCurrency('abc')).toBe('$0.00');
    });
});

describe('formatDuration', () => {
    it('converts ms to "Xh Ym"', () => {
        expect(formatDuration(90 * 60 * 1000)).toBe('1h 30m');
    });
    it('clamps negative/zero to 0h 0m', () => {
        expect(formatDuration(-5)).toBe('0h 0m');
        expect(formatDuration(0)).toBe('0h 0m');
    });
});

describe('daysUntil', () => {
    it('returns 0 for today', () => {
        expect(daysUntil(new Date().toISOString())).toBe(0);
    });
    it('returns negative for past dates', () => {
        const yesterday = new Date(Date.now() - 86400000).toISOString();
        expect(daysUntil(yesterday)).toBeLessThan(0);
    });
    it('returns Infinity for empty input', () => {
        expect(daysUntil('')).toBe(Infinity);
    });
});

describe('expirationColor', () => {
    it('is red within 30 days', () => {
        expect(expirationColor(10)).toBe('red');
        expect(expirationColor(30)).toBe('red');
    });
    it('is yellow within 90 days', () => {
        expect(expirationColor(60)).toBe('yellow');
        expect(expirationColor(90)).toBe('yellow');
    });
    it('is green beyond 90 days', () => {
        expect(expirationColor(120)).toBe('green');
    });
});

describe('isToday / getTodayStr', () => {
    it('recognizes today', () => {
        expect(isToday(new Date().toISOString())).toBe(true);
    });
    it('getTodayStr returns YYYY-MM-DD', () => {
        expect(getTodayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
