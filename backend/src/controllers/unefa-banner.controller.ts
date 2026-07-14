/**
 * @file unefa-banner.controller.ts
 * @description Controlador para los endpoints del banner scrapeado de UNEFA
 */

import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as unefaBannerService from '../services/unefa-banner-scraper.service.js';

const BANNER_FILENAME = 'current-banner.png';

/**
 * GET /api/unefa-banner
 * Devuelve la metadata del banner actual y las imágenes del carrusel (público)
 */
export const getBannerInfo = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meta = unefaBannerService.getBannerMeta();
    
    // La URL pública de la imagen se sirve desde /uploads/ (static files)
    let imageUrl: string | null = null;
    if (meta.status === 'ok') {
      imageUrl = `/uploads/unefa-banner/${BANNER_FILENAME}`;
    }

    res.json({
      success: true,
      data: {
        ...meta,
        imageUrl,
        // Si no hay banner, sugerir una imagen por defecto
        fallbackImage: '/unefa-img/9360.jpg',
      },
    });
  } catch (error: any) {
    console.error('[UNEFABannerController] Error getting banner info:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del banner',
      error: error.message,
    });
  }
};

/**
 * GET /api/unefa-banner/carousel
 * Devuelve las imágenes del carrusel/popup de UNEFA (público)
 */
export const getCarousel = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    let images = unefaBannerService.getCarouselImages();
    
    // Si no hay imágenes cacheadas, hacer scrape en vivo
    if (images.length === 0) {
      images = await unefaBannerService.scrapeCarouselImages();
    }

    res.json({
      success: true,
      data: images,
    });
  } catch (error: any) {
    console.error('[UNEFABannerController] Error getting carousel:', error);
    // Fallback a URLs conocidas si todo falla
    res.json({
      success: true,
      data: getFallbackCarouselImages(),
    });
  }
};

/**
 * URLs de respaldo del carrusel por si el scrape falla
 */
function getFallbackCarouselImages() {
  const base = 'http://www.unefa.edu.ve';
  return [
    { src: `${base}/CMS/upload/images/popup/imagen-588886205.png`, link: 'http://unefa.edu.ve/CMS/administrador/vistas/archivos/oferta_academica-Postgrado-3-2026.pdf', title: 'Oferta Académica Postgrado' },
    { src: `${base}/CMS/upload/images/popup/imagen-345145445.png`, link: `${base}/CMS/administrador/vistas/archivos/LISTADO-SERVICIO-DE-CERTIFICACION-DE-DOCUMENTOS--ACTUALIZADO-AL-31OCT2025-(1).pdf`, title: 'Certificación de Documentos' },
    { src: `${base}/CMS/upload/images/popup/imagen-830906229.png`, link: `${base}/CMS/administrador/vistas/archivos/LISTADO-DE-DOCUMENTOS-CERTIFICADOS-(SOLICITUDES-DE-2018).pdf`, title: 'Documentos Certificados' },
    { src: `${base}/CMS/upload/images/popup/imagen-545794670.png`, link: 'http://www.unefa.edu.ve/CMS/administrador/vistas/archivos/PASO%20A%20PASO%20CINU%20(1).pdf', title: 'Paso a Paso CINU' },
  ];
}

/**
 * GET /api/unefa-banner/image
 * Sirve la imagen del banner actual (público)
 */
export const getBannerImage = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bannerPath = unefaBannerService.getBannerPath();
    
    if (bannerPath && fs.existsSync(bannerPath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache 1 hora
      res.setHeader('Content-Type', 'image/png');
      res.sendFile(bannerPath);
    } else {
      // Si no hay banner, devolver 404
      res.status(404).json({
        success: false,
        message: 'No hay banner disponible. El scraper aún no ha descargado ninguna imagen.',
      });
    }
  } catch (error: any) {
    console.error('[UNEFABannerController] Error serving banner image:', error);
    res.status(500).json({
      success: false,
      message: 'Error al servir la imagen del banner',
      error: error.message,
    });
  }
};

/**
 * POST /api/unefa-banner/refresh
 * Fuerza una actualización del banner (solo admin)
 */
export const refreshBanner = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meta = await unefaBannerService.scrapeAndDownloadBanner();
    
    res.json({
      success: true,
      message: meta.status === 'ok' 
        ? 'Banner actualizado exitosamente' 
        : 'Error al actualizar el banner',
      data: {
        ...meta,
        imageUrl: meta.status === 'ok' ? `/uploads/unefa-banner/${BANNER_FILENAME}` : null,
      },
    });
  } catch (error: any) {
    console.error('[UNEFABannerController] Error refreshing banner:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el banner',
      error: error.message,
    });
  }
};
