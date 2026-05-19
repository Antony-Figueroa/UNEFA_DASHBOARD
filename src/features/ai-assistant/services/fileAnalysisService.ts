/**
 * File Analysis Service - Análisis de archivos subidos al chat
 *
 * Endpoints:
 * - POST /api/ai/analyze - Analiza imagen/documento con Groq Vision
 */

import apiClient from '../../../api/apiClient';

// ============================================
// Types
// ============================================

export interface FileAnalysisResult {
  success: boolean;
  analysis?: string;
  file?: {
    name: string;
    type: string;
    size: number;
  };
  error?: string;
}

// ============================================
// Service Functions
// ============================================

/**
 * Analiza un archivo (imagen) con Groq Vision
 */
export const analyzeFile = async (
  file: File,
  prompt?: string
): Promise<FileAnalysisResult> => {
  try {
    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', file);

    if (prompt) {
      formData.append('prompt', prompt);
    }

    const response = await apiClient.post<FileAnalysisResult>(
      '/ai/analyze',
      formData, // Enviar como FormData, no JSON
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 segundos para análisis de imagen
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('[FileAnalysis] Error:', error);

    if (error.response?.data?.message) {
      return {
        success: false,
        error: error.response.data.message,
      };
    }

    if (error.name === 'TimeoutError' || error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'El análisis tardó demasiado. Intenta con una imagen más pequeña.',
      };
    }

    return {
      success: false,
      error: error.message || 'Error al analizar el archivo',
    };
  }
};

/**
 * Valida que un archivo sea aceptable para upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Tamaño máximo: 5MB
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'El archivo es muy grande. Máximo 5MB.' };
  }

  // Tipos permitidos
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no permitido. Solo imágenes (JPG, PNG, GIF, WebP) y PDF.' };
  }

  return { valid: true };
};

/**
 * Obtiene el tamaño en formato legible
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default {
  analyzeFile,
  validateFile,
  formatFileSize,
};