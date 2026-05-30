import { describe, it, expect } from 'vitest';
import {
    isValidStatusForMoveType,
    getStatusesForMoveType,
    LOAD_STATUS_FLOWS,
} from './constants';

describe('getStatusesForMoveType', () => {
    it('returns the flow for a known move type', () => {
        expect(getStatusesForMoveType('Export')).toBe(LOAD_STATUS_FLOWS['Export']);
    });
    it('falls back to Import for unknown move types', () => {
        expect(getStatusesForMoveType('Nonsense')).toBe(LOAD_STATUS_FLOWS['Import']);
    });
});

describe('isValidStatusForMoveType', () => {
    it('accepts a status in the move type flow', () => {
        expect(isValidStatusForMoveType('Import', 'At Delivery')).toBe(true);
        expect(isValidStatusForMoveType('Export', 'At Shipper')).toBe(true);
    });
    it('rejects a status from a different flow', () => {
        // "At Shipper" only exists in export flows, not Import
        expect(isValidStatusForMoveType('Import', 'At Shipper')).toBe(false);
    });
    it('rejects an entirely made-up status', () => {
        expect(isValidStatusForMoveType('Import', 'Teleported')).toBe(false);
    });
    it('every flow begins with Assigned and ends with Completed', () => {
        for (const flow of Object.values(LOAD_STATUS_FLOWS)) {
            expect(flow[0]).toBe('Assigned');
            expect(flow[flow.length - 1]).toBe('Completed');
        }
    });
});
