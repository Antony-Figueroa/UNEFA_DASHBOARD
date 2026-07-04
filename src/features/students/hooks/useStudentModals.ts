import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { CONFIRM_MESSAGES } from "../../../components/ui/dialog/DialogConfig";
import type { DialogVariant } from "../../../components/ui/dialog/DialogConfig";
import type { Student, StudentRowData, CreateStudentPayload, UpdateStudentPayload } from "../types";

interface ConfirmationInfo {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText: string;
  variant: DialogVariant;
}

interface UseStudentModalsOptions {
  students: Student[];
  addStudent: (payload: CreateStudentPayload) => Promise<void>;
  editStudent: (payload: UpdateStudentPayload) => Promise<void>;
  toggleStatus: (student: Student) => Promise<void>;
  bulkRemoveStudents: (ids: string[]) => Promise<void>;
  bulkRestoreStudents: (ids: string[]) => Promise<void>;
  refreshStudents: () => Promise<void>;
  addCareer: (payload: any) => Promise<any>;
  loadingAction: boolean;
}

export function useStudentModals({
  students,
  addStudent,
  editStudent,
  toggleStatus,
  bulkRemoveStudents,
  bulkRestoreStudents,
  refreshStudents,
  addCareer,
  loadingAction,
}: UseStudentModalsOptions) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<StudentRowData | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchStudentIds, setBatchStudentIds] = useState<string[]>([]);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationInfo | null>(null);

  // ── Event: open create from Command Palette ──────────────────────
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setEditingStudent(null);
      setIsModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // ── Event: open edit from external event ─────────────────────────
  useEffect(() => {
    const handleOpenEditStudent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const studentId = customEvent.detail;
      const student = Array.isArray(students) ? students.find((s) => s.studentId === studentId) : null;
      if (student) {
        setEditingStudent(student);
        setIsModalOpen(true);
      }
    };
    window.addEventListener('open-edit-student', handleOpenEditStudent);
    return () => window.removeEventListener('open-edit-student', handleOpenEditStudent);
  }, [students]);

  // ── Event: careers from students page ────────────────────────────
  useEffect(() => {
    const handleAddCareer = () => setIsCareerModalOpen(true);
    window.addEventListener("students:addCareer", handleAddCareer);
    return () => window.removeEventListener("students:addCareer", handleAddCareer);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleCreate = useCallback(() => {
    setEditingStudent(null);
    setIsModalOpen(true);
  }, []);

  const handleEditFromExisting = useCallback((existingStudent: any) => {
    setIsModalOpen(false);
    setTimeout(() => {
      setEditingStudent(existingStudent);
      setIsModalOpen(true);
    }, 200);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setEditingStudent(null), 100);
  }, []);

  const handleEdit = useCallback((row: StudentRowData) => {
    const original = Array.isArray(students) ? students.find((s) => s.studentId === row.studentId) : null;
    setEditingStudent(original || null);
    setIsModalOpen(true);
  }, [students]);

  const handleSave = useCallback(async (payload: CreateStudentPayload | UpdateStudentPayload) => {
    const isEditing = !!editingStudent;
    try {
      if (isEditing && editingStudent) {
        await editStudent({ ...payload, studentId: editingStudent.studentId } as UpdateStudentPayload);
      } else {
        await addStudent(payload as CreateStudentPayload);
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error("[useStudentModals] Error saving:", e);
    }
  }, [editingStudent, editStudent, addStudent]);

  const handleToggleStatus = useCallback((row: StudentRowData) => {
    const original = Array.isArray(students) ? students.find((s) => s.studentId === row.studentId) : null;
    if (!original) return;

    const isDeactivating = original.status;
    const config = isDeactivating
      ? CONFIRM_MESSAGES.deactivate('al estudiante')
      : CONFIRM_MESSAGES.activate('al estudiante');
    setConfirmation({
      isOpen: true,
      title: config.title,
      message: `¿Estás seguro de que deseas ${isDeactivating ? "desactivar" : "restaurar"} al estudiante "${row.fullNames}"?`,
      onConfirm: async () => {
        try { await toggleStatus(original); }
        catch (e) { console.error("[useStudentModals] Error toggling status:", e); }
        finally { setConfirmation(null); }
      },
      confirmText: config.confirmLabel,
      variant: config.variant as DialogVariant,
    });
  }, [students, toggleStatus]);

  const handleBulkDelete = useCallback((ids: string[]) => {
    const config = CONFIRM_MESSAGES.deactivate('los estudiantes');
    setConfirmation({
      isOpen: true,
      title: 'Confirmar desactivación masiva',
      message: `¿Estás seguro de que deseas desactivar ${ids.length} estudiantes seleccionados?`,
      onConfirm: async () => {
        try { await bulkRemoveStudents(ids); setSelectedIds([]); }
        catch (e) { console.error("[useStudentModals] Error bulk delete:", e); }
        finally { setConfirmation(null); }
      },
      confirmText: "Desactivar Todos",
      variant: config.variant as DialogVariant,
    });
  }, [bulkRemoveStudents]);

  const handleBulkRestore = useCallback((ids: string[]) => {
    const config = CONFIRM_MESSAGES.activate('los estudiantes');
    setConfirmation({
      isOpen: true,
      title: 'Confirmar restauración masiva',
      message: `¿Estás seguro de que deseas restaurar ${ids.length} estudiantes seleccionados?`,
      onConfirm: async () => {
        try { await bulkRestoreStudents(ids); setSelectedIds([]); }
        catch (e) { console.error("[useStudentModals] Error bulk restore:", e); }
        finally { setConfirmation(null); }
      },
      confirmText: "Restaurar Todos",
      variant: config.variant as DialogVariant,
    });
  }, [bulkRestoreStudents]);

  const handleBatchPreEnroll = useCallback((ids: string[]) => {
    setBatchStudentIds(ids);
    setIsBatchModalOpen(true);
  }, []);

  const handleExportToPreEnrollment = useCallback((row: StudentRowData, openTab: (path: string, label: string) => void) => {
    setConfirmation({
      isOpen: true,
      title: "Exportar a Pre-Inscripción",
      message: `¿Desea llevar los datos de ${row.fullNames} a la ventana de Pre-Inscripción?`,
      confirmText: "Exportar",
      variant: "info",
      onConfirm: () => {
        setConfirmation(null);
        openTab("/pre-enrollment", "Pre-Inscripción");
        navigate("/pre-enrollment", { state: { exportStudentCi: row.identificationNumber } });
      },
    });
  }, [navigate]);

  const handleCareerSave = useCallback(async (payload: any) => {
    try {
      const created = await addCareer(payload);
      if (created?.careerId !== undefined) {
        window.dispatchEvent(new CustomEvent("students:setCareerId", { detail: String(created.careerId) }));
      }
      setIsCareerModalOpen(false);
    } catch (e) {
      console.error("[useStudentModals] Error creating career:", e);
    }
  }, [addCareer]);

  return {
    // State
    isModalOpen, editingStudent, viewStudent,
    isImportModalOpen, isExportModalOpen, isBatchModalOpen,
    isPDFModalOpen, pdfSearchTerm, isCareerModalOpen,
    selectedIds, confirmation, batchStudentIds,
    // Setters
    setIsModalOpen, setEditingStudent, setViewStudent,
    setIsImportModalOpen, setIsExportModalOpen, setIsBatchModalOpen,
    setIsPDFModalOpen, setPdfSearchTerm, setIsCareerModalOpen,
    setSelectedIds, setConfirmation, setBatchStudentIds,
    // Handlers
    handleCreate, handleEditFromExisting, handleCloseModal,
    handleEdit, handleSave, handleToggleStatus,
    handleBulkDelete, handleBulkRestore, handleBatchPreEnroll,
    handleExportToPreEnrollment, handleCareerSave,
  };
}

export default useStudentModals;
