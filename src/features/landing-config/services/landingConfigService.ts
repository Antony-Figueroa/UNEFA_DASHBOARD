import apiClient from '../../../api/apiClient';
import { LandingConfig, LandingConfigUpdate } from '../types';

const API_URL = '/landing-config';

export const landingConfigService = {
  getConfig: async (_forceRefresh = true): Promise<LandingConfig> => {
    try {
      const response = await apiClient.get<any>(API_URL);
      const rawData = response.data;
      
      let config: LandingConfig;
      
      if (rawData.success && rawData.data && rawData.data.hero) {
        config = rawData.data;
      } else if (rawData.hero) {
        config = rawData as unknown as LandingConfig;
      } else {
        console.warn('[landingConfigService] Unexpected response format, using defaults');
        return landingConfigService.getDefaultConfig();
      }
      
      return config;
    } catch (error) {
      console.error('[landingConfigService] Error fetching config:', error);
      return landingConfigService.getDefaultConfig();
    }
  },

  updateConfig: async (config: LandingConfigUpdate): Promise<LandingConfig> => {
    const response = await apiClient.put<{ success: boolean; data: LandingConfig }>(API_URL, config);
    return response.data.data;
  },

  updateHero: async (hero: Partial<LandingConfig['hero']>): Promise<LandingConfig> => {
    const response = await apiClient.put<{ success: boolean; data: LandingConfig }>(`${API_URL}/hero`, hero);
    return response.data.data;
  },

  updateMissionVision: async (missionVision: Partial<LandingConfig['missionVision']>): Promise<LandingConfig> => {
    const response = await apiClient.put<{ success: boolean; data: LandingConfig }>(`${API_URL}/mission-vision`, missionVision);
    return response.data.data;
  },

  updateCareers: async (careers: LandingConfig['careers']): Promise<LandingConfig> => {
    const response = await apiClient.put<{ success: boolean; data: LandingConfig }>(`${API_URL}/careers`, { careers });
    return response.data.data;
  },

  updateFAQs: async (faqs: LandingConfig['faqs']): Promise<LandingConfig> => {
    const response = await apiClient.put<{ success: boolean; data: LandingConfig }>(`${API_URL}/faqs`, { faqs });
    return response.data.data;
  },

  updateProcessSteps: async (processSteps: LandingConfig['processSteps']): Promise<LandingConfig> => {
    const response = await apiClient.put<{ success: boolean; data: LandingConfig }>(`${API_URL}/process-steps`, { processSteps });
    return response.data.data;
  },

  updateGraduateStats: async (stats: Partial<LandingConfig['graduateStats']>): Promise<LandingConfig> => {
    const response = await apiClient.put<{ success: boolean; data: LandingConfig }>(`${API_URL}/graduate-stats`, stats);
    return response.data.data;
  },

  clearCache: (): void => {
    localStorage.removeItem('landing_config_cache');
  },

  getDefaultConfig: (): LandingConfig => ({
    id: 'default',
    hero: {
      title: 'Impulsa tu carrera con',
      subtitle: 'Conectamos estudiantes talentosos de la UNEFA con las mejores oportunidades en el sector público y privado para transformar su potencial en experiencia real.',
      highlightTexts: ['Creatividad', 'Excelencia', 'Valor', 'Éxito'],
      primaryButtonText: 'Comenzar ahora',
      primaryButtonLink: '/signin',
      secondaryButtonText: 'Saber más',
      statsText: 'estudiantes han impulsado su carrera con nosotros.',
      statsCount: 3200,
      mainImage: '/unefa-img/9360.jpg',
      successCardTitle: 'Éxito laboral',
      successCardValue: '+95%',
      successCardSubtitle: 'Éxito laboral',
      companiesCardTitle: 'Empresas aliadas',
      companiesCardValue: '200+',
      companiesCardSubtitle: 'Empresas aliadas'
    },
    missionVision: {
      missionTitle: 'Misión',
      missionText: 'Formar a través de la docencia, la investigación y la extensión, ciudadanos corresponsables con la seguridad y Defensa Integral de la Nación, comprometidos con la Revolución Bolivariana, con competencias emancipadoras y humanistas necesarias para sustentar los planes de desarrollo del país, promoviendo la producción y el intercambio de saberes, como mecanismo de integración latinoamericana y caribeña.',
      visionTitle: 'Visión',
      visionText: 'Ser la primera universidad socialista, reconocida por su Excelencia Educativa en el territorio nacional e internacional, líder en los saberes humanistas, científicos, tecnológicos y militares, inspirada en el ideario bolivariano.'
    },
    careers: [
      {
        id: '1',
        title: 'INGENIERÍA AGRONÓMICA',
        description: 'Formamos profesionales para el desarrollo agrícola sostenible, gestión de recursos naturales y producción vegetal.',
        category: 'Ingeniería',
        image: '/unefa-img/agronomia.jpg',
        color: 'success',
        order: 1,
        active: true
      },
      {
        id: '2',
        title: 'INGENIERÍA AGROINDUSTRIAL',
        description: 'Carrera enfocada en la transformación de productos agrícolas, tecnología de alimentos y gestión agroindustrial.',
        category: 'Ingeniería',
        image: '/unefa-img/agroindustrial.jpg',
        color: 'primary',
        order: 2,
        active: true
      },
      {
        id: '3',
        title: 'ENFERMERÍA',
        description: 'Formamos profesionales de la salud con competencias para el cuidado integral, prevención y promoción de la salud.',
        category: 'T.S.U',
        image: '/unefa-img/enfermeria.jpg',
        color: 'info',
        order: 3,
        active: true
      }
    ],
    faqs: [
      {
        id: '1',
        question: '¿Cuáles son los requisitos para iniciar mis prácticas profesionales?',
        answer: 'Para iniciar tus prácticas profesionales debes haber completado al menos el 70% de las unidades curriculares de tu pensum, estar oficialmente inscrito en el período académico correspondiente y haber entregado toda la documentación requerida por la Coordinación de Pasantías.',
        order: 1,
        active: true
      },
      {
        id: '2',
        question: '¿Cuántas horas de pasantía debo realizar?',
        answer: 'La carga horaria varía según la carrera. Generalmente se requieren entre 480 y 600 horas de prácticas, distribuidas durante un período de 3 a 6 meses dependiendo de la disponibilidad del estudiante y los requerimientos de la carrera.',
        order: 2,
        active: true
      },
      {
        id: '3',
        question: '¿Puedo realizar mis pasantías en cualquier empresa?',
        answer: 'Las empresas o instituciones donde realices tus prácticas deben estar previamente registradas y avaladas por la UNEFA. Puedes consultar el listado de instituciones aliadas en nuestra plataforma o proponer una nueva institución que será evaluada por la Coordinación.',
        order: 3,
        active: true
      },
      {
        id: '4',
        question: '¿Qué documentos debo entregar para la preinscripción?',
        answer: 'Los documentos requeridos incluyen: carta de postulación, constancia de inscripción actualizada, certificado de notas, fotografía reciente, copia de cédula de identidad y formato de datos personales debidamente diligenciado.',
        order: 4,
        active: true
      },
      {
        id: '5',
        question: '¿Quién me tutora durante las prácticas profesionales?',
        answer: 'Durante tus pasantías contarás con dos tutores: un Tutor Académico (docente de la UNEFA) quien supervisa el cumplimiento académico, y un Tutor Empresarial (profesional de la institución receptora) quien guía tu trabajo diario.',
        order: 5,
        active: true
      },
      {
        id: '6',
        question: '¿Las pasantías son remuneradas?',
        answer: 'La remuneración depende de las políticas de cada institución receptora. Algunas empresas ofrecen stipends o beneficios como transporte y alimentación, aunque no es un requisito obligatorio. Esto debe negociarse directamente con la empresa.',
        order: 6,
        active: true
      },
      {
        id: '7',
        question: '¿Qué sucede si debo suspender mis pasantías?',
        answer: 'En caso de fuerza mayor, debes informar inmediatamente a tu Tutor Académico y gestionar la suspensión formal ante la Coordinación de Pasantías. Podrás reanudar tus prácticas una vez se resuelva la situación, siempre dentro del período académico vigente.',
        order: 7,
        active: true
      },
      {
        id: '8',
        question: '¿Cómo se evalúa el desempeño en las pasantías?',
        answer: 'La evaluación consta de tres componentes: informe técnico presentado (40%), evaluación del tutor empresarial (30%) y evaluación del tutor académico mediante visitas y seguimiento (30%). Debes obtener una calificación mínima de 10 puntos para aprobar.',
        order: 8,
        active: true
      }
    ],
    processSteps: [
      { id: '1', number: '01', title: 'Postulación', description: 'Completa tu información personal y académica en la plataforma aliada SICEU.', icon: 'edit', order: 1, active: true },
      { id: '2', number: '02', title: 'Preinscripción', description: 'Entrega de los documentos solicitados.', icon: 'document', order: 2, active: true },
      { id: '3', number: '03', title: 'Inscripción', description: 'Se selecciona la institución y los tutores que mejor se adapte a tus metas.', icon: 'building', order: 3, active: true },
      { id: '4', number: '04', title: 'Desarrollo', description: 'Ejecución de las prácticas profesionales.', icon: 'clock', order: 4, active: true },
      { id: '5', number: '05', title: 'Seguimiento', description: 'Realiza el seguimiento de tus actividades y recibe feedback de tus tutores.', icon: 'search', order: 5, active: true },
      { id: '6', number: '06', title: 'Defensa', description: 'Defiende el informe final de las prácticas profesionales.', icon: 'user', order: 6, active: true },
      { id: '7', number: '07', title: 'Culminación', description: 'Finaliza tu proceso con éxito y obtén tu certificación académica.', icon: 'check', order: 7, active: true }
    ],
    graduateStats: {
      title: 'Ficha de Datos: Pasantías y Prácticas Profesionales',
      subtitle: 'Estimado Histórico y Estadísticas de Cumplimiento Académico - Extensión Acarigua (2008 - 2025).',
      totalRangeMin: 3200,
      totalRangeMax: 5100,
      annualRangeMin: 180,
      annualRangeMax: 350,
      successRate: 98,
      processDefinition: 'Prácticas Profesionales (Pasantías) - Obligatorio y curricular para todas las carreras de pregrado.',
      durationText: 'Entre 12 y 16 semanas (dependiendo del diseño curricular de la carrera).',
      notes: 'Cifras consolidadas con base en los registros históricos de la Unidad de Gestión Educativa.'
    },
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  })
};