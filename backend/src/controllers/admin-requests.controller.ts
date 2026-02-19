import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

interface AdminRequest {
  id: number;
  studentId: number;
  studentCi: string;
  studentName: string;
  studentEmail: string;
  typeId: number;
  typeName: string;
  subject: string;
  description: string;
  status: string;
  response: string | null;
  processedByName: string | null;
  createdAt: string;
  processedAt: string | null;
}

export const getAllRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, typeId, page = 1, limit = 20 } = req.query;
    const supabase = dbManager.getConnection();

    let query = supabase
      .from('t_student_requests')
      .select(`
        REQUEST_ID,
        STUDENT_ID,
        REQUEST_TYPE_ID,
        SUBJECT,
        DESCRIPTION,
        STATUS,
        RESPONSE,
        CREATED_AT,
        PROCESSED_AT,
        PROCESSED_BY,
        t_request_types (NAME),
        t_students (
          STUDENTS_CI,
          NAME,
          SURNAME,
          EMAIL
        )
      `)
      .order('CREATED_AT', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('STATUS', status);
    }
    if (typeId) {
      query = query.eq('REQUEST_TYPE_ID', typeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    let requests: AdminRequest[] = (data || []).map((r: any) => ({
      id: r.REQUEST_ID,
      studentId: r.STUDENT_ID,
      studentCi: r.t_students?.STUDENTS_CI || '',
      studentName: `${r.t_students?.NAME || ''} ${r.t_students?.SURNAME || ''}`.trim(),
      studentEmail: r.t_students?.EMAIL || '',
      typeId: r.REQUEST_TYPE_ID,
      typeName: r.t_request_types?.NAME || '',
      subject: r.SUBJECT,
      description: r.DESCRIPTION,
      status: r.STATUS,
      response: r.RESPONSE,
      processedByName: null,
      createdAt: r.CREATED_AT,
      processedAt: r.PROCESSED_AT
    }));

    const processedByUserIds = data
      ?.filter((r: any) => r.PROCESSED_BY)
      .map((r: any) => r.PROCESSED_BY) || [];

    if (processedByUserIds.length > 0) {
      const { data: users } = await supabase
        .from('t_user')
        .select('USER_ID, NAME, SURNAME')
        .in('USER_ID', [...new Set(processedByUserIds)]);

      const userMap = new Map((users || []).map((u: any) => [u.USER_ID, `${u.NAME} ${u.SURNAME}`.trim()]));

      requests = requests.map(r => {
        const requestData = data?.find((d: any) => d.REQUEST_ID === r.id);
        const processedBy = requestData?.PROCESSED_BY;
        return {
          ...r,
          processedByName: r.processedAt && processedBy
            ? userMap.get(processedBy) || null
            : null
        };
      });
    }

    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      in_review: requests.filter(r => r.status === 'in_review').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };

    res.json({ success: true, data: requests, stats });

  } catch (error) {
    console.error('[AdminRequests] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes'
    });
  }
};

export const getRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = dbManager.getConnection();

    const { data, error } = await supabase
      .from('t_student_requests')
      .select(`
        REQUEST_ID,
        STUDENT_ID,
        REQUEST_TYPE_ID,
        SUBJECT,
        DESCRIPTION,
        STATUS,
        RESPONSE,
        CREATED_AT,
        PROCESSED_AT,
        PROCESSED_BY,
        t_request_types (NAME, DESCRIPTION),
        t_students (
          STUDENTS_CI,
          NAME,
          SECOND_NAME,
          SURNAME,
          SECOND_SURNAME,
          EMAIL,
          CONTACT_PHONE
        )
      `)
      .eq('REQUEST_ID', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        message: 'Solicitud no encontrada' 
      });
    }

    res.json({ success: true, data });

  } catch (error) {
    console.error('[AdminRequests] Error getting request:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitud'
    });
  }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    if (!['pending', 'in_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const updateData: any = {
      STATUS: status,
      PROCESSED_BY: userId,
      PROCESSED_AT: new Date().toISOString()
    };

    if (response !== undefined) {
      updateData.RESPONSE = response;
    }

    const { error } = await supabase
      .from('t_student_requests')
      .update(updateData)
      .eq('REQUEST_ID', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Solicitud actualizada exitosamente'
    });

  } catch (error) {
    console.error('[AdminRequests] Error updating request:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar solicitud'
    });
  }
};

export const getRequestTypes = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    const { data, error } = await supabase
      .from('t_request_types')
      .select('*')
      .order('NAME');

    if (error) throw error;

    res.json({ success: true, data });

  } catch (error) {
    console.error('[AdminRequests] Error getting request types:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de solicitud'
    });
  }
};
