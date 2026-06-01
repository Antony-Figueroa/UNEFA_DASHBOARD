export type ReminderType = 'pending_evaluation' | 'upcoming_visit' | 'overdue_report' | 'pending_document';

export type TargetRoleName = 'all' | 'admin' | 'asistente' | 'tutor' | 'estudiante';

export interface ReminderRule {
  id: string;
  type: ReminderType;
  name: string;
  description: string;
  active: boolean;
  daysThreshold: number | null;
  targetRoleName: TargetRoleName;
  templateTitle: string;
  templateMessage: string;
  createdAt: string;
  updatedAt: string;
}

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  pending_evaluation: 'Evaluaciones Pendientes',
  upcoming_visit: 'Visitas Próximas',
  overdue_report: 'Bitácora Vencida',
  pending_document: 'Documentos Pendientes',
};

export const REMINDER_TYPE_DESCRIPTIONS: Record<ReminderType, string> = {
  pending_evaluation: 'Notifica a tutores sobre evaluaciones sin calificar',
  upcoming_visit: 'Recuerda a tutores sobre visitas programadas',
  overdue_report: 'Notifica a estudiantes sin actividad reciente',
  pending_document: 'Recuerda a estudiantes sobre documentos pendientes',
};

export const REMINDER_TYPE_ICONS: Record<ReminderType, string> = {
  pending_evaluation: '📋',
  upcoming_visit: '📅',
  overdue_report: '⚠️',
  pending_document: '📄',
};

export const TARGET_ROLE_LABELS: Record<TargetRoleName, string> = {
  all: 'Todos',
  admin: 'Administradores',
  asistente: 'Asistentes',
  tutor: 'Tutores',
  estudiante: 'Estudiantes',
};
