import { useState, useEffect, useMemo } from "react";
import toast from 'react-hot-toast';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Pagination,
} from "../../components/ui/table";
import { EmptyState } from "../../components/ui/table/EmptyState";
import { TableSkeleton } from "../../components/ui/skeleton";
import { Modal, ModalBody, ModalHeader } from "../../components/ui/modal";
import InputField from "../../components/form/input/InputField";
import CustomSelect from "../../components/form/CustomSelect";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { DownloadIcon, CheckCircleIcon, EyeIcon, UserIcon, TimeIcon } from "../../icons";
import { culminationService, CulminationGroup, CulminationPractice, CulminationMeta } from "../../features/culmination/services/culminationService";
import Label from "../../components/form/Label";
import { generateCertificatePDF } from "../../components/ui/pdf/templates/CertificatePDF";
import { useToast } from "../../context/toast";
import { TOAST } from "../../components/ui/dialog/DialogConfig";
import { matchSearch } from "../../utils/searchNormalizer";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  certified: "Certificado",
};

const BADGE_COLORS: Record<string, "warning" | "primary" | "success"> = {
  pending: "warning",
  approved: "primary",
  certified: "success",
};

export default function CulminationPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CulminationGroup[]>([]);
  const [meta, setMeta] = useState<CulminationMeta>({ total: 0, completed: 0, inProgress: 0 });

  const [selectedGroup, setSelectedGroup] = useState<CulminationGroup | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await culminationService.getAll({
        status: statusFilter || undefined,
        period: periodFilter || undefined,
        search: searchTerm || undefined,
      });

      if (response.success) {
        setData(response.data);
        setMeta(response.meta);
      }
    } catch (error) {
      console.error("Error fetching culmination data:", error);
      addToast(TOAST.loadError());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, periodFilter]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(
      (group) =>
        matchSearch(group.studentName, searchTerm) ||
        matchSearch(group.studentCi, searchTerm)
    );
  }, [data, searchTerm]);

  const periodOptions = useMemo(() => {
    const periods = [...new Set(data.map((g) => g.period))];
    return [
      { value: "", label: "Todos los períodos" },
      ...periods.map((p) => ({ value: p, label: p })),
    ];
  }, [data]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPeriodFilter("");
    setCurrentPage(1);
  };

  // --- Action handlers ---

  const handleApprove = (practice: CulminationPractice, group: CulminationGroup) => {
    setConfirmDialog({
      isOpen: true,
      title: "Aprobar Culminación",
      message: `¿Está seguro de aprobar la culminación de prácticas de ${group.studentName} (${practice.practiceType})?`,
      onConfirm: async () => {
        try {
          await culminationService.approve(practice.id);
          addToast(TOAST.created('Culminación'));
          fetchData();
        } catch (error: any) {
          const serverMsg = error?.response?.data?.message;
          addToast(serverMsg ? { ...TOAST.updateError('culminación'), message: serverMsg } : TOAST.updateError('culminación'));
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleGenerateCertificate = (practice: CulminationPractice, group: CulminationGroup) => {
    setConfirmDialog({
      isOpen: true,
      title: "Generar Certificado",
      message: `¿Desea generar el certificado de prácticas para ${group.studentName} (${practice.practiceType})?`,
      onConfirm: async () => {
        try {
          const response = await culminationService.generateCertificate(practice.id);
          if (response.success) {
            addToast({ variant: "success", title: "Certificado generado", message: `Certificado generado: ${response.certificate.number}.` });
            fetchData();
          }
        } catch (error) {
          addToast(TOAST.createError('certificado'));
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleDownloadPdf = async (practice: CulminationPractice, group: CulminationGroup) => {
    try {
      toast.loading("Generando PDF...", { id: "pdf-download" });

      const pdfRecord = {
        id: practice.id,
        studentCi: group.studentCi,
        studentName: group.studentName,
        careerId: 0,
        careerName: group.careerName,
        institutionId: 0,
        institutionName: practice.institutionName,
        period: group.period,
        practiceType: practice.practiceType,
        startDate: "",
        endDate: "",
        totalHours: practice.totalHours,
        status: (practice.culminationStatus === "certified" ? "certified" : "approved") as "approved" | "certified",
        certificateNumber: practice.certificateNumber,
        certifiedAt: practice.certifiedAt,
      };

      const blob = await generateCertificatePDF(pdfRecord, practice.certificateNumber || "N/A");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Certificado_${group.studentName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({ variant: "success", title: "PDF descargado", message: "El certificado se descargó correctamente." });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      addToast(TOAST.loadError());
    }
  };

  // --- Reversal state ---
  const [reversalDialog, setReversalDialog] = useState<{
    isOpen: boolean;
    practice?: CulminationPractice;
    group?: CulminationGroup;
  }>({ isOpen: false });
  const [reversalReason, setReversalReason] = useState("");
  const [reversalResolution, setReversalResolution] = useState("");

  const handleReverse = (practice: CulminationPractice, group: CulminationGroup) => {
    setReversalReason("");
    setReversalResolution("");
    setReversalDialog({ isOpen: true, practice, group });
  };

  const confirmReverse = async () => {
    const practice = reversalDialog.practice;
    if (!practice) return;

    try {
      await culminationService.reverse(practice.id, {
        reason: reversalReason,
        resolutionNumber: reversalResolution,
      });
      addToast(TOAST.created('Reversión'));
      setReversalDialog({ isOpen: false });
      fetchData();
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message;
      addToast(serverMsg ? { ...TOAST.updateError('reversión'), message: serverMsg } : TOAST.updateError('reversión'));
    }
  };

  // --- Helpers ---

  // ponytail: naive first-4-chars truncation, fine for known types (HOSP, COMU, etc.)
  const shortType = (type: string) => type.substring(0, 4).toUpperCase();

  const progressIndicator = (status: string) => {
    if (status === "certified") return "\u2713"; // ✓
    if (status === "approved") return "\u2713";
    return "\u25CB"; // ○
  };

  const resultConfig = {
    approved: { label: "Aprobado", color: "success" as const },
    failed: { label: "Reprobado", color: "error" as const },
    pending: { label: "Pendiente", color: "warning" as const },
  };

  return (
    <>
      <PageMeta
        title="Culminación de Prácticas"
        description="Gestión de culminación de prácticas profesionales"
      />
      <PageBreadcrumb pageTitle="Culminación de Prácticas" />

      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Culminación de Prácticas Profesionales
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Gestiona la culminación y certificación de prácticas profesionales
            </p>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Actualizar
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <UserIcon className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  {meta.total}
                </p>
                <p className="text-xs text-text-tertiary">Total Estudiantes</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-50 dark:bg-success-500/10">
                <CheckCircleIcon className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  {meta.completed}
                </p>
                <p className="text-xs text-text-tertiary">Completados</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-50 dark:bg-warning-500/10">
                <TimeIcon className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  {meta.inProgress}
                </p>
                <p className="text-xs text-text-tertiary">En Progreso</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters + Table */}
        <ComponentCard title="Listado de Estudiantes">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="w-full">
              <InputField
                type="text"
                placeholder="Buscar estudiante, cédula..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <CustomSelect
              options={[
                { value: "", label: "Todos los estados" },
                { value: "completed", label: "Completado" },
                { value: "in_progress", label: "En progreso" },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e as unknown as string);
                setCurrentPage(1);
              }}
              className="w-full"
            />
            <CustomSelect
              options={periodOptions}
              value={periodFilter}
              onChange={(e) => {
                setPeriodFilter(e as unknown as string);
                setCurrentPage(1);
              }}
              className="w-full"
            />
            {(searchTerm || statusFilter || periodFilter) && (
              <Button variant="ghost" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </div>

          {loading ? (
            <TableSkeleton columns={5} rows={itemsPerPage} />
          ) : filteredData.length === 0 ? (
            <EmptyState
              title="No se encontraron registros de culminación"
              description="Intenta ajustar los filtros para encontrar lo que buscas."
            />
          ) : (
            <>
              {/* Desktop table — one row per student group */}
              <div className="hidden md:block overflow-hidden rounded-lg border border-border-default dark:border-border-dark">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Estudiante</TableCell>
                      <TableCell isHeader>Carrera</TableCell>
                      <TableCell isHeader>Período</TableCell>
                      <TableCell isHeader>Progreso</TableCell>
                      <TableCell isHeader>Acciones</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((group) => (
                      <TableRow
                        key={`${group.studentCi}-${group.period}`}
                        className="hover:bg-bg-subtle/50 dark:hover:bg-bg-dark-subtle/50"
                      >
                        <TableCell>
                          <div className="font-medium text-text-primary dark:text-text-emphasis">
                            {group.studentName}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {group.studentCi}
                          </div>
                        </TableCell>
                        <TableCell className="text-text-secondary dark:text-text-tertiary text-sm">
                          {group.careerName}
                        </TableCell>
                        <TableCell className="text-text-secondary dark:text-text-tertiary text-sm">
                          {group.period}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {group.practices.map((p) => (
                              <Badge
                                key={p.id}
                                color={BADGE_COLORS[p.culminationStatus]}
                                variant="light"
                                size="sm"
                              >
                                {shortType(p.practiceType)}{" "}
                                {progressIndicator(p.culminationStatus)}
                              </Badge>
                            ))}
                            <Badge
                              color={
                                group.overallStatus === "completed"
                                  ? "success"
                                  : "warning"
                              }
                              variant="outline"
                              size="sm"
                            >
                              {group.overallStatus === "completed"
                                ? "Completado"
                                : "En curso"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedGroup(group);
                              setDetailModalOpen(true);
                            }}
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            Ver detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden flex flex-col gap-4">
                {paginatedData.map((group) => (
                  <div
                    key={`${group.studentCi}-${group.period}`}
                    className="bg-bg-surface dark:bg-bg-dark-surface rounded-lg border border-border-default dark:border-border-dark p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-text-primary dark:text-text-emphasis">
                          {group.studentName}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {group.studentCi}
                        </p>
                      </div>
                      <Badge
                        color={
                          group.overallStatus === "completed"
                            ? "success"
                            : "warning"
                        }
                        variant="light"
                        size="sm"
                      >
                        {group.overallStatus === "completed"
                          ? "Completado"
                          : "En curso"}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-text-secondary dark:text-text-tertiary mb-3">
                      <p>
                        <span className="font-medium">Carrera:</span>{" "}
                        {group.careerName}
                      </p>
                      <p>
                        <span className="font-medium">Período:</span>{" "}
                        {group.period}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {group.practices.map((p) => (
                        <Badge
                          key={p.id}
                          color={BADGE_COLORS[p.culminationStatus]}
                          variant="light"
                          size="sm"
                        >
                          {shortType(p.practiceType)}{" "}
                          {progressIndicator(p.culminationStatus)}
                        </Badge>
                      ))}
                    </div>
                    <div className="pt-3 border-t border-border-default dark:border-border-dark">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedGroup(group);
                          setDetailModalOpen(true);
                        }}
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        Ver detalle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(items) => {
                    setItemsPerPage(items);
                    setCurrentPage(1);
                  }}
                  itemsPerPageOptions={[10, 25, 50]}
                />
              )}
            </>
          )}
        </ComponentCard>
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        size="2xl"
        showCloseButton
      >
        <ModalHeader>
          <h3 className="text-lg font-semibold">
            Detalle de Prácticas
          </h3>
        </ModalHeader>
        <ModalBody>
          {selectedGroup && (
            <div className="space-y-6">
              {/* Student info header */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-text-secondary">
                    Estudiante:
                  </span>
                  <p className="text-text-primary dark:text-text-emphasis">
                    {selectedGroup.studentName}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-text-secondary">
                    Cédula:
                  </span>
                  <p className="text-text-primary dark:text-text-emphasis">
                    {selectedGroup.studentCi}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-text-secondary">
                    Carrera:
                  </span>
                  <p className="text-text-primary dark:text-text-emphasis">
                    {selectedGroup.careerName}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-text-secondary">
                    Período:
                  </span>
                  <p className="text-text-primary dark:text-text-emphasis">
                    {selectedGroup.period}
                  </p>
                </div>
              </div>

              {/* Practices table */}
              <div className="overflow-x-auto rounded-lg border border-border-default dark:border-border-dark">
                <table className="w-full text-sm">
                  <thead className="bg-bg-secondary dark:bg-bg-dark-secondary">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">
                        Institución
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-text-secondary">
                        Horas
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-text-secondary">
                        Resultado
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-text-secondary">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-text-secondary">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default dark:divide-border-dark">
                    {selectedGroup.practices.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-bg-subtle/50 dark:hover:bg-bg-dark-subtle/50"
                      >
                        <td className="px-4 py-3 font-medium text-text-primary dark:text-text-emphasis">
                          {p.practiceType}
                        </td>
                        <td className="px-4 py-3 text-text-secondary dark:text-text-tertiary">
                          {p.institutionName}
                        </td>
                        <td className="px-4 py-3 text-center text-text-secondary dark:text-text-tertiary tabular-nums">
                          {p.totalHours}/{p.hoursRequired}h
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            color={resultConfig[p.result].color}
                            variant="light"
                            size="sm"
                          >
                            {resultConfig[p.result].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            color={BADGE_COLORS[p.culminationStatus]}
                            variant="light"
                            size="sm"
                          >
                            {STATUS_LABELS[p.culminationStatus]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {p.culminationStatus === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleApprove(p, selectedGroup)
                                }
                              >
                                Aprobar
                              </Button>
                            )}
                            {p.culminationStatus === "approved" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleGenerateCertificate(p, selectedGroup)
                                }
                              >
                                Certificar
                              </Button>
                            )}
                            {p.culminationStatus === "certified" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDownloadPdf(p, selectedGroup)
                                }
                                startIcon={
                                  <DownloadIcon className="w-4 h-4" />
                                }
                              >
                                PDF
                              </Button>
                            )}
                            {(p.culminationStatus === "approved" || p.culminationStatus === "certified") && !p.reversal && (
                              <Button
                                size="sm"
                                variant="error"
                                onClick={() =>
                                  handleReverse(p, selectedGroup)
                                }
                              >
                                Revertir
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Certificate numbers summary */}
              {selectedGroup.practices.some((p) => p.certificateNumber) && (
                <div className="text-xs text-brand-600 dark:text-brand-400 space-y-1">
                  {selectedGroup.practices
                    .filter((p) => p.certificateNumber)
                    .map((p) => (
                      <p key={p.id}>
                        {p.practiceType}: Certificado Nro. {p.certificateNumber}
                      </p>
                    ))}
                </div>
              )}
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* Confirm dialog */}
      <UnifiedDialog
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel="Confirmar"
        variant="info"
      />

      {/* Reversal dialog */}
      <Modal
        isOpen={reversalDialog.isOpen}
        onClose={() => setReversalDialog({ isOpen: false })}
        size="md"
        showCloseButton
      >
        <ModalHeader>
          <h3 className="text-lg font-semibold">Revertir Culminación</h3>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Estás por registrar la reversión administrativa de la culminación de{" "}
              <strong>{reversalDialog.practice?.practiceType}</strong> de{" "}
              <strong>{reversalDialog.group?.studentName}</strong>.
            </p>
            <p className="text-xs text-warning-600 dark:text-warning-400">
              La culminación original se conserva como histórico. Solo se registrará una
              resolución administrativa que anula sus efectos para el sistema.
            </p>

            <div>
              <Label>N° de Resolución Administrativa *</Label>
              <InputField
                type="text"
                placeholder="Ej: RES-2025-0042"
                value={reversalResolution}
                onChange={(e) => setReversalResolution(e.target.value)}
              />
            </div>

            <div>
              <Label>Motivo de la Reversión *</Label>
              <textarea
                className="w-full rounded-lg border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface px-4 py-2.5 text-sm text-text-primary dark:text-text-emphasis placeholder:text-text-tertiary focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-colors min-h-[100px] resize-y"
                placeholder="Describa el motivo de la reversión..."
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setReversalDialog({ isOpen: false })}
              >
                Cancelar
              </Button>
              <Button
                variant="error"
                onClick={confirmReverse}
                disabled={!reversalReason.trim() || !reversalResolution.trim()}
              >
                Registrar Reversión
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
}
