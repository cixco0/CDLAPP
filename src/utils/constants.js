export const CONTAINER_SIZES = ['20ft', '40ft', '40ft HC', '45ft', '53ft'];

export const MOVE_TYPES = [
    'Import',
    'Export',
    'Import Prepull',
    'Export Prepull',
    'Rail Dray',
    'Street Turn',
    'Repo',
    'Empty Return',
];

export const LOAD_STATUS_FLOWS = {
    'Import': [
        'Assigned',
        'Accepted',
        'En Route to Terminal',
        'At Terminal Gate',
        'Container Loaded',
        'In Transit',
        'At Delivery',
        'Unloading',
        'Delivered',
        'Empty Return',
        'Completed',
    ],
    'Export': [
        'Assigned',
        'Accepted',
        'En Route to Pickup',
        'At Shipper',
        'Loading',
        'Container Loaded',
        'In Transit to Terminal',
        'At Terminal Gate',
        'Container Dropped',
        'Completed',
    ],
    'Import Prepull': [
        'Assigned',
        'Accepted',
        'En Route to Terminal',
        'At Terminal Gate',
        'Container Loaded',
        'In Transit to Yard',
        'At Yard',
        'Container Dropped',
        'Completed',
    ],
    'Export Prepull': [
        'Assigned',
        'Accepted',
        'En Route to Pickup',
        'At Shipper',
        'Loading',
        'Container Loaded',
        'In Transit to Yard',
        'At Yard',
        'Container Dropped',
        'Completed',
    ],
    'Rail Dray': [
        'Assigned',
        'Accepted',
        'En Route to Ramp',
        'At Rail Ramp',
        'Container Loaded',
        'In Transit',
        'At Delivery',
        'Unloading',
        'Delivered',
        'Empty Return',
        'Completed',
    ],
    'Street Turn': [
        'Assigned',
        'Accepted',
        'En Route to Pickup',
        'At Pickup Location',
        'Container Loaded',
        'In Transit',
        'At Drop-off',
        'Container Dropped',
        'Completed',
    ],
    'Repo': [
        'Assigned',
        'Accepted',
        'En Route to Pickup',
        'Container Picked Up',
        'In Transit',
        'At Drop-off',
        'Container Dropped',
        'Completed',
    ],
    'Empty Return': [
        'Assigned',
        'Accepted',
        'En Route to Terminal',
        'At Terminal Gate',
        'Container Dropped',
        'Completed',
    ],
};

// Helper to get status flow for a given move type (falls back to Import)
export function getStatusesForMoveType(moveType) {
    return LOAD_STATUS_FLOWS[moveType] || LOAD_STATUS_FLOWS['Import'];
}

// Backwards-compatible flat list (union of all unique statuses)
export const LOAD_STATUSES = [...new Set(Object.values(LOAD_STATUS_FLOWS).flat())];

export const DRIVER_STATUSES = ['Off Duty', 'On Duty', 'On Load'];

export const PHOTO_TYPES = [
    'Container Damage',
    'Delivery Proof',
    'BOL',
    'Gate Receipt',
    'Chassis Condition',
    'Scale Ticket',
    'General',
];

export const RECEIPT_CATEGORIES = [
    'Fuel',
    'Toll',
    'Scale',
    'Lumper',
    'Repair',
    'Parking',
    'Other',
];

export const PAYMENT_METHODS = [
    'Cash',
    'Card',
    'Company Card',
    'EFS',
    'Comdata',
];

export const CHASSIS_PROVIDERS = [
    'DCLI',
    'TRAC',
    'Flexi-Van',
    'COFC Logistics',
    'Other',
];

export const DEFAULT_TERMINALS = [
    { name: 'BNSF Logistics Park', address: 'Joliet/Elwood, IL' },
    { name: 'BNSF Corwith', address: 'Chicago, IL' },
    { name: 'BNSF Cicero', address: 'Cicero, IL' },
    { name: 'NS Landers', address: 'Chicago, IL' },
    { name: 'NS 47th Street', address: 'Chicago, IL' },
    { name: 'NS Calumet', address: 'Chicago, IL' },
    { name: 'UP Global IV', address: 'Chicago, IL (Proviso area)' },
    { name: 'UP Yard Center', address: 'Chicago, IL' },
    { name: 'CSX 59th Street', address: 'Chicago, IL' },
    { name: 'CSX Bedford Park', address: 'Bedford Park, IL' },
    { name: 'CN Harvey', address: 'Harvey, IL' },
    { name: 'CN Joliet', address: 'Joliet, IL' },
    { name: 'CP Bensenville', address: 'Bensenville, IL' },
];

export const DOCUMENT_TYPES = [
    { key: 'bol', label: 'BOL', icon: '📄' },
    { key: 'gate_in', label: 'Gate Receipt (In)', icon: '📄' },
    { key: 'gate_out', label: 'Gate Receipt (Out)', icon: '📄' },
    { key: 'container_photos', label: 'Container Photos', icon: '📸' },
    { key: 'chassis_photos', label: 'Chassis Photos', icon: '📸' },
    { key: 'delivery_photos', label: 'Delivery Photos (POD)', icon: '📸' },
    { key: 'receipts', label: 'Receipts', icon: '🧾' },
    { key: 'signed_pod', label: 'Signed POD', icon: '📝' },
];

export const TRACTOR_INSPECTION_ITEMS = [
    { id: 1, label: 'Service Brakes (including trailer connections)', required: true },
    { id: 2, label: 'Parking Brake', required: true },
    { id: 3, label: 'Steering Mechanism', required: true },
    { id: 4, label: 'Lighting Devices & Reflectors', required: true },
    { id: 5, label: 'Tires (condition + pressure)', required: true },
    { id: 6, label: 'Horn', required: true },
    { id: 7, label: 'Windshield Wipers', required: true },
    { id: 8, label: 'Rear Vision Mirrors', required: true },
    { id: 9, label: 'Coupling Devices (fifth wheel, pintle, drawbar)', required: true },
    { id: 10, label: 'Wheels, Rims, & Lugs', required: true },
    { id: 11, label: 'Emergency Equipment (triangles, fire extinguisher, spare fuses)', required: true },
    { id: 12, label: 'Fluid Levels (oil, coolant, DEF, washer)', required: false },
    { id: 13, label: 'Air Lines & Hoses', required: false },
    { id: 14, label: 'Exhaust System', required: false },
    { id: 15, label: 'Frame & Body Condition', required: false },
    { id: 16, label: 'Suspension Components', required: false },
];

export const CHASSIS_INSPECTION_ITEMS = [
    { id: 1, label: 'Brake Components (visible — shoes, drums, hoses, chambers)', required: true },
    { id: 2, label: 'Lights, Markers & Conspicuity Marking (reflective tape)', required: true },
    { id: 3, label: 'Wheels, Rims, Lugs & Tires', required: true },
    { id: 4, label: 'Air Lines, Hoses & Couplers (glad hands)', required: true },
    { id: 5, label: 'King Pin & Upper Coupling Device', required: true },
    { id: 6, label: 'Rails & Support Frames', required: true },
    { id: 7, label: 'Tie-Down Bolsters (for container locking)', required: true },
    { id: 8, label: 'Locking Pins & Safety Clips', required: true },
    { id: 9, label: 'Sliders & Sliding Frame Locks', required: true },
    { id: 10, label: 'Landing Gear', required: false },
    { id: 11, label: 'Mud Flaps', required: false },
    { id: 12, label: 'License Plate & Registration', required: false },
    { id: 13, label: 'Annual Inspection Sticker (expired? date?)', required: false },
];

export const CONTAINER_INSPECTION_POSITIONS = [
    { id: 1, label: 'Front (doors closed, with seal visible)' },
    { id: 2, label: 'Right Side' },
    { id: 3, label: 'Rear (if accessible)' },
    { id: 4, label: 'Left Side' },
    { id: 5, label: 'Top (visible portion — dents, rust)' },
    { id: 6, label: 'Doors Open (interior condition)' },
    { id: 7, label: 'Seal Close-up (number legible)' },
    { id: 8, label: 'Underside/Bottom Rails (visible damage)' },
];

export const WEEKLY_HOUR_LIMIT = 70; // 70-hour/8-day rule (most common)
