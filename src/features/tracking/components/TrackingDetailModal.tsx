/**
 * @file TrackingDetailModal.tsx
 * @description Modal para visualizar los detalles completos de un seguimiento,
 * incluyendo información del estudiante, datos del seguimiento y visitas realizadas.
 * Sigue el patrón visual de EnrollmentViewModal.
 */

import { useState, useEffect, useMemo } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { ModalSectionHeader } from "../../../components/ui/modal/ModalSectionHeader";
import Button from "../../../components/ui/button/Button";

import Badge from "../../../components/ui/badge/Badge";
import { toTitleCase } from "../../../utils/textFormat";
import { Tracking } from "../types";
import { Visit } from "../../visits/types";
import { visitsService } from "../../visits/services/visitsService";
import { getTrackingById, TrackingDetailDTO } from "../services/trackingService";

interface TrackingDetailModalProps {
  /** Indica si el modal está visible */
  isOpen: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Función para abrir el modal de edición */
  onEdit?: (tracking: Tracking) => void;
  /** Datos del seguimiento a visualizar */
  tracking: Tracking | null;
}

/**
 * Formatea una fecha ISO a DD/MM/AAAA HH:mm.
 */
const formatDateTime = (iso: string): string => {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

/**
 * Formatea una fecha ISO a DD/MM/AAAA.
 */
const formatDate = (iso: string): string => {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

/**
 * Obtiene el color del badge según el tipo de visita.
 */
const getVisitTypeColor = (type: string): "primary" | "success" | "warning" | "info" => {
  const upper = type.toUpperCase();
  if (upper.includes("PRESENCIAL")) return "primary";
  if (upper.includes("VIRTUAL")) return "info";
  if (upper.includes("TELEFONICA")) return "warning";
  return "primary";
};

/**
 * Modal para visualizar los detalles completos de un seguimiento de estudiante.
 *
 * Organiza la información en secciones:
 * - Información del Estudiante
 * - Datos del Seguimiento
 * - Visitas Realizadas
 */
export default function TrackingDetailModal({
  isOpen,
  onClose,
  onEdit,
  tracking,
}: TrackingDetailModalProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [detail, setDetail] = useState<TrackingDetailDTO | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [visitsTab, setVisitsTab] = useState<'active' | 'inactive'>('active');

  // Cargar detalles completos y visitas cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !tracking?.trackingId) {
      setVisits([]);
      setDetail(null);
      return;
    }

    const loadData = async () => {
      setDetailLoading(true);
      setVisitsLoading(true);

      try {
        const [detailData, visitsResponse] = await Promise.all([
          getTrackingById(tracking.trackingId),
          visitsService.getVisitsByPractice(Number(tracking.trackingId), true),
        ]);
        setDetail(detailData);
        setVisits(visitsResponse.data || []);
      } catch (error) {
        console.error("[TrackingDetailModal] Error al cargar datos:", error);
        setVisits([]);
      } finally {
        setDetailLoading(false);
        setVisitsLoading(false);
      }
    };

    loadData();
  }, [isOpen, tracking?.trackingId]);

  // Filtrar visitas según la pestaña activa
  const filteredVisits = useMemo(() => {
    return visits.filter(v => visitsTab === 'active' ? v.status : !v.status);
  }, [visits, visitsTab]);

  // Restaurar una visita eliminada
  const handleRestoreVisit = async (visitId: number) => {
    try {
      await visitsService.restoreVisit(visitId);
      setVisits(prev => prev.map(v => v.visitId === visitId ? { ...v, status: true } : v));
    } catch (error) {
      console.error("[TrackingDetailModal] Error al restaurar visita:", error);
    }
  };

  if (!tracking) return null;

  const display = detail || tracking;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" showCloseButton>
      <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">
        Detalles del Seguimiento
      </ModalHeader>
      <ModalBody className="overflow-y-auto custom-scrollbar grow px-6 sm:px-12 py-8">
        <div className="space-y-10 max-w-5xl mx-auto py-2">
          {/* Sección: Información del Estudiante */}
          <div className="space-y-4">
            <ModalSectionHeader color="blue-500">
              Información del Estudiante
            </ModalSectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                  Nombre Completo
                </label>
                <p className="text-sm font-semibold text-text-primary dark:text-white/90">
                  {tracking.studentName}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                  Cédula / ID
                </label>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {tracking.studentIdNumber}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                  Carrera
                </label>
                <p className="text-sm font-bold text-text-primary dark:text-white/90">
                  {tracking.careerName || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Sección: Datos del Seguimiento */}
          <div className="space-y-4">
            <ModalSectionHeader color="brand-500">
              Datos del Seguimiento
            </ModalSectionHeader>
            {detailLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                <span className="ml-3 text-sm text-text-secondary">
                  Cargando detalles...
                </span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                      Título del Informe
                    </label>
                    <p className="text-sm font-semibold text-text-primary dark:text-white/90">
                      {toTitleCase(tracking.reportTitle)}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                      Institución
                    </label>
                    <p className="text-sm font-semibold text-text-primary dark:text-white/90">
                      {'institutionName' in display ? (display as TrackingDetailDTO).institutionName || "—" : "—"}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                      Período
                    </label>
                    <p className="text-sm font-semibold text-text-primary dark:text-white/90">
                      {'periodDescription' in display && (display as TrackingDetailDTO).periodDescription
                        ? (display as TrackingDetailDTO).periodDescription
                        : "—"}
                    </p>
                    {'periodStartDate' in display && (display as TrackingDetailDTO).periodStartDate && (
                      <p className="text-[11px] text-text-secondary dark:text-text-tertiary mt-0.5">
                        {formatDate((display as TrackingDetailDTO).periodStartDate!)} - {formatDate((display as TrackingDetailDTO).periodEndDate || (display as TrackingDetailDTO).periodStartDate!)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                      Traslado
                    </label>
                    <p className="text-sm font-bold text-text-primary dark:text-white/90">
                      {tracking.transfer ? "Sí" : "No"}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                      Recorrido
                    </label>
                    <p className="text-sm font-bold text-text-primary dark:text-white/90">
                      {tracking.route || "—"}
                    </p>
                  </div>
                </div>

                {/* Tutores Asignados */}
                {'assignedTutors' in display && (display as TrackingDetailDTO).assignedTutors.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-2">
                    {(display as TrackingDetailDTO).assignedTutors.map((tutor) => (
                      <div
                        key={tutor.tutorId}
                        className="flex items-center gap-3 rounded-lg bg-bg-secondary/50 dark:bg-white/3 px-4 py-3"
                      >
                        <Badge
                          color={tutor.tutorType === 'METODOLOGICO' ? 'info' : 'primary'}
                          variant="light"
                        >
                          {tutor.tutorType === 'METODOLOGICO' ? 'Metodológico' : 'Académico'}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-text-primary dark:text-white/90 truncate">
                            {tutor.tutorName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                    Observaciones
                  </label>
                  <p className="text-sm text-text-primary dark:text-white/90">
                    {tracking.observations || "Sin observaciones"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Estado y Fechas */}
          <div className="rounded-xl bg-bg-secondary dark:bg-white/3 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                Estado
              </label>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  tracking.status
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {tracking.status ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                Fecha de Creación
              </label>
              <p className="text-[11px] text-text-secondary dark:text-text-tertiary font-medium">
                {'creationDate' in display && typeof display.creationDate === 'string'
                  ? formatDate(display.creationDate)
                  : tracking.creationDate instanceof Date
                    ? tracking.creationDate.toLocaleDateString("es-VE")
                    : String(tracking.creationDate)}
              </p>
            </div>
          </div>

          {/* Sección: Visitas Realizadas */}
          <div className="space-y-4">
            <ModalSectionHeader color="purple-500">
              Visitas Realizadas
            </ModalSectionHeader>

            {/* Tabs Activas / Eliminadas */}
            {!visitsLoading && visits.length > 0 && (
              <div className="flex gap-1 rounded-lg bg-bg-secondary dark:bg-white/5 p-0.5 w-fit">
                <button
                  onClick={() => setVisitsTab('active')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    visitsTab === 'active'
                      ? 'bg-white dark:bg-white/10 text-text-primary shadow-sm'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  Activas ({visits.filter(v => v.status).length})
                </button>
                <button
                  onClick={() => setVisitsTab('inactive')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    visitsTab === 'inactive'
                      ? 'bg-white dark:bg-white/10 text-text-primary shadow-sm'
                      : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  Inactivas ({visits.filter(v => !v.status).length})
                </button>
              </div>
            )}

            {visitsLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                <span className="ml-3 text-sm text-text-secondary">
                  Cargando visitas...
                </span>
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-medium text-text-secondary">
                  {visitsTab === 'active'
                    ? 'No hay visitas activas para este seguimiento'
                    : 'No hay visitas inactivas para este seguimiento'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-light dark:border-white/5">
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                        Fecha
                      </th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                        Tipo
                      </th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                        Tutor
                      </th>
                      <th className="text-center py-2 px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                        Horas
                      </th>
                      <th className="text-left py-2 px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                        Actividades
                      </th>
                      {visitsTab === 'inactive' && (
                        <th className="text-center py-2 px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                          Acción
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-white/5">
                    {filteredVisits.map((visit) => (
                      <tr
                        key={visit.visitId}
                        className={`transition-colors ${
                          visitsTab === 'inactive'
                            ? 'bg-red-50/30 dark:bg-red-900/5 hover:bg-red-50/60 dark:hover:bg-red-900/10'
                            : 'hover:bg-bg-secondary/50'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-xs font-medium text-text-primary">
                          {formatDateTime(visit.visitDate)}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge color={getVisitTypeColor(visit.visitType)}>
                            {visit.visitType}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">
                          {visit.tutorName}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-center font-semibold text-text-primary">
                          {visit.hoursWorked}h
                        </td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary max-w-[200px] truncate">
                          {visit.activitiesPerformed}
                        </td>
                        {visitsTab === 'inactive' && (
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleRestoreVisit(visit.visitId)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-md transition-colors"
                            >
                              Restaurar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </ModalBody>
      <ModalFooter className="shrink-0">
        <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
          Cerrar
        </Button>
        {onEdit && (
          <Button
            onClick={() => {
              onEdit(tracking);
              onClose();
            }}
            className="flex-1 sm:flex-none"
          >
            Editar Información
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
