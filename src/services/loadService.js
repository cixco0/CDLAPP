import db from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { attachGPS } from '../utils/gps';
import { guardedWrite } from '../db/writeGuard';
import { isValidStatusForMoveType } from '../utils/constants';

export async function createLoad(loadData) {
    const now = new Date().toISOString();
    const load = {
        id: uuidv4(),
        containerNumber: loadData.containerNumber || '',
        bookingNumber: loadData.bookingNumber || '',
        sealNumber: loadData.sealNumber || '',
        containerSize: loadData.containerSize || '40ft',
        moveType: loadData.moveType || 'Import',
        chassisNumber: loadData.chassisNumber || '',
        pickupTerminal: loadData.pickupTerminal || '',
        pickupAppointment: loadData.pickupAppointment || '',
        deliveryAddress: loadData.deliveryAddress || '',
        deliveryAppointment: loadData.deliveryAppointment || '',
        customerBroker: loadData.customerBroker || '',
        rate: loadData.rate || null,
        notes: loadData.notes || '',
        status: 'Assigned',
        date: loadData.date || now.split('T')[0],
        chassisProvider: loadData.chassisProvider || '',
        chassisCondition: '',
        chassisReturnLocation: '',
        chassisReturnTime: '',
        createdAt: now,
        updatedAt: now,
        synced: false,
        gpsLat: null,
        gpsLng: null,
    };
    await guardedWrite(() => db.loads.add(load));
    // Location is best-effort — patch it in once a fix arrives, don't block.
    attachGPS((g) => db.loads.update(load.id, { gpsLat: g.gpsLat, gpsLng: g.gpsLng }));
    return load;
}

export async function updateLoad(id, changes) {
    const now = new Date().toISOString();
    await db.loads.update(id, { ...changes, updatedAt: now });
}

export async function deleteLoad(id) {
    await db.loads.delete(id);
}

export async function getLoad(id) {
    return db.loads.get(id);
}

export async function getAllLoads() {
    return db.loads.toArray();
}

export async function getLoadsByDate(date) {
    return db.loads.where('date').equals(date).toArray();
}

export async function getLoadsByStatus(status) {
    return db.loads.where('status').equals(status).toArray();
}

export async function advanceLoadStatus(id, newStatus) {
    const load = await db.loads.get(id);
    if (!load) throw new Error(`Load ${id} not found`);
    // Guard the lifecycle: only allow statuses that exist in this move type's flow.
    if (!isValidStatusForMoveType(load.moveType, newStatus)) {
        throw new Error(
            `Invalid status "${newStatus}" for move type "${load.moveType}"`
        );
    }

    const now = new Date().toISOString();
    const changeId = uuidv4();
    await guardedWrite(() => db.loads.update(id, { status: newStatus, updatedAt: now }));
    // Record status change for audit trail
    await guardedWrite(() =>
        db.statusChanges.add({
            id: changeId,
            loadId: id,
            status: newStatus,
            createdAt: now,
            updatedAt: now,
            synced: false,
            gpsLat: null,
            gpsLng: null,
        })
    );
    attachGPS((g) =>
        db.statusChanges.update(changeId, { gpsLat: g.gpsLat, gpsLng: g.gpsLng })
    );
}

export async function getStatusChanges(loadId) {
    return db.statusChanges.where('loadId').equals(loadId).sortBy('createdAt');
}
