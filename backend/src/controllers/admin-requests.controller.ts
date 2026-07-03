import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate, auditUpdate, auditStatusChange } from '../utils/audit-helpers.js';
import { notificationService, notifyRequestCreated, notifyTutorAssigned } from '../services/notification.service.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';
import { getPersonField, getPersonFullName } from '../utils/person-utils.js';

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
    const { status, typeId, page: pageStr = '1', limit: limitStr = '20' } = req.query;
    const page = Math.max(1, parseInt(pageStr as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr as string, 10) || 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = dbManager.getConnection();

    // 1. Count total filtered records (include=true returns count alongside data when not using range)
    const countQuery = supabase
      .from('t_student_requests')
      .select('REQUEST_ID', { count: 'exact', head: true });

    if (status && status !== 'all') countQuery.eq('STATUS', status);
    if (typeId) countQuery.eq('REQUEST_TYPE_ID', typeId);

    const { count: totalFiltered, error: countError } = await countQuery;
    if (countError) throw countError;

    // 2. Fetch paginated data
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
        REASSIGNMENT_DATA,
        IS_REASSIGNMENT,
        CREATION_DATE,
        PROCESSED_AT,
        PROCESSED_BY,
        t_request_types (NAME, IS_REASSIGNMENT, CATEGORY),
        t_persons!inner (
          ci,
          first_name,
          last_name,
          email
        )
      `)
      .order('CREATION_DATE', { ascending: false })
      .range(from, to);

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
      studentCi: getPersonField(r.t_persons, 'ci') || '',
      studentName: getPersonFullName(r.t_persons),
      studentEmail: getPersonField(r.t_persons, 'email') || '',
      typeId: r.REQUEST_TYPE_ID,
      typeName: r.t_request_types?.NAME || '',
      subject: r.SUBJECT,
      description: r.DESCRIPTION,
      status: r.STATUS,
      response: r.RESPONSE,
      processedByName: null,
      createdAt: r.CREATION_DATE,
      processedAt: r.PROCESSED_AT,
      isReassignment: r.t_request_types?.IS_REASSIGNMENT === 1,
      reassignmentData: r.REASSIGNMENT_DATA
    }));

    const processedByUserIds = data
      ?.filter((r: any) => r.PROCESSED_BY)
      .map((r: any) => r.PROCESSED_BY) || [];

    if (processedByUserIds.length > 0) {
      const { data: users } = await supabase
        .from('t_user')
        .select('USER_ID, t_persons!inner(first_name, last_name)')
        .in('USER_ID', [...new Set(processedByUserIds)]);

      const userMap = new Map<number, string>((users || []).map((u: any) => [u.USER_ID, getPersonFullName(u.t_persons)]));

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

    // 3. Stats from all (unfiltered) for the stat cards
    const { data: allData } = await supabase
      .from('t_student_requests')
      .select('STATUS');

    const stats = {
      total: (allData || []).length,
      pending: (allData || []).filter(r => r.STATUS === 'pending').length,
      in_review: (allData || []).filter(r => r.STATUS === 'in_review').length,
      approved: (allData || []).filter(r => r.STATUS === 'approved').length,
      rejected: (allData || []).filter(r => r.STATUS === 'rejected').length
    };

    const totalPages = Math.ceil((totalFiltered || 0) / limit);

    res.json({
      success: true,
      data: requests,
      stats,
      pagination: {
        page,
        limit,
        total: totalFiltered || 0,
        totalPages
      }
    });

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
        CREATION_DATE,
        PROCESSED_AT,
        PROCESSED_BY,
        t_request_types (NAME, DESCRIPTION),
        t_persons!inner (
          ci,
          first_name,
          middle_name,
          last_name,
          second_last_name,
          email,
          phone
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
    const { status, response, reassignmentData } = req.body;
    const userId = req.user?.userId;
    const supabase = dbManager.getConnection();

    if (!['pending', 'in_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    // Obtener la solicitud actual
    const { data: currentRequest } = await supabase
      .from('t_student_requests')
      .select(`
        REQUEST_ID,
        STUDENT_ID,
        REQUEST_TYPE_ID,
        IS_REASSIGNMENT,
        t_request_types (NAME, IS_REASSIGNMENT, CATEGORY)
      `)
      .eq('REQUEST_ID', id)
      .single() as { data: any };

    if (!currentRequest) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }

    // Procesar reasignación si es aprobada
    let practiceData: any = null;
    if (status === 'approved' && reassignmentData) {
      const isReassignment = currentRequest.t_request_types?.IS_REASSIGNMENT === 1;
      
      if (isReassignment) {
        const { newTutorId, newInstitutionId, newCareerId, reason } = reassignmentData;
        const studentId = currentRequest.STUDENT_ID;

        // Obtener práctica activa del estudiante
        const { data: practice } = await supabase
          .from('t_professional_practices')
          .select('PROFESSIONAL_PRACTICE_ID')
          .eq('STUDENTS_ID', studentId)
          .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO) // Activa
          .single();

        practiceData = practice;
        
        if (practice) {
          const updatePractice: Record<string, unknown> = {
            UPDATED_AT: new Date().toISOString()
          };

          // Guardar valores anteriores para auditoría
          if (newTutorId) {
            const { data: currentTutor } = await supabase
              .from('t_professional_practices_tutor')
              .select('TUTOR_ID')
              .eq('PROFESSIONAL_PRACTICE_ID', practice.PROFESSIONAL_PRACTICE_ID)
              .single();
            
            if (currentTutor) {
              await supabase
                .from('t_student_requests')
                .update({ PREVIOUS_TUTOR_ID: currentTutor.TUTOR_ID })
                .eq('REQUEST_ID', id);
            }

            // Actualizar tutor
            await supabase
              .from('t_professional_practices_tutor')
              .update({ TUTOR_ID: newTutorId })
              .eq('PROFESSIONAL_PRACTICE_ID', practice.PROFESSIONAL_PRACTICE_ID);
          }

          if (newInstitutionId) {
            const { data: currentPractice } = await supabase
              .from('t_professional_practices')
              .select('INSTITUTION_ID')
              .eq('PROFESSIONAL_PRACTICE_ID', practice.PROFESSIONAL_PRACTICE_ID)
              .single();

            if (currentPractice) {
              await supabase
                .from('t_student_requests')
                .update({ PREVIOUS_INSTITUTION_ID: currentPractice.INSTITUTION_ID })
                .eq('REQUEST_ID', id);
            }

            updatePractice.INSTITUTION_ID = newInstitutionId;
          }

          if (newCareerId) {
            const { data: student } = await supabase
              .from('t_students')
              .select('CAREER_ID')
              .eq('STUDENTS_ID', studentId)
              .single();

            if (student) {
              await supabase
                .from('t_student_requests')
                .update({ PREVIOUS_CAREER_ID: student.CAREER_ID })
                .eq('REQUEST_ID', id);
            }

            // Actualizar carrera del estudiante
            await supabase
              .from('t_students')
              .update({ CAREER_ID: newCareerId })
              .eq('STUDENTS_ID', studentId);
          }

          await supabase
            .from('t_professional_practices')
            .update(updatePractice)
            .eq('PROFESSIONAL_PRACTICE_ID', practice.PROFESSIONAL_PRACTICE_ID);
        }
      }
    }

    const updateData: Record<string, unknown> = {
      STATUS: status,
      PROCESSED_BY: userId,
      PROCESSED_AT: new Date().toISOString()
    };

    if (response !== undefined) {
      updateData.RESPONSE = response;
    }

    if (reassignmentData) {
      updateData.REASSIGNMENT_DATA = reassignmentData;
    }

    const { error } = await supabase
      .from('t_student_requests')
      .update(updateData)
      .eq('REQUEST_ID', id);

    if (error) throw error;

    // Auditoría de cambio de estado
    try {
      await auditStatusChange(req, 't_student_requests', parseInt(id), 
        currentRequest.STATUS === 'pending' ? 0 : currentRequest.STATUS === 'in_review' ? 1 : 2,
        status === 'pending' ? 0 : status === 'in_review' ? 1 : status === 'approved' ? 2 : 3
      );

      // Notificación de tutor asignado si se aprobó una solicitud de reasignación
      if (status === 'approved' && reassignmentData && reassignmentData.newTutorId) {
        const { data: tutor } = await supabase
          .from('t_tutor')
          .select('t_user(USER_ID, person_id, t_persons!inner(first_name, last_name))')
          .eq('TUTOR_ID', reassignmentData.newTutorId)
          .single();
        
        const { data: studentData } = await supabase
          .from('t_students')
          .select('t_persons!inner(first_name, last_name)')
          .eq('STUDENTS_ID', currentRequest.STUDENT_ID)
          .single();

        if (tutor && studentData) {
          const tutorUser = (tutor as any).t_user;
          const tutorUserId = tutorUser?.USER_ID;
          await notifyTutorAssigned(
            getPersonFullName((tutorUser as any)?.t_persons),
            getPersonFullName((studentData as any).t_persons),
            practiceData?.PROFESSIONAL_PRACTICE_ID || 0,
            tutorUserId
          );
        }
      }
    } catch (auditError) {
      console.error('[Audit] Error auditing request update:', auditError);
    }

    // Notificar al estudiante sobre el cambio de estado
    try {
      const statusLabels: Record<string, string> = {
        approved: 'Aprobada',
        rejected: 'Rechazada',
        in_review: 'En Revisión'
      };

      if (status !== currentRequest.STATUS && statusLabels[status]) {
        const { data: studentUser } = await supabase
          .from('t_students')
          .select('USER_ID')
          .eq('STUDENTS_ID', currentRequest.STUDENT_ID)
          .single();

        if (studentUser?.USER_ID) {
          await notificationService.create({
            userId: studentUser.USER_ID,
            title: `Solicitud ${statusLabels[status]}`,
            message: `Tu solicitud "${currentRequest.t_request_types?.NAME || 'Sin tipo'}" fue ${statusLabels[status].toLowerCase()}${response ? '. Revisa la respuesta de Coordinación.' : '.'}`,
            type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
            relatedEntity: 'request',
            relatedEntityId: parseInt(id)
          });
        }
      }
    } catch (notifError) {
      console.error('[AdminRequests] Error notifying student:', notifError);
    }

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

    const types = (data || []).map((t: any) => ({
      id: t.REQUEST_TYPE_ID,
      name: t.NAME,
      description: t.DESCRIPTION,
      isActive: t.IS_ACTIVE,
      isReassignment: t.IS_REASSIGNMENT || false,
      category: t.CATEGORY || 'GENERAL'
    }));

    res.json({ success: true, data: types });

  } catch (error) {
    console.error('[AdminRequests] Error getting request types:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de solicitud'
    });
  }
};
