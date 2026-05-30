/**
 * Compress a base64/data-URL image by downscaling and re-encoding as JPEG.
 *
 * Photos captured on a phone can be several MB each as base64. IndexedDB has a
 * finite quota (and base64 is ~33% larger than the raw bytes), so storing raw
 * captures fills storage fast and eventually throws QuotaExceededError on write.
 * Downscaling to a sane max dimension + JPEG quality typically shrinks a capture
 * 5-10x with no meaningful loss for documents/receipts.
 *
 * Returns a data URL (so every existing <img src={...}> keeps working unchanged).
 * Falls back to the original input if compression isn't possible (e.g. SSR/tests
 * with no canvas, or an unreadable image).
 *
 * @param {string} dataUrl - source image as a data URL
 * @param {{ maxDimension?: number, quality?: number }} [opts]
 * @returns {Promise<string>} compressed data URL (or original on failure)
 */
export async function compressImage(dataUrl, opts = {}) {
    const { maxDimension = 1600, quality = 0.7 } = opts;

    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
        return dataUrl;
    }
    // No DOM / canvas (tests, non-browser) — return as-is.
    if (typeof document === 'undefined' || typeof Image === 'undefined') {
        return dataUrl;
    }

    // Probe canvas 2D support up front. In environments without a real canvas
    // (e.g. jsdom) getContext returns null — bail before awaiting an image load
    // that would otherwise never fire onload and hang.
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    try {
        const img = await loadImage(dataUrl);
        const { width, height } = img;
        if (!width || !height) return dataUrl;

        const scale = Math.min(1, maxDimension / Math.max(width, height));
        const targetW = Math.round(width * scale);
        const targetH = Math.round(height * scale);

        canvas.width = targetW;
        canvas.height = targetH;
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        // Only keep the compressed version if it actually came out smaller.
        return compressed && compressed.length < dataUrl.length ? compressed : dataUrl;
    } catch {
        return dataUrl;
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
