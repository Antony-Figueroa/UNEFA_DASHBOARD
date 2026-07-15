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
      console.warn('[unefaBannerService] Error fetching carousel, returning empty:', error);
      // No devolver fallbacks con HTTP para evitar Mixed Content errors.
      // El scraper ya cachea las imágenes y las sirve con URLs locales (proxied).
      return [];
    }
  },
};
