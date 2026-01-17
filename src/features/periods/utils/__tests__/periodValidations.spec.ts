import { describe, it, expect } from 'vitest';
import { checkOverlap, checkSequentiality, getLapsoValue, getPeriodSchema } from '../periodValidations';
import { Periodo } from '../../types';

describe('Period Validations', () => {
    const existingPeriods: Periodo[] = [
        {
            periodId: '1',
            code: '2025-I',
            description: '2025-I',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-05-31'),
            periodStatus: 3,
            status: true,
            creationDate: new Date()
        },
        {
            periodId: '2',
            code: '2025-II',
            description: '2025-II',
            startDate: new Date('2025-06-01'),
            endDate: new Date('2025-10-31'),
            periodStatus: 2,
            status: true,
            creationDate: new Date()
        }
    ];

    describe('checkOverlap', () => {
        it('should detect overlap when new period starts during existing period', () => {
            const newStart = new Date('2025-05-15');
            const newEnd = new Date('2025-09-15');
            expect(checkOverlap(newStart, newEnd, existingPeriods)).toBe(true);
        });

        it('should detect overlap when new period ends during existing period', () => {
            const newStart = new Date('2024-12-15');
            const newEnd = new Date('2025-02-15');
            expect(checkOverlap(newStart, newEnd, existingPeriods)).toBe(true);
        });

        it('should not detect overlap when new period is outside existing ranges', () => {
            const newStart = new Date('2026-01-01');
            const newEnd = new Date('2026-05-31');
            expect(checkOverlap(newStart, newEnd, existingPeriods)).toBe(false);
        });

        it('should ignore current period when editing', () => {
            const currentStart = new Date('2025-06-01');
            const currentEnd = new Date('2025-10-31');
            expect(checkOverlap(currentStart, currentEnd, existingPeriods, '2')).toBe(false);
        });
    });

    describe('checkSequentiality', () => {
        it('should validate correctly for the next immediate period (I -> II)', () => {
            const result = checkSequentiality('2026-I', existingPeriods);
            expect(result.isValid).toBe(true);
        });

        it('should fail if the period is not sequential (skipping a semester)', () => {
            const result = checkSequentiality('2026-II', existingPeriods);
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('El siguiente lapso debería ser 2026-I');
        });

        it('should fail if the period is in the past', () => {
            const result = checkSequentiality('2024-II', existingPeriods);
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('El lapso debe ser posterior a 2025-II');
        });
    });

    describe('getLapsoValue', () => {
        it('should convert I to 1 and II to 2 with year prefix', () => {
            expect(getLapsoValue('I-2025')).toBe(20251);
            expect(getLapsoValue('II-2025')).toBe(20252);
        });
    });

    describe('getPeriodSchema (Zod)', () => {
        const schema = getPeriodSchema(existingPeriods, undefined, false);

        it('should fail if endDate is before startDate', () => {
            const data = {
                year: '2026',
                periodoTipo: 'I' as const,
                startDate: new Date('2026-05-01'),
                endDate: new Date('2026-04-01')
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should fail if duration is less than 16 weeks', () => {
            const startDate = new Date('2026-01-01');
            const endDate = new Date(startDate.getTime() + (15 * 7 * 24 * 60 * 60 * 1000)); // 15 weeks
            const data = {
                year: '2026',
                periodoTipo: 'I' as const,
                startDate,
                endDate
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should fail if year does not match startDate year', () => {
            const data = {
                year: '2026',
                periodoTipo: 'I' as const,
                startDate: new Date(2025, 0, 1),
                endDate: new Date(2025, 5, 1)
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('La fecha de inicio no puede ser anterior al año 2026');
            }
        });

        it('should fail if startDate year is after selected year', () => {
            const data = {
                year: '2025',
                periodoTipo: 'I' as const,
                startDate: new Date(2026, 0, 1),
                endDate: new Date(2026, 5, 1)
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('La fecha de inicio debe corresponder al año 2025');
            }
        });

        it('should pass if year matches startDate year', () => {
            const data = {
                year: '2025',
                periodoTipo: 'I' as const,
                startDate: new Date(2025, 0, 15),
                endDate: new Date(2025, 5, 15)
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should handle different date formats correctly via Date object', () => {
            const data = {
                year: '2025',
                periodoTipo: 'I' as const,
                startDate: new Date(2025, 2, 10),
                endDate: new Date(2025, 7, 20)
            };
            const result = schema.safeParse(data);
            expect(result.success).toBe(true);
        });
    });
});
