import { useState, useEffect } from 'react';
import { getPeriods } from '../../periods/services/periodService';
import { getDashboardStats } from '../../dashboard/services/dashboardService';
import { getStudents } from '../../students/services/studentsService';
import { useAuth } from '../../../context/auth';

/**
 * Hook para recolectar el contexto institucional del dashboard
 * para dárselo a la IA.
 */
export const useAIContext = () => {
    const { user } = useAuth();
    const [systemContext, setSystemContext] = useState<string>('Eres el Asistente de IA Oficial de la UNEFA. Tu objetivo es ayudar con información académica.');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchContext = async () => {
            setIsLoading(true);
            try {
                const [periods, stats, studentsResponse] = await Promise.all([
                    getPeriods().catch(() => []),
                    getDashboardStats().catch(() => null),
                    getStudents().catch(() => ({ data: [] }))
                ]);

                const activePeriod = periods.find(p => p.periodStatus === 2);
                const allStudents = studentsResponse.data;
                const lastStudent = allStudents.length > 0 ? allStudents[allStudents.length - 1] : null;
                
                const context = {
                    usuario_actual: user ? {
                        nombre: user.name,
                        apellido: user.surname,
                        rol: user.role === 1 ? 'Administrador' : 'Asistente'
                    } : 'No identificado',
                    fecha_actual: new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                    periodo_actual: activePeriod ? {
                        descripcion: activePeriod.description,
                        rango: `${new Date(activePeriod.startDate).toLocaleDateString()} al ${new Date(activePeriod.endDate).toLocaleDateString()}`,
                        status: "EN CURSO"
                    } : "No hay un periodo marcado como EN CURSO actualmente",
                    institucion: {
                        nombre: "Universidad Nacional Experimental Politécnica de la Fuerza Armada (UNEFA)",
                    },
                    ultimo_estudiante_registrado: lastStudent ? {
                        nombre: `${lastStudent.firstName} ${lastStudent.lastName}`,
                        cedula: lastStudent.identificationNumber,
                        email: lastStudent.email,
                        fecha_registro: new Date(lastStudent.enrollmentDate).toLocaleDateString('es-VE')
                    } : "No hay estudiantes registrados.",
                    resumen_periodos: periods.slice(0, 10).map(p => ({
                        descripcion: p.description,
                        estado: p.periodStatus === 1 ? 'Próximo' : p.periodStatus === 2 ? 'EN CURSO' : 'Culminado',
                        meses: `${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}`
                    })),
                    procesos_administrativos: {
                        inscripciones: activePeriod ? "ABIERTAS" : "CERRADAS",
                        pasantias: activePeriod ? "ACTIVAS" : "SOLO CONSULTA",
                        grados: "Cronograma de Secretaría"
                    },
                    metricas_reales: stats ? {
                        estudiantes_totales: stats.totalStudents,
                        estudiantes_activos: stats.activeStudents,
                        nuevos_inscritos: stats.monthlyTarget.current,
                        progreso_meta: `${stats.monthlyTarget.percentage}%`
                    } : "No disponible"
                };

                const prompt = `### REGLA DE ORO DE IDIOMA: responde EXCLUSIVAMENTE EN ESPAÑOL. ###
Está TERMINANTEMENTE PROHIBIDO hablar en inglés, usar palabras en inglés o cerrar el mensaje en inglés. 100% ESPAÑOL.

IDENTIDAD: Eres el ASISTENTE DE IA OFICIAL del Dashboard UNEFA. Solo respondes cuando el usuario hace una pregunta explícita o solicita información específica.

CONTEXTO INSTITUCIONAL (DATOS REALES DEL SISTEMA):
${JSON.stringify(context, null, 2)}

REGLAS CRÍTICAS DE RESPUESTA:
1. IDIOMA: Responde 100% en ESPAÑOL.
2. RESPONDE ÚNICAMENTE A SOLICITUDES EXPLÍCITAS: 
   - Si el usuario dice "hola", responde solo "Hola" o "Hola, ¿en qué puedo ayudarte?"
   - Si el usuario dice "gracias", responde solo "De nada" o "Con gusto"
   - NO proporciones información adicional, resúmenes ni análisis a menos que el usuario lo solicite específicamente
3. VALIDACIÓN DE SOLICITUDES: Antes de proporcionar datos del sistema, verifica que el usuario haya hecho una pregunta directa sobre:
   - Estudiantes ("¿Cuántos estudiantes hay?", "¿Quién es el último estudiante?")
   - Períodos académicos ("¿Qué períodos hay?", "¿Cuál es el período actual?")
   - Estadísticas ("¿Cuáles son las métricas?", "¿Cuántos estudiantes activos hay?")
4. VERACIDAD: Usa EXCLUSIVAMENTE los datos del JSON de arriba cuando el usuario solicite información específica.
5. FORMATO: Usa TABLAS MARKDOWN solo cuando el usuario solicite listas de datos o información estructurada.
6. PRECISIÓN: Si el JSON dice "estudiantes_activos: 14", responde "Hay 14 estudiantes activos". No digas que no tienes acceso, porque SÍ tienes el JSON con la información.

### CASOS DE PRUEBA - RESPUESTAS ESPERADAS:
- Usuario: "hola" → Respuesta: "Hola" o "Hola, ¿en qué puedo ayudarte?"
- Usuario: "gracias" → Respuesta: "De nada" o "Con gusto"
- Usuario: "buenos días" → Respuesta: "Buenos días" o "Buenos días, ¿en qué puedo ayudarte?"
- Usuario: "adiós" → Respuesta: "Hasta luego" o "Adiós"

### PROHIBIDO:
- Dar resúmenes de datos sin que el usuario los solicite
- Proporcionar información sobre períodos, estudiantes o métricas sin una pregunta directa
- Agregar "¿Te gustaría saber más sobre...?" o frases similares cuando no se solicita
- Responder con más de lo mínimo necesario para saludos o agradecimientos

### RECORDATORIO: SOLO RESPONDE A LO QUE EL USUARIO SOLICITE EXPLÍCITAMENTE. EL JSON DE ARRIBA ES TU ACCESO, PERO ÚSALO SOLO CUANDO SE TE PIDA INFORMACIÓN ESPECÍFICA.`;

                setSystemContext(prompt);
            } catch (error) {
                console.error("Error building AI context:", error);
                setSystemContext("Eres el Asistente de IA Oficial de la UNEFA. Solo responde a preguntas específicas del usuario. Si el usuario te saluda, responde con un simple saludo. Si el usuario dice 'gracias', responde 'de nada'. No proporciones información adicional a menos que sea solicitada explícitamente.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchContext();
    }, [user]);

    return { systemContext, isLoading };
};
