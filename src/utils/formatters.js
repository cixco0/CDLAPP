/**
 * Format container number: 4 uppercase letters + space + 7 digits
 * e.g., "mscu1234567" → "MSCU 1234567"
 */
export function formatContainerNumber(raw) {
    if (!raw) return '';
    const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const letters = cleaned.slice(0, 4).replace(/[^A-Z]/g, '');
    const digits = cleaned.slice(4, 11).replace(/[^0-9]/g, '');
    if (digits.length > 0) {
        return `${letters} ${digits}`;
    }
    return letters;
}

/**
 * Format time in 12-hour with AM/PM
 */
export function formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format date as: Mon, Feb 19
 */
export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format date + time: Mon, Feb 19 at 3:45 PM
 */
export function formatDateTime(date) {
    if (!date) return '';
    return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return '$0.00';
    return `$${Number(amount).toFixed(2)}`;
}

/**
 * Format duration from ms to "Xh Ym"
 */
export function formatDuration(ms) {
    if (!ms || ms < 0) return '0h 0m';
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
}

/**
 * Get elapsed time string since a given timestamp
 */
export function getElapsedTime(startTime) {
    if (!startTime) return '0h 0m';
    const elapsed = Date.now() - new Date(startTime).getTime();
    return formatDuration(elapsed);
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Check if a date string is today
 */
export function isToday(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr).toDateString() === new Date().toDateString();
}

/**
 * Get days until a date. Negative = past due
 */
export function daysUntil(dateStr) {
    if (!dateStr) return Infinity;
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

/**
 * Get color for days remaining (credential expiration)
 */
export function expirationColor(daysRemaining) {
    if (daysRemaining <= 30) return 'red';
    if (daysRemaining <= 90) return 'yellow';
    return 'green';
}
