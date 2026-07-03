// ============================================================================
// Tipos compartidos para el feature student-requests
// ============================================================================

/** Estados posibles de una solicitud */
export type RequestStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

/** Tipo de solicitud disponible */
export interface RequestType {
  id: number;
  name: string;
  description: string;
  isReassignment?: boolean;
  category?: string;
}

/** Datos de reasignación asociados a una solicitud */
export interface ReassignmentData {
  newTutorId?: number;
  newInstitutionId?: number;
  newCareerId?: number;
  reason: string;
  currentTutorName?: string;
  currentInstitutionName?: string;
  currentCareerName?: string;
}

/** Payload para crear una solicitud (estudiante) */
export interface CreateRequestPayload {
  typeId: number;
  subject: string;
  description: string;
  reassignmentData?: ReassignmentData;
}

/** Solicitud vista por el estudiante */
export interface StudentRequest {
  id: number;
  typeId: number;
  typeName: string;
  subject: string;
  description: string;
  status: RequestStatus;
  response: string | null;
  createdAt: string;
  processedAt: string | null;
}

/** Solicitud vista por el admin (con datos del estudiante) */
export interface AdminRequest {
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
  isReassignment?: boolean;
  reassignmentData?: {
    newTutorId?: number;
    newInstitutionId?: number;
    newCareerId?: number;
    reason?: string;
  };
}

/** Opción para selects de reasignación */
export interface ReassignmentOption {
  value: string;
  label: string;
}

/** Estadísticas del panel admin */
export interface RequestStats {
  total: number;
  pending: number;
  in_review: number;
  approved: number;
  rejected: number;
}

/** Metadatos de paginación */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Filtros para listar solicitudes (admin) */
export interface RequestFilters {
  status?: RequestStatus;
  typeId?: string;
  page?: number;
  limit?: number;
}

/** Payload para actualizar el estado de una solicitud (admin) */
export interface UpdateStatusPayload {
  status: string;
  response?: string;
  reassignmentData?: {
    newTutorId?: number;
    newInstitutionId?: number;
    newCareerId?: number;
    reason?: string;
  };
}
