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
 * Las imágenes retornan con URLs locales (proxied) si fueron descargadas,
 * o con la URL original si no. Nunca retorna imágenes con URLs HTTP para
 * evitar Mixed Content.
 */
export const getCarousel = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    let images = unefaBannerService.getCarouselImages();
    
    // Si no hay imágenes cacheadas, hacer scrape en vivo
    if (images.length === 0) {
      const scraped = await unefaBannerService.scrapeCarouselImages();
      if (scraped.length > 0) {
        // Intentar descargar las imágenes para tener URLs locales
        images = await unefaBannerService.downloadCarouselImages(scraped);
      }
    }

    res.json({
      success: true,
      data: images,
    });
  } catch (error: any) {
    console.error('[UNEFABannerController] Error getting carousel:', error);
    // Devolver array vacío en lugar de fallbacks HTTP para evitar Mixed Content
    res.json({
      success: true,
      data: [],
    });
  }
};

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
