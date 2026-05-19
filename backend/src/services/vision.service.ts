/**
 * Vision Service - Análisis de imágenes y documentos con Groq Vision
 *
 * Modelos soportados:
 * - llama-3.2-90b-vision-preview (recomendado)
 * - llava-v1.5-7b-4096-preview
 */

import { Groq } from 'groq-sdk';
import { GroqAPIError } from './groq-ai.service.js';

// ============================================
// Configuration
// ============================================

const apiKey = process.env.GROQ_API_KEY || '';
const VISION_MODEL = process.env.GROQ_VISION_MODEL || 'llama-3.2-90b-vision-preview';

const client = new Groq({
  apiKey,
  dangerouslyAllowBrowser: false,
  timeout: 60000,
});

console.log(`[Vision] Initialized with model: ${VISION_MODEL}`);

// ============================================
// Types
// ============================================

export interface VisionRequest {
  /** Imagen en formato base64 (data:image/...) o URL */
  image: string;
  /** Prompt para analizar la imagen */
  prompt: string;
  /** Tipo de contenido (auto-detectado si no se especifica) */
  mimeType?: string;
}

export interface VisionResult {
  success: boolean;
  analysis?: string;
  error?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Detecta el tipo MIME y convierte a formato data URL
 */
const processImage = (buffer: Buffer, mimeType: string): string => {
  const base64 = buffer.toString('base64');
  // Convertir a formato data URL
  return `data:${mimeType};base64,${base64}`;
};

/**
 * Analiza una imagen con Groq Vision
 */
export const analyzeImage = async (request: VisionRequest): Promise<VisionResult> => {
  try {
    const { image, prompt, mimeType } = request;

    // Construir el mensaje con contenido multimodal
    const content: any[] = [];

    // Agregar la imagen
    if (image.startsWith('data:') || image.startsWith('http')) {
      // Ya es data URL o URL directa
      content.push({
        type: 'image_url',
        image_url: { url: image },
      });
    } else {
      // Es base64 sin formato
      const processedMime = mimeType || 'image/jpeg';
      content.push({
        type: 'image_url',
        image_url: { url: `data:${processedMime};base64,${image}` },
      });
    }

    // Agregar el texto del prompt
    content.push({
      type: 'text',
      text: prompt,
    });

    const completion = await client.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
      max_tokens: 2048,
      temperature: 0.3,
    });

    const analysis = completion.choices[0]?.message?.content;

    if (!analysis) {
      return {
        success: false,
        error: 'No se recibió análisis de la imagen',
      };
    }

    console.log(`[Vision] Analysis completed, length: ${analysis.length} chars`);

    return {
      success: true,
      analysis,
    };
  } catch (error: any) {
    console.error('[Vision] Error:', error.message);

    if (error instanceof Groq.APIConnectionError) {
      return { success: false, error: 'Error de conexión. Verifica tu internet.' };
    }

    if (error instanceof Groq.RateLimitError) {
      return { success: false, error: 'Límite de requests alcanzado. Intenta más tarde.' };
    }

    return {
      success: false,
      error: error.message || 'Error al analizar la imagen',
    };
  }
};

/**
 * Analiza un documento (PDF) - versión básica
 * Nota: Groq no soporta PDF directamente, se necesitaría convertir a imágenes
 * Por ahora retorna un mensaje de que no está soportado
 */
export const analyzeDocument = async (buffer: Buffer, mimeType: string): Promise<VisionResult> => {
  // Groq actualmente no soporta PDFs directamente
  // Se necesitaría usar una herramienta como pdf2pic para convertir
  return {
    success: false,
    error: 'El análisis de documentos PDF aún no está soportado. Puedes subir imágenes para análisis.',
  };
};

/**
 * Analiza un archivo (detecta el tipo y usa el servicio apropiado)
 */
export const analyzeFile = async (
  buffer: Buffer,
  mimeType: string,
  prompt?: string
): Promise<VisionResult> => {
  const defaultPrompt = prompt || 'Describe esta imagen detalladamente. ¿Qué información contiene? ¿Es relevante para un sistema de gestión académica?';

  // Detectar tipo de archivo
  if (mimeType.startsWith('image/')) {
    const imageData = processImage(buffer, mimeType);
    return analyzeImage({
      image: imageData,
      prompt: defaultPrompt,
      mimeType,
    });
  }

  if (mimeType === 'application/pdf') {
    return analyzeDocument(buffer, mimeType);
  }

  // Otros tipos no soportados
  return {
    success: false,
    error: `Tipo de archivo no soportado: ${mimeType}. Solo se admiten imágenes (JPG, PNG, GIF, WebP).`,
  };
};

export default {
  analyzeImage,
  analyzeDocument,
  analyzeFile,
};