/**
 * Wrapper for IndexedDB writes that produces a clear, user-presentable error
 * when the device runs out of storage.
 *
 * All app data lives in IndexedDB. When the quota is exceeded (common once a
 * driver accumulates photos/receipts), Dexie rejects with a low-level
 * QuotaExceededError that callers previously ignored — the write silently
 * failed and the user never knew their photo wasn't saved. Routing writes
 * through here lets the UI catch `StorageFullError` and tell the user.
 */
export class StorageFullError extends Error {
    constructor(message, cause) {
        super(message);
        this.name = 'StorageFullError';
        this.cause = cause;
    }
}

function isQuotaError(err) {
    if (!err) return false;
    const name = err.name || (err.inner && err.inner.name) || '';
    return (
        name === 'QuotaExceededError' ||
        name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        /quota/i.test(err.message || '')
    );
}

/**
 * Run a DB write, normalizing quota failures into StorageFullError.
 * @template T
 * @param {() => Promise<T>} write
 * @returns {Promise<T>}
 */
export async function guardedWrite(write) {
    try {
        return await write();
    } catch (err) {
        if (isQuotaError(err)) {
            throw new StorageFullError(
                'Device storage is full. Free up space or remove old photos and try again.',
                err
            );
        }
        throw err;
    }
}
