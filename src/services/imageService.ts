/**
 * @file imageService.ts
 * @description Servicio para la gestión de imágenes sin derechos de autor utilizando la API de Unsplash.
 * Proporciona imágenes temáticas sobre Venezuela, Soberanía, Libertad y Universidad.
 */

export interface UnsplashImage {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  source: 'Unsplash';
}

const THEME_IMAGES = {
  venezuela: [
    { id: '1566120867404-b8935655483c', photographer: 'Santi Villamarín' },
    { id: '1610411132598-6e5465609395', photographer: 'Jonny Caspari' },
    { id: '1589391035541-10f7605d3922', photographer: 'Erika Giraud' }
  ],
  sovereignty: [
    { id: '1517048676732-d65bc937f952', photographer: 'Dylan Gillis' },
    { id: '1551288049-bebda4e38f71', photographer: 'Luke Michael' }
  ],
  freedom: [
    { id: '1486825586573-7131f7991bcc', photographer: 'Sunil Ray' },
    { id: '1494791368093-85217fbbf8de', photographer: 'Sasha Freemind' }
  ],
  university: [
    { id: '1523050338692-7b835229d40a', photographer: 'Buro Millennial' },
    { id: '1497633762265-9d179a990aa6', photographer: 'Susan Q Yin' },
    { id: '1532094349884-543bb1198c33', photographer: 'National Cancer Institute' }
  ]
};

class ImageService {
  /**
   * Obtiene una imagen aleatoria basada en un tema específico
   */
  async getRandomThematicImage(theme: keyof typeof THEME_IMAGES): Promise<UnsplashImage> {
    const images = THEME_IMAGES[theme];
    const selection = images[Math.floor(Math.random() * images.length)];
    
    // Dimensiones optimizadas
    const width = 1200;
    
    // URL oficial de Unsplash para imágenes específicas por ID
    const imageUrl = `https://images.unsplash.com/photo-${selection.id}?auto=format&fit=crop&w=${width}&q=80`;
    
    return {
      url: imageUrl,
      alt: `Imagen de Unsplash sobre ${theme}`,
      photographer: selection.photographer,
      photographerUrl: `https://unsplash.com/photos/${selection.id}`,
      source: 'Unsplash'
    };
  }

  /**
   * Obtiene una imagen específica para un contenido de la UNEFA
   * Intenta emparejar el tipo de contenido con un tema de imagen
   */
  async getImageForContent(type: 'history' | 'news' | 'event' | string): Promise<UnsplashImage> {
    let theme: keyof typeof THEME_IMAGES = 'venezuela';
    
    if (type === 'history') theme = 'sovereignty';
    else if (type === 'news') theme = 'university';
    else if (type === 'event') theme = 'freedom';
    
    return this.getRandomThematicImage(theme);
  }
}

export const imageService = new ImageService();
