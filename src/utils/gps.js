export function captureGPS() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
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
