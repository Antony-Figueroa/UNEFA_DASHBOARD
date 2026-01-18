import { describe, it, expect } from 'vitest';
import { checkOverlap, checkSequentiality, getLapsoValue, getPeriodSchema } from '../periodValidations';
import { Periodo } from '../../types';

describe('Period Validations', () => {
    const existingPeriods: Periodo[] = [
        {
            periodId: '1',
            code: '2026-1',
            description: '1-2026',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-05-31'),
            periodStatus: 3,
            status: true,
            creationDate: new Date()
        },
        {
            periodId: '2',
            code: '2026-2',
            description: '2-2026',
            startDate: new Date('2026-06-01'),
            endDate: new Date('2026-10-31'),
            periodStatus: 2,
            status: true,
            creationDate: new Date()
        }
    ];

    describe('checkOverlap', () => {
        it('should detect overlap when new period starts during existing period', () => {
            const newStart = new Date('2026-05-15');
            const newEnd = new Date('2026-09-15');
            expect(checkOverlap(newStart, newEnd, existingPeriods)).toBe(true);
        });

        it('should detect overlap when new period ends during existing period', () => {
            const newStart = new Date('2025-12-15');
            const newEnd = new Date('2026-02-15');
            expect(checkOverlap(newStart, newEnd, existingPeriods)).toBe(true);
        });

        it('should not detect overlap when new period is outside existing ranges', () => {
            const newStart = new Date('2027-01-01');
            const newEnd = new Date('2027-05-31');
            expect(checkOverlap(newStart, newEnd, existingPeriods)).toBe(false);
        });

        it('should ignore current period when editing', () => {
            const currentStart = new Date('2026-06-01');
            const currentEnd = new Date('2026-10-31');
            expect(checkOverlap(currentStart, currentEnd, existingPeriods, '2')).toBe(false);
        });
    });

    describe('checkSequentiality', () => {
        it('should validate correctly for the next immediate period (1 -> 2)', () => {
            const result = checkSequentiality('1-2027', existingPeriods);
            expect(result.isValid).toBe(true);
        });

        it('should fail if the period is not sequential (skipping a semester)', () => {
            const result = checkSequentiality('2-2027', existingPeriods);
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('El siguiente lapso obligatorio es 1-2027');
        });

        it('should fail if the period is in the past', () => {
            const result = checkSequentiality('2-2025', existingPeriods);
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('El lapso debe ser posterior al último período registrado (2-2026)');
        });
    });

    describe('getLapsoValue', () => {
        it('should convert 1 to 1 and 2 to 2 with year prefix', () => {
            expect(getLapsoValue('1-2025')).toBe(20251);
            expect(getLapsoValue('2-2025')).toBe(20252);
        });
    });

    describe('getPeriodSchema (Zod)', () => {
        const schema = getPeriodSchema(existingPeriods, undefined, false);

        it('should fail if endDate is before startDate', () => {
            const data = {
                year: '2027',
                periodoTipo: '1' as const,
                startDate: new Date('2027-05-01'),
                endDate: new Date('2027-04-01')
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should fail if duration is less than 16 weeks', () => {
            const startDate = new Date('2027-01-01');
            const endDate = new Date(startDate.getTime() + (15 * 7 * 24 * 60 * 60 * 1000)); // 15 weeks
            const data = {
                year: '2027',
                periodoTipo: '1' as const,
                startDate,
                endDate
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should fail if year does not match startDate year', () => {
            const data = {
                year: '2027',
                periodoTipo: '1' as const,
                startDate: new Date(2026, 0, 1), // Jan 2026 is still in the past if today is 2026-01-17, but I'll use 2028
                endDate: new Date(2026, 5, 1)
            };
            // Wait, I'll use years that are definitely not past.
            data.startDate = new Date(2028, 0, 1);
            data.endDate = new Date(2028, 5, 1);
            data.year = '2027';

            const result = schema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('La fecha de inicio debe corresponder estrictamente al año seleccionado (2027)');
            }
        });

        it('should fail if startDate year is after selected year', () => {
            const data = {
                year: '2027',
                periodoTipo: '1' as const,
                startDate: new Date(2028, 0, 1),
                endDate: new Date(2028, 5, 1)
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('La fecha de inicio debe corresponder estrictamente al año seleccionado (2027)');
            }
        });

        it('should pass if year matches startDate year', () => {
            const data = {
                year: '2027',
                periodoTipo: '1' as const,
                startDate: new Date(2027, 0, 15),
                endDate: new Date(2027, 5, 15)
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should pass if endDate is in the next year', () => {
            const data = {
                year: '2027',
                periodoTipo: '1' as const,
                startDate: new Date(2027, 8, 1), // Sept 2027 (as an example of late start)
                endDate: new Date(2028, 0, 15)   // Jan 2028
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should fail if endDate is 2 years after selected year', () => {
            const data = {
                year: '2027',
                periodoTipo: '1' as const,
                startDate: new Date(2027, 0, 1),
                endDate: new Date(2029, 0, 1)
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('La fecha de cierre no puede exceder más de un año');
            }
        });

        it('should handle different date formats correctly via Date object', () => {
            const data = {
                year: '2027',
                periodoTipo: 'I' as const,
                startDate: new Date(2027, 2, 10),
                endDate: new Date(2027, 7, 20)
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(true);
        });
    });
});
