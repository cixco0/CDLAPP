import db from '../db/db';
import { v4 as uuidv4 } from 'uuid';
import { captureGPS } from '../utils/gps';

export async function createInspection(inspectionData) {
    const gps = await captureGPS();
    const now = new Date().toISOString();
    const inspection = {
        id: uuidv4(),
        type: inspectionData.type, // 'tractor' | 'chassis' | 'container'
        subType: inspectionData.subType || 'pre-trip', // 'pre-trip' | 'post-trip'
        date: inspectionData.date || now.split('T')[0],
        truckNumber: inspectionData.truckNumber || '',
        chassisNumber: inspectionData.chassisNumber || '',
        containerNumber: inspectionData.containerNumber || '',
        odometer: inspectionData.odometer || '',
        chassisProvider: inspectionData.chassisProvider || '',
        iepDot: inspectionData.iepDot || '',
        items: inspectionData.items || [],
        overallCondition: inspectionData.overallCondition || '',
        signature: inspectionData.signature || '',
        driverName: inspectionData.driverName || '',
        motorCarrierDot: inspectionData.motorCarrierDot || '',
        photos: inspectionData.photos || [],
        confirmed: inspectionData.confirmed || false,
        rejected: inspectionData.rejected || false,
        rejectionReason: inspectionData.rejectionReason || '',
        createdAt: now,
        updatedAt: now,
        synced: false,
        ...gps,
    };
    await db.inspections.add(inspection);
    return inspection;
}

export async function getInspection(id) {
    return db.inspections.get(id);
}

export async function getAllInspections() {
    return db.inspections.toArray();
}

export async function getInspectionsByDate(date) {
    return db.inspections.where('date').equals(date).toArray();
}

export async function hasTodayPreTrip(date) {
    const inspections = await db.inspections
        .where('date')
        .equals(date)
        .toArray();
    return inspections.some(
        (i) => i.type === 'tractor' && i.subType === 'pre-trip'
    );
}
