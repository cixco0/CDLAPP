import { describe, it, expect } from 'vitest';
import { compressImage } from './image';

describe('compressImage', () => {
    it('returns non-image input unchanged', async () => {
        expect(await compressImage('')).toBe('');
        expect(await compressImage('not-a-data-url')).toBe('not-a-data-url');
    });

    it('returns the original when canvas is unavailable (jsdom)', async () => {
        // jsdom has no real canvas, so compression gracefully falls back.
        const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const result = await compressImage(dataUrl);
        expect(result).toBe(dataUrl);
    });

    it('never throws on malformed data URLs', async () => {
        await expect(compressImage('data:image/png;base64,@@@')).resolves.toBeDefined();
    });
});
