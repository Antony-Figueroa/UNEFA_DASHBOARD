import { useState, useEffect } from 'react';
import { unefaInfoService } from '../../../services/unefaInfoService';
import { getPeriods } from '../../periods/services/periodService';
import { getDashboardStats } from '../../dashboard/services/dashboardService';

/**
 * Hook para recolectar el contexto institucional del dashboard
 * para dárselo a la IA.
 */
export const useAIContext = () => {
    const [systemContext, setSystemContext] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchContext = async () => {
            setIsLoading(true);
            try {
                const [info, periods, stats] = await Promise.all([
                    unefaInfoService.getUnefaInfo().catch(() => null),
                    getPeriods().catch(() => []),
                    getDashboardStats().catch(() => null)
                ]);

                const activePeriod = periods.find(p => p.periodStatus === 2);
                
                const context = {
                    fecha_actual: new Date().toLocaleDateString('es-VE'),
                    institucion: {
                        nombre: "Universidad Nacional Experimental Politécnica de la Fuerza Armada (UNEFA)",
                        noticia_destacada: info ? {
                            titulo: info.title,
                            resumen: info.extract
                        } : "No disponible"
                    },
                    periodos_academicos: periods.slice(0, 5).map(p => ({
                        id: p.periodId,
                        descripcion: p.description,
                        estado: p.periodStatus === 1 ? 'Pendiente' : p.periodStatus === 2 ? 'En Curso' : 'Culminado',
                        rango: `${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}`
                    })),
                    procesos_administrativos: {
                        inscripciones: activePeriod ? "ABIERTAS (Periodo en curso)" : "CERRADAS",
                        pasantias: activePeriod ? "ACTIVAS (Inscripciones y seguimiento en curso)" : "CERRADAS (Esperando nuevo periodo)",
                        grados: "CONSULTAR (Depende de cronograma de Secretaría)",
                        traslados: activePeriod ? "ABIERTOS (Sujeto a disponibilidad de cupos)" : "CERRADOS"
                    },
                    metricas_dashboard: stats ? {
                        total_estudiantes: stats.totalStudents,
                        estudiantes_activos: stats.activeStudents,
                        inscritos_acumulados: stats.monthlyTarget.current,
                        tasa_crecimiento: `${stats.monthlyGrowth.percentageChange}%`
                    } : "No disponible"
                };

                const prompt = `Eres el Asistente de IA Oficial de la UNEFA. 
Tu objetivo es ayudar a estudiantes y personal administrativo con información precisa.
A continuación tienes el estado actual del sistema en formato JSON (Contexto de Base de Datos):
${JSON.stringify(context, null, 2)}

Instrucciones:
1. Si te preguntan por periodos, usa la lista de periodos_academicos. Muestra la información en una TABLA de markdown si hay más de 2 elementos.
2. Si te preguntan por noticias o qué hay de nuevo, usa institucion.noticia_destacada.
3. Si te preguntan por estadísticas, usa metricas_dashboard. Usa listas o tablas para que sea legible.
4. Si preguntan por procesos (pasantías, inscripciones, traslados), usa los datos en procesos_administrativos. 
   - SIEMPRE verifica si hay un periodo "En Curso". Si lo hay, asume que los procesos asociados están operativos.
5. Mantén siempre un tono institucional, amable y profesional.
6. No inventes datos que no estén en este JSON. Si no sabes algo, indica que el usuario debe consultar con Control de Estudios.
7. USA FORMATO MARKDOWN ENRIQUECIDO (negritas, tablas, listas) para mejorar la legibilidad.`;

                setSystemContext(prompt);
            } catch (error) {
                console.error("Error building AI context:", error);
                setSystemContext("Eres el Asistente de IA Oficial de la UNEFA. Responde de manera profesional.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchContext();
    }, []);

    return { systemContext, isLoading };
};
