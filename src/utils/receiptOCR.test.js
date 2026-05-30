import { describe, it, expect } from 'vitest';
import {
    extractAmount,
    extractSubtotal,
    extractTax,
    extractVendor,
    guessCategory,
    extractDate,
    extractGallons,
    extractPricePerGallon,
    extractFuelGrade,
    extractCardLastFour,
    extractPhoneNumber,
    extractLineItems,
} from './receiptOCR';

describe('extractAmount', () => {
    it('prefers a line labeled total over larger non-total amounts', () => {
        const lines = ['Item A  5.00', 'Item B  9.99', 'TOTAL  14.99'];
        expect(extractAmount(lines)).toBe(14.99);
    });
    it('skips subtotal/tax lines when finding the keyword total', () => {
        const lines = ['Subtotal 10.00', 'Tax 1.00', 'Total Due 11.00'];
        expect(extractAmount(lines)).toBe(11.0);
    });
    it('falls back to the largest amount when no total keyword', () => {
        expect(extractAmount(['Coffee 3.50', 'Sandwich 8.25'])).toBe(8.25);
    });
    it('returns 0 when no money found', () => {
        expect(extractAmount(['no prices here'])).toBe(0);
    });
});

describe('extractSubtotal & extractTax', () => {
    it('pulls the subtotal value', () => {
        expect(extractSubtotal(['Subtotal: 42.00'])).toBe(42.0);
    });
    it('pulls the tax value', () => {
        expect(extractTax(['Tax 3.15'])).toBe(3.15);
    });
});

describe('guessCategory', () => {
    it('detects fuel', () => {
        expect(guessCategory('PILOT diesel 100 gallons')).toBe('Fuel');
    });
    it('detects toll', () => {
        expect(guessCategory('Illinois Tollway iPass')).toBe('Toll');
    });
    it('detects scale', () => {
        expect(guessCategory('CAT SCALE weigh ticket')).toBe('Scale');
    });
    it('defaults to Other', () => {
        expect(guessCategory('random store purchase')).toBe('Other');
    });
});

describe('extractVendor', () => {
    it('returns the first meaningful line', () => {
        expect(extractVendor(['Pilot Travel Center', '123 Main St'])).toBe('Pilot Travel Center');
    });
    it('skips pure-number/date lines', () => {
        expect(extractVendor(['01/02/2024', 'Loves Truck Stop'])).toBe('Loves Truck Stop');
    });
});

describe('fuel fields', () => {
    it('extracts gallons', () => {
        expect(extractGallons(['Gallons 120.500'])).toBe(120.5);
    });
    it('extracts price per gallon', () => {
        expect(extractPricePerGallon(['Price/Gal 3.499'])).toBe(3.499);
    });
    it('extracts fuel grade', () => {
        expect(extractFuelGrade(['Pump 4 Diesel'])).toBe('Diesel');
    });
});

describe('extractDate', () => {
    it('parses MM/DD/YYYY', () => {
        expect(extractDate('Date: 03/14/2024')).toBe('03/14/2024');
    });
    it('parses written month', () => {
        expect(extractDate('January 15, 2024')).toBe('January 15, 2024');
    });
});

describe('extractCardLastFour & extractPhoneNumber', () => {
    it('extracts masked card last four', () => {
        expect(extractCardLastFour('VISA ************1234')).toBe('1234');
    });
    it('extracts a phone number', () => {
        expect(extractPhoneNumber('Call us (312) 555-0199')).toBe('(312) 555-0199');
    });
});

describe('extractLineItems', () => {
    it('pairs labels with trailing prices and skips totals', () => {
        const items = extractLineItems(['Widget 4.00', 'Gadget 6.50', 'Total 10.50']);
        expect(items).toEqual([
            { label: 'Widget', value: 4.0 },
            { label: 'Gadget', value: 6.5 },
        ]);
    });
});
