import apiClient from '../../../api/apiClient';

export interface BannerData {
  sourceUrl: string | null;
  lastUpdated: string | null;
  lastFetchAttempt: string | null;
  lastError: string | null;
  /** Ruta pública desde el backend (ej: /uploads/unefa-banner/current-banner.png) */
  imageUrl: string | null;
  status: 'ok' | 'error' | 'pending';
  fallbackImage: string;
}

export interface CarouselImage {
  src: string;
  link: string | null;
  title: string | null;
}

/**
 * Construye la URL absoluta para una imagen servida por el backend.
 * En desarrollo: http://localhost:3000 + imagePath
 * En producción: https://backend.onrender.com + imagePath
 */
function buildImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  
  // Obtener el baseURL del apiClient (ej: http://localhost:3000/api o /api)
  const apiBase = (apiClient.defaults.baseURL || '/api').replace(/\/+$/, '');
  
  // Si el baseURL es absoluto (http://...), extraer el origin
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    const origin = apiBase.replace(/\/api.*$/, '');
    return `${origin}${imagePath}`;
  }
  
  // Si es relativo (/api), la imagen se sirve desde el mismo dominio
  return imagePath;
}

export const unefaBannerService = {
  getBannerInfo: async (): Promise<BannerData> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: BannerData }>('/unefa-banner');
      const data = response.data.data;
      
      // Convertir la ruta relativa a URL absoluta si es necesario
      return {
        ...data,
        imageUrl: buildImageUrl(data.imageUrl),
      };
    } catch (error) {
      console.warn('[unefaBannerService] Error fetching banner, using fallback:', error);
      return {
        sourceUrl: null,
        lastUpdated: null,
        lastFetchAttempt: null,
        lastError: 'Error de conexión',
        imageUrl: null,
        status: 'error',
        fallbackImage: '/unefa-img/9360.jpg',
      };
    }
  },

  getCarouselImages: async (): Promise<CarouselImage[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: CarouselImage[] }>('/unefa-banner/carousel');
      return response.data.data;
    } catch (error) {
      console.warn('[unefaBannerService] Error fetching carousel, using fallback:', error);
      // Fallback a URLs conocidas
      const base = 'http://www.unefa.edu.ve';
      return [
        { src: `${base}/CMS/upload/images/popup/imagen-588886205.png`, link: 'http://unefa.edu.ve/CMS/administrador/vistas/archivos/oferta_academica-Postgrado-3-2026.pdf', title: 'Oferta Académica Postgrado' },
        { src: `${base}/CMS/upload/images/popup/imagen-345145445.png`, link: `${base}/CMS/administrador/vistas/archivos/LISTADO-SERVICIO-DE-CERTIFICACION-DE-DOCUMENTOS--ACTUALIZADO-AL-31OCT2025-(1).pdf`, title: 'Certificación de Documentos' },
        { src: `${base}/CMS/upload/images/popup/imagen-830906229.png`, link: `${base}/CMS/administrador/vistas/archivos/LISTADO-DE-DOCUMENTOS-CERTIFICADOS-(SOLICITUDES-DE-2018).pdf`, title: 'Documentos Certificados' },
        { src: `${base}/CMS/upload/images/popup/imagen-545794670.png`, link: 'http://www.unefa.edu.ve/CMS/administrador/vistas/archivos/PASO%20A%20PASO%20CINU%20(1).pdf', title: 'Paso a Paso CINU' },
      ];
    }
  },
};
