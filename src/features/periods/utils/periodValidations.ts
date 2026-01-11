import { z } from 'zod';
import { Periodo } from '../types';

export const periodSchema = z.object({
    year: z.string().min(1, { message: 'El año es obligatorio.' }),
    periodoTipo: z.enum(['I', 'II']),
    startDate: z.date({
        message: 'La fecha de inicio es obligatoria.',
    }),
    endDate: z.date({
        message: 'La fecha de fin es obligatoria.',
    }),
}).superRefine((data, ctx) => {
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
        const endYear = data.endDate.getFullYear();
        
        if (startYear !== yearNum) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `La fecha de inicio debe corresponder estrictamente al año seleccionado (${yearNum}).`,
                path: ["startDate"]
            });
        }
        
        // El periodo puede terminar en el año siguiente si es el periodo II y dura mucho, 
        // pero generalmente debería estar dentro del rango razonable.
        // Requisito: "Validar que las fechas ingresadas correspondan estrictamente al año seleccionado"
        if (endYear !== yearNum && data.periodoTipo === 'I') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Para el período I, la fecha de fin debe corresponder al año ${yearNum}.`,
                path: ["endDate"]
            });
        }
    }
});

export type PeriodFormData = z.infer<typeof periodSchema>;

/**
 * Valida si un nuevo periodo se solapa con periodos existentes.
 * Retorna true si hay solapamiento.
 */
export const checkOverlap = (newStart: Date, newEnd: Date, existingPeriods: Periodo[], currentPeriodId?: string) => {
    // Normalizar fechas a medianoche para comparación precisa de días
    const start = new Date(newStart.getFullYear(), newStart.getMonth(), newStart.getDate());
    const end = new Date(newEnd.getFullYear(), newEnd.getMonth(), newEnd.getDate());

    return existingPeriods.some(p => {
        if (currentPeriodId && p.periodId === currentPeriodId) {
            return false;
        }
        
        const pStart = new Date(p.startDate.getFullYear(), p.startDate.getMonth(), p.startDate.getDate());
        const pEnd = new Date(p.endDate.getFullYear(), p.endDate.getMonth(), p.endDate.getDate());

        // (StartA <= EndB) and (EndA >= StartB)
        return (start <= pEnd) && (end >= pStart);
    });
};

/**
 * Convierte un lapso (ej: "2025-I") a un valor numérico comparable.
 */
export const getLapsoValue = (l: string) => {
    if (!l || !l.includes('-')) return 0;
    const [y, t] = l.split('-');
    const yearNum = parseInt(y);
    if (isNaN(yearNum)) return 0;
    return yearNum * 10 + (t === 'I' ? 1 : 2);
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

    // El siguiente valor debe ser exactamente +1 (ej: 20251 -> 20252, o 20252 -> 20261)
    const [lastYearStr, lastTipo] = lastPeriod.description.split('-');
    const lastYearNum = parseInt(lastYearStr);
    
    let expectedYear: number;
    let expectedTipo: string;

    if (lastTipo === 'I') {
        expectedYear = lastYearNum;
        expectedTipo = 'II';
    } else {
        expectedYear = lastYearNum + 1;
        expectedTipo = 'I';
    }

    const expectedDescription = `${expectedYear}-${expectedTipo}`;

    if (newDescription !== expectedDescription) {
        return { 
            isValid: false, 
            message: `Secuencia incorrecta. El siguiente lapso obligatorio es ${expectedDescription}. No se permite saltar períodos.` 
        };
    }

    return { isValid: true };
};
