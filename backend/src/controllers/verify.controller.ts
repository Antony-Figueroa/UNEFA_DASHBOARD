import { Request, Response } from 'express';
import crypto from 'crypto';
import { dbManager } from '../lib/db-manager.js';

/**
 * POST /api/verify
 * Crea un registro de verificación para un documento PDF.
 * Devuelve el hash único que debe incluirse en el QR del PDF.
 */
export const createVerification = async (req: Request, res: Response) => {
  try {
    const { docType, title, metadata, createdBy } = req.body;

    if (!docType || !title) {
      return res.status(400).json({ message: 'docType y title son requeridos' });
    }

    const hash = crypto.createHash('sha256')
      .update(`${docType}:${title}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`)
      .digest('hex')
      .substring(0, 16);

    const supabase = dbManager.getConnection();
    const { data, error } = await supabase
      .from('t_document_verification')
      .insert({
        hash,
        doc_type: docType,
        title,
        metadata: metadata || {},
        created_by: createdBy || null,
      })
      .select('hash')
      .single();

    if (error) {
      console.error('[Verify] Error creating verification:', error);
      return res.status(500).json({ message: 'Error al crear verificación' });
    }

    return res.status(201).json({ hash: data.hash });
  } catch (error) {
    console.error('[Verify] Error:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/verify/:hash
 * Consulta un registro de verificación por su hash.
 * Pública — cualquiera puede verificar un documento.
 */
export const getVerification = async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;

    if (!hash || hash.length < 8) {
      return res.status(400).json({ 
        valid: false,
        message: 'Hash inválido' 
      });
    }

    const supabase = dbManager.getConnection();
    const { data, error } = await supabase
      .from('t_document_verification')
      .select('*')
      .eq('hash', hash)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(200).json({
          valid: false,
          message: 'Documento no encontrado. El código de verificación no existe o ha sido eliminado.',
        });
      }
      console.error('[Verify] Error querying verification:', error);
      return res.status(500).json({ message: 'Error al verificar documento' });
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (now > expiresAt) {
      return res.status(200).json({
        valid: false,
        message: 'Este documento ha expirado.',
        expired: true,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      });
    }

    return res.status(200).json({
      valid: true,
      message: 'Documento verificado correctamente. Este documento fue generado por el sistema oficial de la Coordinación de Prácticas Profesionales de la UNEFA.',
      hash: data.hash,
      docType: data.doc_type,
      title: data.title,
      metadata: data.metadata,
      createdBy: data.created_by,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error('[Verify] Error:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
