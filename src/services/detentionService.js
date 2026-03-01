import db from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { captureGPS } from '../utils/gps';

export async function startDetention(loadId, location) {
    const gps = await captureGPS();
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
        ...gps,
    };
    await db.detentionLogs.add(log);
    return log;
}

export async function stopDetention(id) {
    const gps = await captureGPS();
    const now = new Date().toISOString();
    await db.detentionLogs.update(id, {
        status: 'stopped',
        endTime: now,
        updatedAt: now,
        endGpsLat: gps.gpsLat,
        endGpsLng: gps.gpsLng,
    });
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
        const photos = [...(log.photos || []), photoData];
        await db.detentionLogs.update(id, { photos, updatedAt: new Date().toISOString() });
    }
}
