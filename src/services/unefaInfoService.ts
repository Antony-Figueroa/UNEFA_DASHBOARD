export interface UnefaInfo {
  title: string;
  extract: string;
  thumbnail?: string;
  source: string;
  type: 'history' | 'news' | 'event';
  timestamp: number;
}

const CACHE_KEY = 'unefa_info_cache';
const CACHE_INDEX_KEY = 'unefa_info_index';

const LOCAL_IMAGES = [
  '/unefa-img/unefa_fachada.jpeg',
  '/unefa-img/Graduacion-UNEFA.jpg',
  '/unefa-img/Universidad De Las Fuerzas Armadas.jpg',
  '/unefa-img/fondo-login.png',
  '/unefa-img/agronomia.jpg',
  '/unefa-img/agroindustrial.jpg',
  '/unefa-img/enfermeria.jpg',
  '/unefa-img/economia.jpg',
  '/unefa-img/WhatsApp Image 2024-07-02 at 12-5425.jpg',
  '/unefa-img/Carreras que ofrece la UNEFA en el Distrito Capital - Notilogía.jpg',
];

const FALLBACK_DATA: UnefaInfo[] = [
  {
    title: "Origen de la UNEFA",
    extract: "Fundada el 3 de febrero de 1974 como el Instituto Universitario Politecnico de las Fuerzas Armadas Nacionales (IUPFAN), fue transformada en universidad por decreto presidencial en 1999, consolidandose como pilar de la educacion superior venezolana.",
    source: "Historia Institucional",
    type: 'history',
    timestamp: Date.now()
  },
  {
    title: "Formacion de Profesionales",
    extract: "Cada graduacion representa la culminacion de anos de esfuerzo, dedicacion y compromiso con la patria. Nuestros graduados llevan consigo los valores de soberania y conocimiento.",
    source: "UNEFA Graduaciones",
    type: 'history',
    timestamp: Date.now()
  },
  {
    title: "Excelencia Educativa",
    extract: "La Universidad Nacional Experimental Politecnica de la Fuerza Armada abre sus puertas al pueblo venezolano, ofreciendo educacion de calidad accesible para todos.",
    source: "UNEFA Institucional",
    type: 'history',
    timestamp: Date.now()
  },
  {
    title: "Compromiso con la Patria",
    extract: "La UNEFA forma profesionales con profundo sentido de pertenencia nacional, comprometidos con el desarrollo soberano de Venezuela.",
    source: "UNEFA Valores",
    type: 'history',
    timestamp: Date.now()
  },
  {
    title: "Ingenieria Agronomica",
    extract: "Formacion de ingenieros capaces de desarrollar soluciones tecnologicas para el sector agricola venezolano, contribuyendo a la soberania alimentaria.",
    source: "Carreras UNEFA",
    type: 'news',
    timestamp: Date.now()
  },
  {
    title: "Ingenieria Agroindustrial",
    extract: "Profesionales preparados para transformar materias primas agricolas en productos de alto valor, impulsando el desarrollo industrial del pais.",
    source: "Carreras UNEFA",
    type: 'news',
    timestamp: Date.now()
  },
  {
    title: "Licenciatura en Enfermeria",
    extract: "Formacion de profesionales de la salud con compromiso social, preparados para brindar atencion medica de calidad a las comunidades venezolanas.",
    source: "Carreras UNEFA",
    type: 'news',
    timestamp: Date.now()
  },
  {
    title: "Ciencias Economicas",
    extract: "Formacion de profesionales en el area economica con vision critica y compromiso social, capaces de contribuir al desarrollo sustentable del pais.",
    source: "Carreras UNEFA",
    type: 'news',
    timestamp: Date.now()
  },
  {
    title: "Valores Institucionales",
    extract: "La juventud de oro de la UNEFA se caracteriza por su disciplina, compromiso y dedicacion. Estos valores son el fundamento de su exito profesional.",
    source: "UNEFA Valores",
    type: 'history',
    timestamp: Date.now()
  },
  {
    title: "Oferta Academica Nacional",
    extract: "La UNEFA ofrece una amplia oferta academica en todas sus sedes a nivel nacional, garantizando educacion de calidad para el pueblo venezolano.",
    source: "UNEFA Academico",
    type: 'news',
    timestamp: Date.now()
  }
];

class UnefaInfoService {
  async getUnefaInfo(forceRefresh = false): Promise<UnefaInfo> {
    let currentIndex = parseInt(localStorage.getItem(CACHE_INDEX_KEY) || '0');

    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as UnefaInfo;
          if (Date.now() - parsed.timestamp < 3600000) {
            return parsed;
          }
        } catch {
          // Cache corrupto
        }
      }
    }

    currentIndex = (currentIndex + 1) % FALLBACK_DATA.length;
    localStorage.setItem(CACHE_INDEX_KEY, currentIndex.toString());

    const result: UnefaInfo = {
      ...FALLBACK_DATA[currentIndex],
      thumbnail: LOCAL_IMAGES[currentIndex % LOCAL_IMAGES.length],
      timestamp: Date.now()
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    return result;
  }
}

export const unefaInfoService = new UnefaInfoService();
