/**
 * Thin wrapper around navigator.vibrate for tactile confirmation.
 *
 * Vibration gives a driver wearing gloves unambiguous confirmation that
 * a tap registered — especially important for Clock In/Out and status
 * changes where a missed tap has real consequences.
 *
 * Silently no-ops on browsers that don't support the Vibration API (iOS Safari
 * does not; Android Chrome does). This is purely additive and never blocks UI.
 */
const PATTERNS = {
    light:   [8],
    medium:  [18],
    success: [10, 40, 10],
    error:   [40, 30, 40, 30, 40],
    heavy:   [30],
};

/** @param {'light'|'medium'|'heavy'|'success'|'error'} [type] */
export function haptic(type = 'light') {
    try {
        navigator.vibrate?.(PATTERNS[type] ?? PATTERNS.light);
    } catch {
        // Vibrate not supported or permission denied — silently ignore
    }
}
