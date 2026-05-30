import db from '../db/db';

/**
 * Offline-first sync to Supabase.
 *
 * Every record is written locally first with `synced: false`. This module
 * pushes those unsynced rows to Supabase and flips the flag once the server
 * accepts them, so a lost/wiped device can be restored from the backend —
 * previously all data lived only in the browser and could vanish permanently.
 *
 * Configuration (Vite env, e.g. in a .env file):
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJhbGci...
 *
 * If those aren't set (or @supabase/supabase-js isn't installed), every
 * function is a safe no-op so the app keeps working fully offline.
 */

// Tables that carry a `synced` flag and a string `id` primary key.
const SYNCED_TABLES = [
    'loads',
    'inspections',
    'photos',
    'receipts',
    'timeEntries',
    'detentionLogs',
    'credentials',
    'statusChanges',
];

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY;

let clientPromise = null;
let syncing = false;

export function isSyncConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Lazily create the Supabase client. Dynamic import keeps the dependency
 * optional — if it's missing or config is absent we resolve to null and
 * the caller no-ops.
 */
async function getClient() {
    if (!isSyncConfigured()) return null;
    if (!clientPromise) {
        clientPromise = import('@supabase/supabase-js')
            .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY))
            .catch((err) => {
                console.warn('Supabase client unavailable — staying offline-only:', err?.message);
                return null;
            });
    }
    return clientPromise;
}

/**
 * Push all unsynced rows across every table. Returns the number of rows synced.
 * Safe to call repeatedly; concurrent calls are coalesced.
 */
export async function syncNow() {
    if (syncing) return 0;
    const client = await getClient();
    if (!client) return 0;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 0;

    syncing = true;
    let total = 0;
    try {
        for (const table of SYNCED_TABLES) {
            // synced is a boolean — IndexedDB can't index boolean keys, so we
            // filter rather than .where('synced').equals(false) (which matches nothing).
            const rows = await db[table].filter((r) => !r.synced).toArray();
            if (rows.length === 0) continue;

            const payload = rows.map((r) => ({ ...r, synced: true }));
            const { error } = await client.from(table).upsert(payload, { onConflict: 'id' });
            if (error) {
                console.warn(`Sync failed for "${table}": ${error.message}`);
                continue; // leave these rows unsynced; retry next pass
            }

            // Mark locally synced only after the server accepted them.
            await db.transaction('rw', db[table], async () => {
                for (const r of rows) {
                    await db[table].update(r.id, { synced: true });
                }
            });
            total += rows.length;
        }
    } finally {
        syncing = false;
    }
    return total;
}

/**
 * Count of records still waiting to sync (useful for a UI indicator).
 */
export async function getPendingCount() {
    let count = 0;
    for (const table of SYNCED_TABLES) {
        count += await db[table].filter((r) => !r.synced).count();
    }
    return count;
}

/**
 * Start background sync: once now, again whenever the device comes back
 * online, and on a periodic interval. No-op when sync isn't configured.
 */
export function startAutoSync({ intervalMs = 60000 } = {}) {
    if (!isSyncConfigured()) return () => {};

    syncNow();
    const onOnline = () => syncNow();
    if (typeof window !== 'undefined') {
        window.addEventListener('online', onOnline);
    }
    const timer = setInterval(syncNow, intervalMs);

    // Teardown handle (mainly for tests / HMR).
    return () => {
        if (typeof window !== 'undefined') window.removeEventListener('online', onOnline);
        clearInterval(timer);
    };
}
