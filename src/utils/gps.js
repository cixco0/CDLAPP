export function captureGPS() {
    return new Promise((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            resolve({ gpsLat: null, gpsLng: null });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    gpsLat: pos.coords.latitude,
                    gpsLng: pos.coords.longitude,
                });
            },
            () => {
                // GPS unavailable or denied — don't block
                resolve({ gpsLat: null, gpsLng: null });
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
        );
    });
}

/**
 * Capture GPS in the background and apply it via the supplied update callback.
 *
 * Previously every create/save awaited captureGPS() first, so a weak signal
 * (up to a 5s timeout) blocked the UI before the record was even written. This
 * lets callers persist the record immediately with null coordinates and then
 * patch in the location once the fix arrives. Fire-and-forget: any failure
 * (denied permission, no fix, write error) is swallowed so it never blocks or
 * surfaces to the user.
 *
 * @param {(coords: { gpsLat: number|null, gpsLng: number|null }) => any} applyCoords
 */
export function attachGPS(applyCoords) {
    captureGPS()
        .then((coords) => {
            if (coords.gpsLat == null && coords.gpsLng == null) return undefined;
            return applyCoords(coords);
        })
        .catch(() => {
            /* location is best-effort — never block or throw */
        });
}
