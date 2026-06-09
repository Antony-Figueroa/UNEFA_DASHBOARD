import { z } from 'zod';
import { Periodo } from '../types';

/**
 * Convierte un lapso (ej: "1-2025") a un valor numérico comparable.
 */
export const getLapsoValue = (l: string) => {
    if (!l || !l.includes('-')) return 0;
    const [t, y] = l.split('-');
    const yearNum = parseInt(y);
    if (isNaN(yearNum)) return 0;
    return yearNum * 10 + (t === '1' ? 1 : 2);
};

export const getPeriodSchema = (existingPeriods: Periodo[], currentPeriodId?: string, isEditing: boolean = false) => z.object({
    year: z.string().min(1, { message: 'El año es obligatorio.' }),
    periodoTipo: z.enum(['1', '2']),
    startDate: z.date({
        message: 'La fecha de inicio es obligatoria.',
    }),
    endDate: z.date({
        message: 'La fecha de fin es obligatoria.',
    }),
    enrollmentGraceDays: z.number().int().min(0, "Mínimo 0 días").max(365, "Máximo 365 días"),
    evaluationGraceDays: z.number().int().min(0, "Mínimo 0 días").max(365, "Máximo 365 días"),
}).superRefine((data, ctx) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // El periodo no puede empezar en una fecha que ya pasó (solo para nuevos periodos)
    if (!isEditing && data.startDate < now) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha de inicio no puede ser una fecha pasada.",
            path: ["startDate"]
        });
    }

    if (data.endDate <= data.startDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha de fin debe ser posterior a la de inicio.",
            path: ["endDate"]
        });
        return;
    }
    // Validación de 16 semanas (16 semanas * 7 días * 24 horas * 60 min * 60 seg * 1000 ms)
    const minDuration = 16 * 7 * 24 * 60 * 60 * 1000;
    const duration = data.endDate.getTime() - data.startDate.getTime();

    if (duration < minDuration) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El período debe tener una duración mínima de 16 semanas.",
            path: ["endDate"]
        });
    }
    const yearNum = parseInt(data.year);
    if (!isNaN(yearNum)) {
        const startYear = data.startDate.getFullYear();
        
        if (startYear !== yearNum) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `La fecha de inicio debe corresponder estrictamente al año seleccionado (${yearNum}).`,
                path: ["startDate"]
            });
        }

        const endYear = data.endDate.getFullYear();
        if (endYear > yearNum + 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `La fecha de cierre no puede exceder más de un año del periodo seleccionado (${yearNum}).`,
                path: ["endDate"]
            });
        }
    }

    // --- Validación de Solapamiento ---
    if (checkOverlap(data.startDate, data.endDate, existingPeriods, currentPeriodId)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El rango de fechas se solapa con un periodo existente.",
            path: ["startDate"]
        });
    }

    // --- Validación de Secuencialidad y Duplicados ---
    const newDescription = `${data.periodoTipo}-${data.year}`;
    
    // Verificar si ya existe un periodo igual (Duplicados)
    const duplicate = existingPeriods.find(p => p.description === newDescription && p.periodId !== currentPeriodId);
    if (duplicate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `El periodo ${newDescription} ya existe en el sistema.`,
            path: ["periodoTipo"]
        });
        return;
    }

    const originalPeriod = existingPeriods.find(p => p.periodId === currentPeriodId);
    if (!isEditing || (originalPeriod && originalPeriod.description !== newDescription)) {
        const seqResult = checkSequentiality(newDescription, existingPeriods);
        if (!seqResult.isValid) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: seqResult.message,
                path: ["periodoTipo"]
            });
        }
    }
});

export type PeriodFormData = z.infer<ReturnType<typeof getPeriodSchema>>;

/**
 * Verifica si un rango de fechas se solapa con periodos existentes.
 */
export const checkOverlap = (
    startDate: Date,
    endDate: Date,
    existingPeriods: Periodo[],
    currentPeriodId?: string
): boolean => {
    return existingPeriods.some((p) => {
        // Ignorar el periodo actual si estamos editando
        if (currentPeriodId && p.periodId === currentPeriodId) return false;

        // Verificar solapamiento
        // (StartA <= EndB) and (EndA >= StartB)
        return startDate <= p.endDate && endDate >= p.startDate;
    });
};

/**
 * Valida la secuencialidad de un nuevo periodo.
 */
export const checkSequentiality = (newDescription: string, existingPeriods: Periodo[]) => {
    if (existingPeriods.length === 0) return { isValid: true };

    // Ordenar periodos por lapso cronológico
    const sortedPeriods = [...existingPeriods].sort((a, b) => getLapsoValue(a.description) - getLapsoValue(b.description));
    const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
    const lastValue = getLapsoValue(lastPeriod.description);
    const newValue = getLapsoValue(newDescription);

    if (newValue <= lastValue) {
        return { 
            isValid: false, 
            message: `El lapso debe ser posterior al último período registrado (${lastPeriod.description}).` 
        };
    }

    // El siguiente valor debe ser exactamente +1 (ej: 1-2025 -> 2-2025, o 2-2025 -> 1-2026)
    const [lastTipo, lastYearStr] = lastPeriod.description.split('-');
    const lastYearNum = parseInt(lastYearStr);
    
    let expectedYear: number;
    let expectedTipo: string;

    if (lastTipo === '1') {
        expectedYear = lastYearNum;
        expectedTipo = '2';
    } else {
        expectedYear = lastYearNum + 1;
        expectedTipo = '1';
    }

    const expectedDescription = `${expectedTipo}-${expectedYear}`;

    if (newDescription !== expectedDescription) {
        return { 
            isValid: false, 
            message: `Secuencia incorrecta. El siguiente lapso obligatorio es ${expectedDescription}. No se permite saltar períodos.` 
        };
    }

    return { isValid: true };
};
