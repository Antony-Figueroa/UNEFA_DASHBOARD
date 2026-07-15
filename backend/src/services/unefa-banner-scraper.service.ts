/**
 * @file unefa-banner-scraper.service.ts
 * @description Servicio que scrapea el portal oficial de la UNEFA para extraer
 * la imagen del banner principal, la descarga y la guarda localmente.
 * Se ejecuta cada 6 horas automáticamente.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Constantes ───────────────────────────────────────────────────────────────

const UNEFA_PORTAL_URL = 'https://www.unefa.edu.ve/portal/';
const SCRAPER_INTERVAL_HOURS = 6;
const SCRAPER_INTERVAL_MS = SCRAPER_INTERVAL_HOURS * 60 * 60 * 1000;

// Directorio donde se guarda el banner
const BANNER_DIR = path.resolve(__dirname, '../../uploads/unefa-banner');
const BANNER_FILENAME = 'current-banner.png';
const BANNER_PATH = path.join(BANNER_DIR, BANNER_FILENAME);
const META_PATH = path.join(BANNER_DIR, 'meta.json');

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface CarouselImage {
  src: string;
  link: string | null;
  title: string | null;
}

export interface BannerMeta {
  sourceUrl: string | null;
  lastUpdated: string | null;
  lastFetchAttempt: string | null;
  lastError: string | null;
  imageUrl: string | null;
  status: 'ok' | 'error' | 'pending';
  carouselImages: CarouselImage[];
}

// ─── Funciones Auxiliares ─────────────────────────────────────────────────────

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readMeta(): BannerMeta {
  try {
    if (fs.existsSync(META_PATH)) {
      return JSON.parse(fs.readFileSync(META_PATH, 'utf-8')) as BannerMeta;
    }
  } catch {
    // ignore
  }
  return {
    sourceUrl: null,
    lastUpdated: null,
    lastFetchAttempt: null,
    lastError: null,
    imageUrl: null,
    status: 'pending',
    carouselImages: [],
  };
}

function writeMeta(meta: BannerMeta): void {
  ensureDir(BANNER_DIR);
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf-8');
}

/**
 * Extrae la URL de la imagen banner del HTML del portal UNEFA.
 * Busca primero por clase específica "headerfull extra" (el banner principal)
 * y luego por patrones de nombre de archivo como fallback.
 */
function extractBannerUrl(html: string): string | null {
  // Patrón 1 (ALTA PRIORIDAD): Buscar <img> con class="headerfull extra" (banner principal de UNEFA)
  // NOTA: Usamos [^"']+ en vez de [^"']* para evitar capturar src vacío de comentarios HTML
  const headerfullRegex = /<img[^>]*class\s*=\s*["'][^"']*headerfull[^"']*extra[^"']*["'][^>]*src\s*=\s*["']([^"']+\.[^"']+)["'][^>]*>/i;
  const matchHF = html.match(headerfullRegex);
  if (matchHF && matchHF[1].trim() && !matchHF[1].includes('gob') && !matchHF[1].includes('fondo') && !matchHF[1].includes('logo')) {
    return normalizeUrl(matchHF[1]);
  }

  // Patrón 2: Buscar <img> con "banner" en src (case insensitive)
  const imgBannerRegex = /<img[^>]*src\s*=\s*["']([^"']*banner[^"']*\.(?:png|jpg|jpeg|gif|webp))["'][^>]*>/i;
  const match1 = html.match(imgBannerRegex);
  if (match1) {
    return normalizeUrl(match1[1]);
  }

  // Patrón 3: Buscar cualquier src que contenga "banner"
  const srcBannerRegex = /src\s*=\s*["']([^"']*\/img\/banner[^"']*\.(?:png|jpg|jpeg|gif|webp))["']/i;
  const match2 = html.match(srcBannerRegex);
  if (match2) {
    return normalizeUrl(match2[1]);
  }

  // Patrón 4: Buscar <img> dentro de div con clase mainheaderk (donde está el banner)
  const mainheaderkRegex = /<div[^>]*class\s*=\s*["'][^"']*mainheaderk[^"']*["'][^>]*>.*?<img[^>]*src\s*=\s*["']([^"']+\.[^"']+)["'][^>]*>/is;
  const matchMH = html.match(mainheaderkRegex);
  if (matchMH && matchMH[1].trim() && !matchMH[1].includes('gob') && !matchMH[1].includes('fondo')) {
    return normalizeUrl(matchMH[1]);
  }

  // Patrón 5: Buscar cualquier imagen grande en /img/ (para fallback)
  const imgGenericRegex = /src\s*=\s*["']([^"']*\/img\/[^"']+\.(?:png|jpg|jpeg))["']/i;
  const match3 = html.match(imgGenericRegex);
  if (match3) {
    return normalizeUrl(match3[1]);
  }

  return null;
}

/**
 * Normaliza URLs relativas a absolutas
 */
function normalizeUrl(src: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // Forzar HTTPS para evitar Mixed Content en el frontend
    if (src.startsWith('http://') && src.includes('unefa.edu.ve')) {
      return src.replace('http://', 'https://');
    }
    return src;
  }
  // Si empieza con /, es ruta absoluta al dominio raíz
  if (src.startsWith('/')) {
    try {
      const urlObj = new URL(UNEFA_PORTAL_URL);
      return `${urlObj.origin}${src}`;
    } catch {
      const domain = UNEFA_PORTAL_URL.replace(/\/+$/, '');
      return `${domain}${src}`;
    }
  }
  // Si es relativa, construir URL absoluta respecto a la página del portal
  const base = UNEFA_PORTAL_URL.endsWith('/') ? UNEFA_PORTAL_URL : UNEFA_PORTAL_URL + '/';
  return base + src;
}

/**
 * Busca en el HTML usando regex para extraer el banner
 */
function findBannerInHTML(html: string): string | null {
  // Buscar específicamente imágenes en la sección de slider/banner
  // Patrón: cualquier elemento con fondo de imagen grande
  const patterns = [
    /banner[-_\s]?\d{4}[-_\s]?\d*\.(?:png|jpg|jpeg)/gi,
    /slide[-_\s]?\d*\.(?:png|jpg|jpeg)/gi,
    /hero[-_\s]?\d*\.(?:png|jpg|jpeg)/gi,
    /portada[-_\s]?\d*\.(?:png|jpg|jpeg)/gi,
    /principal[-_\s]?\d*\.(?:png|jpg|jpeg)/gi,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      // Encontrar la URL completa alrededor de este nombre de archivo
      const filename = match[0];
      const urlRegex = new RegExp(`["']([^"']*${escapeRegex(filename)})["']`, 'i');
      const urlMatch = html.match(urlRegex);
      if (urlMatch) {
        return normalizeUrl(urlMatch[1]);
      }
    }
  }

  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extrae las imágenes del carrusel/popup del HTML del portal UNEFA
 */
function extractCarouselImages(html: string): CarouselImage[] {
  const images: CarouselImage[] = [];
  
  // Buscar en la sección .rotator o .box_skitter
  // Patrón: <li> con <a> que contiene <img> con src a popup
  const carouselRegex = /<li[^>]*>\s*<a[^>]*href\s*=\s*["']([^"']*)["'][^>]*>\s*<img[^>]*src\s*=\s*["']([^"']*popup[^"']*\.(?:png|jpg|jpeg))["'][^>]*>\s*<\/a>\s*<\/li>/gi;
  let match;
  while ((match = carouselRegex.exec(html)) !== null) {
    const link = match[1].trim();
    const src = normalizeUrl(match[2].trim());
    // Extraer título del atributo title del anchor, o de texto cercano
    const titleMatch = html.substring(Math.max(0, match.index - 200), match.index).match(/title\s*=\s*["']([^"']*)["']/i);
    const title = titleMatch ? titleMatch[1].trim() : null;
    
    if (src && !images.some(i => i.src === src)) {
      images.push({ src, link: link.startsWith('http') ? link : normalizeUrl(link), title });
    }
  }

  // Si no encontró con el primer patrón, intentar búsqueda más amplia
  if (images.length === 0) {
    const imgRegex = /<img[^>]*src\s*=\s*["']([^"']*\/popup\/[^"']+\.(?:png|jpg|jpeg))["'][^>]*>/gi;
    while ((match = imgRegex.exec(html)) !== null) {
      const src = normalizeUrl(match[1].trim());
      if (src && !images.some(i => i.src === src)) {
        images.push({ src, link: null, title: null });
      }
    }
  }

  return images;
}

// ─── Servicio Principal ───────────────────────────────────────────────────────

/**
 * Scrapea el portal de UNEFA, descarga el banner y lo guarda localmente.
 */
export async function scrapeAndDownloadBanner(): Promise<BannerMeta> {
  const meta = readMeta();
  meta.lastFetchAttempt = new Date().toISOString();

  try {
    // 1. Obtener el HTML del portal
    console.log('[UNEFABanner] Fetching UNEFA portal...');
    const response = await axios.get<string>(UNEFA_PORTAL_URL, {
      timeout: 15000,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const html = response.data;

    // 2. Extraer la URL del banner y las imágenes del carrusel
    const bannerUrl = extractBannerUrl(html) || findBannerInHTML(html);
    
    // Extraer carrusel de imágenes popup y descargarlas localmente
    const carouselRaw = extractCarouselImages(html);
    if (carouselRaw.length > 0) {
      console.log(`[UNEFABanner] Carrusel encontrado: ${carouselRaw.length} imágenes`);
      const proxiedImages = await downloadCarouselImages(carouselRaw);
      meta.carouselImages = proxiedImages;
      // Limpiar imágenes antiguas del carrusel
      const currentFilenames = proxiedImages
        .map(img => path.basename(img.src))
        .filter(name => name.startsWith('carousel_'));
      cleanOldCarouselImages(currentFilenames);
    }
    
    if (!bannerUrl) {
      // Fallback: buscar cualquier imagen grande (> 50KB esperado)
      console.warn('[UNEFABanner] No se encontró banner específico. Buscando imágenes generales...');
      const imgRegex = /<img[^>]*src\s*=\s*["']([^"']+\.(?:png|jpg|jpeg))["'][^>]*>/gi;
      const images: string[] = [];
      let imgMatch;
      while ((imgMatch = imgRegex.exec(html)) !== null) {
        const url = normalizeUrl(imgMatch[1]);
        if (!url.includes('logo') && !url.includes('icon') && !url.includes('gob')) {
          images.push(url);
        }
      }
      
      if (images.length > 0) {
        // Tomar la primera imagen grande (probablemente el banner)
        const finalUrl = images[0];
        console.log(`[UNEFABanner] Usando imagen alternativa: ${finalUrl}`);
        await downloadImage(finalUrl, meta);
      } else {
        throw new Error('No se encontraron imágenes en el portal UNEFA');
      }
    } else {
      console.log(`[UNEFABanner] Banner encontrado: ${bannerUrl}`);
      await downloadImage(bannerUrl, meta);
    }
  } catch (error: any) {
    const errorMsg = error.message || 'Error desconocido';
    console.error(`[UNEFABanner] Error: ${errorMsg}`);
    meta.status = 'error';
    meta.lastError = errorMsg;
    writeMeta(meta);
  }

  return meta;
}

/**
 * Descarga una imagen y la guarda localmente
 */
async function downloadImage(imageUrl: string, meta: BannerMeta): Promise<void> {
  console.log(`[UNEFABanner] Descargando imagen: ${imageUrl}`);
  
  const response = await axios.get<Buffer>(imageUrl, {
    timeout: 20000,
    responseType: 'arraybuffer',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': UNEFA_PORTAL_URL,
    },
  });

  ensureDir(BANNER_DIR);
  fs.writeFileSync(BANNER_PATH, Buffer.from(response.data));
  
  const fileSize = fs.statSync(BANNER_PATH).size;
  console.log(`[UNEFABanner] Imagen guardada: ${BANNER_PATH} (${(fileSize / 1024).toFixed(1)} KB)`);

  // Actualizar metadata
  meta.sourceUrl = imageUrl;
  meta.lastUpdated = new Date().toISOString();
  meta.lastError = null;
  meta.status = 'ok';
  meta.imageUrl = `/uploads/unefa-banner/${BANNER_FILENAME}`;
  writeMeta(meta);
}

/**
 * Obtiene las URLs de las imágenes del carrusel de UNEFA
 */
export async function scrapeCarouselImages(): Promise<CarouselImage[]> {
  try {
    console.log('[UNEFABanner] Fetching carousel images...');
    const response = await axios.get<string>(UNEFA_PORTAL_URL, {
      timeout: 15000,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const html = response.data;
    const images = extractCarouselImages(html);
    console.log(`[UNEFABanner] ${images.length} imágenes de carrusel encontradas`);
    return images;
  } catch (error: any) {
    console.error('[UNEFABanner] Error scraping carousel:', error.message);
    return [];
  }
}

/**
 * Obtiene las URLs de las imágenes del carrusel (desde el último scrapeo)
 */
export function getCarouselImages(): CarouselImage[] {
  const meta = readMeta();
  return meta.carouselImages || [];
}

/**
 * Descarga las imágenes del carrusel y las guarda localmente para evitar
 * problemas de Mixed Content y timeouts al servirlas desde HTTPS.
 * Retorna las imágenes del carrusel con URLs locales.
 */
export async function downloadCarouselImages(images: CarouselImage[]): Promise<CarouselImage[]> {
  const downloaded: CarouselImage[] = [];
  ensureDir(BANNER_DIR);

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    try {
      // Generar un nombre de archivo único basado en hash simple y extensión
      const ext = path.extname(img.src).split('?')[0] || '.png';
      const hash = Buffer.from(img.src).toString('base64').replace(/[/+=]/g, '_').slice(0, 32);
      const localFilename = `carousel_${hash}${ext}`;
      const localPath = path.join(BANNER_DIR, localFilename);

      // Solo descargar si no existe (caché local)
      if (!fs.existsSync(localPath)) {
        console.log(`[UNEFABanner] Descargando imagen carrusel ${i + 1}/${images.length}: ${img.src}`);
        const response = await axios.get<Buffer>(img.src, {
          timeout: 15000,
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': UNEFA_PORTAL_URL,
          },
        });
        fs.writeFileSync(localPath, Buffer.from(response.data));
        console.log(`[UNEFABanner] Imagen carrusel guardada: ${localPath}`);
      }

      if (fs.existsSync(localPath)) {
        downloaded.push({
          src: `/uploads/unefa-banner/${localFilename}`,
          link: img.link,
          title: img.title,
        });
      }
    } catch (error: any) {
      console.warn(`[UNEFABanner] Error descargando imagen carrusel ${i + 1}: ${error.message}`);
      // Si falla la descarga, solo mantener si es HTTPS (para evitar Mixed Content)
      if (img.src.startsWith('https://')) {
        downloaded.push(img);
      }
    }
  }

  return downloaded;
}

/**
 * Limpia imágenes de carrusel antiguas del disco
 */
export function cleanOldCarouselImages(currentFilenames: string[]): void {
  try {
    ensureDir(BANNER_DIR);
    const files = fs.readdirSync(BANNER_DIR);
    const keepSet = new Set(currentFilenames);
    for (const file of files) {
      if (file.startsWith('carousel_') && !keepSet.has(file)) {
        const filePath = path.join(BANNER_DIR, file);
        fs.unlinkSync(filePath);
        console.log(`[UNEFABanner] Imagen carrusel antigua eliminada: ${file}`);
      }
    }
  } catch (error: any) {
    console.warn('[UNEFABanner] Error limpiando imágenes antiguas:', error.message);
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Inicia el scheduler que actualiza el banner cada N horas
 */
export function startBannerScheduler(): void {
  if (schedulerInterval) {
    console.warn('[UNEFABanner] Scheduler ya está corriendo');
    return;
  }

  console.log(`[UNEFABanner] Iniciando scheduler (cada ${SCRAPER_INTERVAL_HOURS} horas)`);

  // Ejecutar inmediatamente al inicio
  scrapeAndDownloadBanner().catch(err => {
    console.error('[UNEFABanner] Error en scraper inicial:', err);
  });

  // Programar ejecuciones periódicas
  schedulerInterval = setInterval(() => {
    scrapeAndDownloadBanner().catch(err => {
      console.error('[UNEFABanner] Error en scraper periódico:', err);
    });
  }, SCRAPER_INTERVAL_MS);
}

/**
 * Detiene el scheduler
 */
export function stopBannerScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[UNEFABanner] Scheduler detenido');
  }
}

/**
 * Obtiene la metadata actual del banner
 */
export function getBannerMeta(): BannerMeta {
  return readMeta();
}

/**
 * Obtiene la ruta del archivo de banner actual
 */
export function getBannerPath(): string | null {
  const meta = readMeta();
  if (meta.status === 'ok' && fs.existsSync(BANNER_PATH)) {
    return BANNER_PATH;
  }
  return null;
}
