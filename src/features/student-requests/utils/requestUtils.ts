import type { RequestStatus } from '../types';

/** Colores para Badge según el estado de la solicitud */
export const STATUS_COLORS: Record<RequestStatus, 'success' | 'warning' | 'info' | 'error' | 'light'> = {
  pending: 'warning',
  in_review: 'info',
  approved: 'success',
  rejected: 'error'
};

/** Etiquetas en español para cada estado */
export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pendiente',
  in_review: 'En Revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada'
};

/** Opciones para el select de estado (admin) */
export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_review', label: 'En Revisión' },
  { value: 'approved', label: 'Aprobada' },
  { value: 'rejected', label: 'Rechazada' }
] as const;

/** Formatea una fecha ISO a locale es-VE */
export const formatRequestDate = (date: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-VE');
};
