import db from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { attachGPS } from '../utils/gps';
import { guardedWrite } from '../db/writeGuard';
import { compressImage } from '../utils/image';

export async function savePhoto(photoData) {
    const now = new Date().toISOString();
    const photo = {
        id: uuidv4(),
        data: await compressImage(photoData.data), // compressed base64 data URL
        type: photoData.type || 'General',
        loadId: photoData.loadId || null,
        notes: photoData.notes || '',
        createdAt: now,
        updatedAt: now,
        synced: false,
        gpsLat: null,
        gpsLng: null,
    };
    await guardedWrite(() => db.photos.add(photo));
    attachGPS((g) => db.photos.update(photo.id, { gpsLat: g.gpsLat, gpsLng: g.gpsLng }));
    return photo;
}

export async function getPhoto(id) {
    return db.photos.get(id);
}

export async function getPhotosByLoad(loadId) {
    return db.photos.where('loadId').equals(loadId).toArray();
}

export async function getAllPhotos() {
    return db.photos.toArray();
}

export async function getTodayPhotos() {
    const today = new Date().toISOString().split('T')[0];
    // createdAt is indexed and ISO-8601 sorts lexicographically, so a range
    // query lets IndexedDB do the filtering instead of loading every photo.
    return db.photos
        .where('createdAt')
        .between(`${today}T00:00:00.000Z`, `${today}T23:59:59.999Z`, true, true)
        .toArray();
}

export async function deletePhoto(id) {
    await db.photos.delete(id);
}

export async function updatePhoto(id, changes) {
    await db.photos.update(id, { ...changes, updatedAt: new Date().toISOString() });
}
