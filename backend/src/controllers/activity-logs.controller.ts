import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';
import { sanitizeText } from '../utils/text-utils.js';
import { getPersonField, getPersonFullName } from '../utils/person-utils.js';

const TABLE_NAME = 't_activity_logs';

interface ActivityLog {
  ACTIVITY_LOG_ID: number;
  PROFESSIONAL_PRACTICE_ID: number;
  STUDENT_ID: number;
  ACTIVITY_DATE: string;
  WEEK_NUMBER: number;
  HOURS_WORKED: number;
  ACTIVITY_TYPE: string;
  ACTIVITY_DESCRIPTION: string;
  TASKS_COMPLETED: string;
  CHALLENGES: string;
  LEARNINGS: string;
  SUPERVISOR_COMMENTS: string;
  SUPERVISOR_APPROVED: boolean;
  SUPERVISOR_ID: number;
  APPROVED_AT: string;
  STATUS: number;
  CREATED_AT: string;
  UPDATED_AT: string;
  CREATED_BY: number;
}

interface ActivityLogResponse {
  success: boolean;
  data?: ActivityLog | ActivityLog[];
  message?: string;
}

export const getActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    const { practiceId, studentId, type, week, status } = req.query;

    let query = supabase
      .from(TABLE_NAME)
      .select(`
        *,
        t_persons!inner (
          ci,
          first_name,
          last_name
        ),
        t_professional_practices (
          START_DATE,
          END_DATE
        )
      `)
      .eq('STATUS', 1)
      .order('ACTIVITY_DATE', { ascending: false });

    if (practiceId) {
      query = query.eq('PROFESSIONAL_PRACTICE_ID', Number(practiceId));
    }
    if (studentId) {
      query = query.eq('STUDENT_ID', Number(studentId));
    }
    if (type) {
      query = query.eq('ACTIVITY_TYPE', type);
    }
    if (week) {
      query = query.eq('WEEK_NUMBER', Number(week));
    }
    if (status) {
      query = query.eq('SUPERVISOR_APPROVED', status === 'approved');
    }

    const { data, error } = await query;

    if (error) throw error;

    const logs = (data || []).map((log: any) => ({
      ...log,
      studentName: getPersonFullName(log.t_persons) || 'Sin estudiante',
      studentCi: getPersonField(log.t_persons, 'ci') || '',
      practiceStartDate: log.t_professional_practices?.START_DATE,
      practiceEndDate: log.t_professional_practices?.END_DATE
    }));

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('[ActivityLogs] Error fetching activity logs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener registros de actividad' 
    });
  }
};

export const getActivityLogById = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { id } = req.params;

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        t_persons!inner (
          ci,
          first_name,
          last_name
        )
      `)
      .eq('ACTIVITY_LOG_ID', Number(id))
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: 'Registro de actividad no encontrado' 
      });
    }

    res.json({ 
      success: true, 
      data: {
        ...data,
        studentName: getPersonFullName(data.t_persons) || 'Sin estudiante',
        studentCi: getPersonField(data.t_persons, 'ci') || ''
      }
    });
  } catch (error) {
    console.error('[ActivityLogs] Error fetching activity log:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener el registro de actividad' 
    });
  }
};

export const createActivityLog = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const userId = req.user?.userId;
    
    const {
      professionalPracticeId,
      studentId,
      activityDate,
      weekNumber,
      hoursWorked,
      activityType,
      activityDescription,
      tasksCompleted,
      challenges,
      learnings
    } = req.body;

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        PROFESSIONAL_PRACTICE_ID: professionalPracticeId,
        STUDENT_ID: studentId,
        ACTIVITY_DATE: activityDate,
        WEEK_NUMBER: weekNumber,
        HOURS_WORKED: hoursWorked,
        ACTIVITY_TYPE: sanitizeText(activityType) ?? '',
        ACTIVITY_DESCRIPTION: activityDescription,
        TASKS_COMPLETED: tasksCompleted,
        CHALLENGES: challenges,
        LEARNINGS: learnings,
        CREATED_BY: userId
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('[ActivityLogs] Error creating activity log:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear el registro de actividad' 
    });
  }
};

export const updateActivityLog = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { id } = req.params;
    
    const {
      activityDate,
      weekNumber,
      hoursWorked,
      activityType,
      activityDescription,
      tasksCompleted,
      challenges,
      learnings
    } = req.body;

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        ACTIVITY_DATE: activityDate,
        WEEK_NUMBER: weekNumber,
        HOURS_WORKED: hoursWorked,
        ACTIVITY_TYPE: sanitizeText(activityType) ?? '',
        ACTIVITY_DESCRIPTION: activityDescription,
        TASKS_COMPLETED: tasksCompleted,
        CHALLENGES: challenges,
        LEARNINGS: learnings,
        UPDATED_AT: new Date().toISOString()
      })
      .eq('ACTIVITY_LOG_ID', Number(id))
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('[ActivityLogs] Error updating activity log:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar el registro de actividad' 
    });
  }
};

export const deleteActivityLog = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { id } = req.params;

    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ STATUS: 0 })
      .eq('ACTIVITY_LOG_ID', Number(id));

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('[ActivityLogs] Error deleting activity log:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar el registro de actividad' 
    });
  }
};

export const approveActivityLog = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const userId = req.user?.userId;
    const { id } = req.params;
    const { comments } = req.body;

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        SUPERVISOR_APPROVED: true,
        SUPERVISOR_COMMENTS: comments,
        SUPERVISOR_ID: userId,
        APPROVED_AT: new Date().toISOString(),
        UPDATED_AT: new Date().toISOString()
      })
      .eq('ACTIVITY_LOG_ID', Number(id))
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('[ActivityLogs] Error approving activity log:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al aprobar el registro de actividad' 
    });
  }
};

export const getActivityStats = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();
    const { practiceId } = req.query;

    if (!practiceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de práctica requerido' 
      });
    }

    const { data: logs, error } = await supabase
      .from(TABLE_NAME)
      .select('HOURS_WORKED, WEEK_NUMBER, SUPERVISOR_APPROVED, ACTIVITY_TYPE')
      .eq('PROFESSIONAL_PRACTICE_ID', Number(practiceId))
      .eq('STATUS', 1);

    if (error) throw error;

    const totalHours = logs?.reduce((sum, log) => sum + (log.HOURS_WORKED || 0), 0) || 0;
    const approvedLogs = logs?.filter(log => log.SUPERVISOR_APPROVED).length || 0;
    const pendingLogs = (logs?.length || 0) - approvedLogs;
    const weeksSet = new Set(logs?.map(log => log.WEEK_NUMBER).filter((w): w is number => w !== null && w !== undefined));
    const weeks = Array.from(weeksSet);

    const hoursByWeek = weeks.map(week => ({
      week,
      hours: logs.filter(log => log.WEEK_NUMBER === week)
        .reduce((sum, log) => sum + (log.HOURS_WORKED || 0), 0)
    }));

    res.json({
      success: true,
      data: {
        totalHours,
        totalLogs: logs?.length || 0,
        approvedLogs,
        pendingLogs,
        weeksCount: weeks.length,
        hoursByWeek
      }
    });
  } catch (error) {
    console.error('[ActivityLogs] Error fetching activity stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas de actividad' 
    });
  }
};
