/**
 * @file unefaInfoService.ts
 * @description Servicio para obtener información dinámica de la UNEFA desde APIs externas.
 * Implementa cache local, manejo de errores y fallback a datos locales.
 */

import { imageService } from "./imageService";

export interface UnefaInfo {
  title: string;
  extract: string;
  thumbnail?: string;
  imageAttribution?: {
    photographer: string;
    url: string;
  };
  source: string;
  type: 'history' | 'news' | 'event';
  timestamp: number;
}

const CACHE_KEY = 'unefa_info_cache';
const CACHE_INDEX_KEY = 'unefa_info_index';
const WIKIPEDIA_BASE_API = 'https://es.wikipedia.org/api/rest_v1/page/summary/';
const WIKIPEDIA_PAGES = [
  'Universidad_Nacional_Experimental_Politécnica_de_la_Fuerza_Armada_Nacional_Bolivariana',
  'Sistema_Educativo_de_Venezuela',
  'Ministerio_del_Poder_Popular_para_la_Educación_Universitaria'
];

// Datos de respaldo (Fallback) en caso de que las APIs fallen o para rotar
const FALLBACK_DATA: UnefaInfo[] = [
  {
    title: "Excelencia Educativa",
    extract: "La UNEFA se consolida como la universidad líder en formación integral con valores socialistas y excelencia académica en toda Venezuela.",
    thumbnail: "/unefa-img/hero-bg.jpg",
    source: "UNEFA Institucional",
    type: 'history',
    timestamp: Date.now()
  },
  {
    title: "Inscripciones Abiertas 2026",
    extract: "Se informa a toda la comunidad que el proceso de inscripciones para el nuevo periodo académico ya está disponible en todos nuestros núcleos a nivel nacional.",
    thumbnail: "/unefa-img/menbrete-nuevo.jpg",
    source: "Noticias UNEFA",
    type: 'news',
    timestamp: Date.now()
  },
  {
    title: "Valores Institucionales",
    extract: "Disciplina, Lealtad y Patriotismo son los pilares fundamentales que guían a nuestros estudiantes en su formación como profesionales de la República.",
    thumbnail: "/unefa-img/hero-bg.jpg",
    source: "UNEFA Cultura",
    type: 'history',
    timestamp: Date.now()
  },
  {
    title: "Investigación y Desarrollo",
    extract: "La UNEFA impulsa proyectos de investigación tecnológica y científica que contribuyen al desarrollo soberano de la nación.",
    thumbnail: "/unefa-img/menbrete-nuevo.jpg",
    source: "UNEFA I+D",
    type: 'event',
    timestamp: Date.now()
  }
];

class UnefaInfoService {
  /**
   * Limpia etiquetas HTML de una cadena de texto
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, '');
  }

  /**
   * Obtiene la información desde Wikipedia (Institucional/Historia)
   */
  async fetchFromWikipedia(pageIndex: number): Promise<UnefaInfo | null> {
    try {
      const page = WIKIPEDIA_PAGES[pageIndex % WIKIPEDIA_PAGES.length];
      const response = await fetch(`${WIKIPEDIA_BASE_API}${page}`);
      if (!response.ok) throw new Error('Error al conectar con Wikipedia');
      
      const data = await response.json();
      return {
        title: this.stripHtml(data.displaytitle || "Información Institucional"),
        extract: this.stripHtml(data.extract),
        thumbnail: data.originalimage?.source || data.thumbnail?.source,
        source: "Wikipedia",
        type: 'history',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching from Wikipedia:', error);
      return null;
    }
  }

  /**
   * Obtiene la información consolidada con manejo de cache y rotación
   */
  async getUnefaInfo(forceRefresh = false): Promise<UnefaInfo> {
    let currentIndex = parseInt(localStorage.getItem(CACHE_INDEX_KEY) || '0');

    // 1. Intentar obtener de cache si no se fuerza el refresco
    if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as UnefaInfo;
        // Si el cache tiene menos de 1 hora, lo devolvemos
        if (Date.now() - parsed.timestamp < 3600000) {
          return parsed;
        }
      }
    } else {
      // Si se fuerza el refresco, incrementamos el índice para rotar contenido
      currentIndex = (currentIndex + 1) % (WIKIPEDIA_PAGES.length + FALLBACK_DATA.length);
      localStorage.setItem(CACHE_INDEX_KEY, currentIndex.toString());
    }

    // 2. Intentar obtener de Wikipedia o Fallback según el índice
    if (currentIndex < WIKIPEDIA_PAGES.length) {
      const wikiInfo = await this.fetchFromWikipedia(currentIndex);
      if (wikiInfo) {
        // Si Wikipedia no devuelve imagen, le asignamos una temática de Unsplash
        if (!wikiInfo.thumbnail) {
          const thematicImage = await imageService.getRandomThematicImage('venezuela');
          wikiInfo.thumbnail = thematicImage.url;
          wikiInfo.imageAttribution = {
            photographer: thematicImage.photographer,
            url: thematicImage.photographerUrl
          };
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(wikiInfo));
        return wikiInfo;
      }
    }

    // 3. Si falla Wikipedia o el índice corresponde a fallback
    const fallbackIndex = currentIndex % FALLBACK_DATA.length;
    const fallbackBase = FALLBACK_DATA[fallbackIndex];
    
    // Enriquecer con imagen temática de Unsplash para variar
    const thematicImage = await imageService.getImageForContent(fallbackBase.type);
    
    const fallback: UnefaInfo = { 
      ...fallbackBase, 
      thumbnail: thematicImage.url,
      imageAttribution: {
        photographer: thematicImage.photographer,
        url: thematicImage.photographerUrl
      },
      timestamp: Date.now() 
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

export const unefaInfoService = new UnefaInfoService();
