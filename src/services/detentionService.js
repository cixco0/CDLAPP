import db from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { attachGPS } from '../utils/gps';
import { guardedWrite } from '../db/writeGuard';
import { compressImage } from '../utils/image';

export async function startDetention(loadId, location) {
    const now = new Date().toISOString();
    const log = {
        id: uuidv4(),
        loadId,
        status: 'running',
        startTime: now,
        endTime: null,
        location: location || '',
        photos: [],
        createdAt: now,
        updatedAt: now,
        synced: false,
        gpsLat: null,
        gpsLng: null,
    };
    await guardedWrite(() => db.detentionLogs.add(log));
    attachGPS((g) => db.detentionLogs.update(log.id, { gpsLat: g.gpsLat, gpsLng: g.gpsLng }));
    return log;
}

export async function stopDetention(id) {
    const now = new Date().toISOString();
    await guardedWrite(() =>
        db.detentionLogs.update(id, { status: 'stopped', endTime: now, updatedAt: now })
    );
    attachGPS((g) =>
        db.detentionLogs.update(id, { endGpsLat: g.gpsLat, endGpsLng: g.gpsLng })
    );
}

export async function getActiveDetention() {
    const all = await db.detentionLogs.where('status').equals('running').toArray();
    return all.length > 0 ? all[0] : null;
}

export async function getDetentionByLoad(loadId) {
    return db.detentionLogs.where('loadId').equals(loadId).toArray();
}

export async function addDetentionPhoto(id, photoData) {
    const log = await db.detentionLogs.get(id);
    if (log) {
        const photos = [...(log.photos || []), await compressImage(photoData)];
        await guardedWrite(() =>
            db.detentionLogs.update(id, { photos, updatedAt: new Date().toISOString() })
        );
    }
}
