import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sanitizeText } from '../utils/text-utils.js';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const DOCUMENT_TYPES = [
  { value: 'carta_aceptacion', label: 'Carta de Aceptacion' },
  { value: 'informe_mensual', label: 'Informe Mensual' },
  { value: 'informe_final', label: 'Informe Final' },
  { value: 'constancia', label: 'Constancia' },
  { value: 'carta_culminacion', label: 'Carta de Culminacion' },
  { value: 'otro', label: 'Otro' }
];

interface DocumentDB {
  DOCUMENT_ID: number;
  STUDENT_ID: number;
  DOCUMENT_TYPE: string;
  TITLE: string;
  DESCRIPTION: string | null;
  FILE_NAME: string;
  FILE_PATH: string;
  FILE_SIZE: number | null;
  FILE_TYPE: string | null;
  STATUS: string;
  REJECTION_REASON: string | null;
  UPLOADED_AT: string;
  REVIEWED_AT: string | null;
  REVIEWED_BY: number | null;
}

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    const { data: student } = await supabase
      .from('t_students')
      .select('STUDENTS_ID')
      .eq('USER_ID', userId)
      .single();

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estudiante no encontrado' 
      });
    }

    const { data, error } = await supabase
      .from('t_student_documents')
      .select('*')
      .eq('STUDENT_ID', student.STUDENTS_ID)
      .eq('STATUS_TABLE', 1)
      .order('UPLOADED_AT', { ascending: false });

    if (error) throw error;

    const documents = (data || []).map((d: DocumentDB) => ({
      id: d.DOCUMENT_ID,
      type: d.DOCUMENT_TYPE,
      title: d.TITLE,
      description: d.DESCRIPTION,
      fileName: d.FILE_NAME,
      filePath: d.FILE_PATH,
      fileSize: d.FILE_SIZE,
      fileType: d.FILE_TYPE,
      status: d.STATUS,
      rejectionReason: d.REJECTION_REASON,
      uploadedAt: d.UPLOADED_AT,
      reviewedAt: d.REVIEWED_AT
    }));

    res.json({ success: true, data: documents });

  } catch (error) {
    console.error('[Documents] Error getting documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos'
    });
  }
};

export const getDocumentTypes = async (req: Request, res: Response) => {
  res.json({ success: true, data: DOCUMENT_TYPES });
};

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { documentType, title, description } = req.body;
    const file = (req as MulterRequest).file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado archivo'
      });
    }

    if (!documentType || !title) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de documento y titulo son requeridos'
      });
    }

    const supabase = dbManager.getConnection();

    const { data: student } = await supabase
      .from('t_students')
      .select('STUDENTS_ID')
      .eq('USER_ID', userId)
      .single();

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estudiante no encontrado' 
      });
    }

    const filePath = `documents/${student.STUDENTS_ID}/${Date.now()}_${file.originalname}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from('student-documents')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (storageError) {
      console.error('[Documents] Storage error:', storageError);
      return res.status(500).json({
        success: false,
        message: 'Error al subir archivo'
      });
    }

    const { data, error } = await supabase
      .from('t_student_documents')
      .insert({
        STUDENT_ID: student.STUDENTS_ID,
        DOCUMENT_TYPE: documentType,
        TITLE: sanitizeText(title) ?? '',
        DESCRIPTION: description || null,
        FILE_NAME: file.originalname,
        FILE_PATH: storageData.path,
        FILE_SIZE: file.size,
        FILE_TYPE: file.mimetype,
        STATUS: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Documento subido exitosamente',
      data: { id: data.DOCUMENT_ID }
    });

  } catch (error) {
    console.error('[Documents] Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir documento'
    });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const supabase = dbManager.getConnection();

    const { data: student } = await supabase
      .from('t_students')
      .select('STUDENTS_ID')
      .eq('USER_ID', userId)
      .single();

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Estudiante no encontrado' 
      });
    }

    const { data: doc, error: fetchError } = await supabase
      .from('t_student_documents')
      .select('FILE_PATH, STATUS')
      .eq('DOCUMENT_ID', id)
      .eq('STUDENT_ID', student.STUDENTS_ID)
      .single();

    if (fetchError || !doc) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    if (doc.STATUS === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un documento aprobado'
      });
    }

    await supabase.storage
      .from('student-documents')
      .remove([doc.FILE_PATH]);

    const { error } = await supabase
      .from('t_student_documents')
      .delete()
      .eq('DOCUMENT_ID', id)
      .eq('STUDENT_ID', student.STUDENTS_ID);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });

  } catch (error) {
    console.error('[Documents] Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar documento'
    });
  }
};
