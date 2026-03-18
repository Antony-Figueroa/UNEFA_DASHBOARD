/**
 * @file useStudents.tsx
 * @description Hook personalizado para la gestión de la lógica de negocio de estudiantes.
 * Proporciona funciones para listar, crear, editar y cambiar el estado de los estudiantes,
 * integrando notificaciones (toasts) y manejo de estados de carga.
 * 
 * @module features/students/hooks
 */

import { studentService } from "../services/studentsService";
import { useToast } from "../../../context/toast";
import { RecordDetails, ChangeComparison } from "../../../components/ui/alert/AlertContextualContent";
import { useCrud } from "../../../hooks/useCrud";
import { Student, CreateStudentPayload, UpdateStudentPayload } from "../types";
import { AxiosError } from "axios";

/** Etiquetas descriptivas para los campos del estudiante (usadas en notificaciones) */
const STUDENT_LABELS: Record<string, string> = {
  firstName: "Nombre",
  lastName: "Apellido",
  careerName: "Carrera",
  semester: "Semestre",
  section: "Sección",
  regime: "Régimen",
  identificationNumber: "Cédula",
  email: "Correo",
  phone: "Teléfono",
  sex: "Sexo",
  birthDate: "Fecha de Nacimiento",
  civilStatus: "Estado Civil",
  studentType: "Tipo",
  militaryRank: "Rango Militar",
  works: "Trabaja",
};

/**
 * Hook useStudents.
 * 
 * Refactorizado para utilizar useCrud como motor de estado base, 
 * manteniendo las notificaciones enriquecidas y lógica optimista específica.
 * 
 * @returns Un objeto con el estado de los estudiantes y funciones de gestión.
 */
export const useStudents = () => {
  const { addToast } = useToast();

  const {
    data: students,
    status,
    loadingAction,
    error,
    refresh: refreshStudents,
    createItem: baseAddStudent,
    updateItem: baseEditStudent,
    deleteItem: removeStudent,
    toggleItemStatus: baseToggleStatus,
  } = useCrud<Student, CreateStudentPayload, UpdateStudentPayload>(studentService, {
    resourceName: "Estudiante",
    idField: "studentId",
  });

  /**
   * Registra un nuevo estudiante con notificaciones personalizadas.
   */
  const addStudent = async (payload: CreateStudentPayload) => {
    try {
      const newStudent = await baseAddStudent(payload, { silent: true });
      if (newStudent) {
        addToast({
          variant: "success",
          title: "Estudiante Registrado",
          message: (
            <>
              <p>El estudiante <strong>{newStudent.firstName} {newStudent.lastName}</strong> ha sido registrado exitosamente.</p>
              <RecordDetails
                data={newStudent as unknown as Record<string, unknown>}
                labels={STUDENT_LABELS}
                fields={['identificationNumber', 'careerName', 'semester']}
              />
            </>
          ),
        });
      }
    } catch (e) {
      const axiosError = e as any;
      if (!axiosError.response || axiosError.response.status >= 500) {
        console.error("[useStudents] Error crítico al registrar estudiante:", e);
      }
      // useCrud ya manejó el error si no pasamos silent: true en el catch, 
      // pero aquí queremos un mensaje personalizado.
      addToast({
        variant: "error",
        title: "Error de Registro",
        message: axiosError.response?.data?.message || axiosError.message || "Error al registrar el estudiante",
      });
      throw e;
    }
  };

  /**
   * Actualiza un estudiante con comparación de cambios.
   */
  const editStudent = async (payload: UpdateStudentPayload) => {
    try {
      const oldStudent = students.find(s => s.studentId === payload.studentId);
      const updatedStudent = await baseEditStudent(payload, { silent: true });
      
      if (updatedStudent) {
        addToast({
          variant: "success",
          title: "Estudiante Actualizado",
          message: (
            <>
              <p>Los cambios de <strong>{updatedStudent.firstName} {updatedStudent.lastName}</strong> se han guardado exitosamente.</p>
              {oldStudent && <ChangeComparison
                oldData={oldStudent as unknown as Record<string, unknown>}
                newData={updatedStudent as unknown as Record<string, unknown>}
                labels={STUDENT_LABELS}
              />}
            </>
          ),
        });
      }
    } catch (e) {
      const axiosError = e as AxiosError<{ message: string }>;
      if (!axiosError.response || axiosError.response.status >= 500) {
        console.error("[useStudents] Error crítico al actualizar estudiante:", e);
      }
      addToast({
        variant: "error",
        title: "Error de Actualización",
        message: axiosError.response?.data?.message || axiosError.message || "Error al actualizar el estudiante",
      });
      throw e;
    }
  };

  /**
   * Cambia el estado (activo/inactivo) con actualización optimista.
   */
  const toggleStatus = async (student: Student) => {
    const newStatus = !student.status;
    try {
      await baseToggleStatus(student.studentId, newStatus, { silent: true });
      
      addToast({
        variant: newStatus ? "success" : "warning",
        title: "Estado Actualizado",
        message: `El estudiante ${student.firstName} ${student.lastName} ahora está ${newStatus ? 'activo' : 'inactivo'} exitosamente.`,
      });
    } catch (e) {
      console.error("[useStudents] Error al cambiar estado:", e);
      addToast({
        variant: "error",
        title: "Error de Estado",
        message: "No se pudo cambiar el estado del estudiante.",
      });
    }
  };

  /**
   * Inactiva múltiples estudiantes de forma masiva.
   */
  const bulkRemoveStudents = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => studentService.toggleStatus!(id, false)));
      await refreshStudents();
      
      addToast({
        variant: "warning",
        title: "Inactivación Masiva",
        message: `Se han inactivado ${ids.length} estudiantes correctamente.`,
      });
    } catch (e) {
      console.error("[useStudents] Error en inactivación masiva:", e);
      const axiosError = e as AxiosError<{ message: string }>;
      addToast({
        variant: "error",
        title: "Error Masivo",
        message: axiosError.response?.data?.message || axiosError.message || "Error en inactivación masiva",
      });
    }
  };

  /**
   * Restaura múltiples estudiantes de forma masiva.
   */
  const bulkRestoreStudents = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => studentService.toggleStatus!(id, true)));
      await refreshStudents();
      
      addToast({
        variant: "success",
        title: "Restauración Masiva",
        message: `Se han restaurado ${ids.length} estudiantes exitosamente.`,
      });
    } catch (e) {
      console.error("[useStudents] Error en restauración masiva:", e);
      const axiosError = e as AxiosError<{ message: string }>;
      addToast({
        variant: "error",
        title: "Error Masivo",
        message: axiosError.response?.data?.message || axiosError.message || "Error en restauración masiva",
      });
    }
  };

  return {
    students,
    status,
    loadingAction,
    error,
    refreshStudents,
    addStudent,
    editStudent,
    removeStudent,
    toggleStatus,
    bulkRemoveStudents,
    bulkRestoreStudents
  };
};

