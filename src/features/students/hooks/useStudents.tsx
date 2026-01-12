/**
 * @file useStudents.tsx
 * @description Hook para la gestión de estudiantes.
 */

import { useState, useEffect, useCallback } from "react";
import { Student } from "../types";
import * as studentsService from "../services/studentsService";
import { useToast } from "../../../context/toast";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";

type Status = "loading" | "success" | "error";

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
  works: "Trabaja",
};

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  const refreshStudents = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await studentsService.getStudents();
      // Validamos que response.data sea un array antes de asignarlo
      const studentsArray = Array.isArray(response.data) ? response.data : [];
      setStudents(studentsArray);
      setStatus("success");
    } catch (e) {
      console.error("Error loading students:", e);
      setStatus("error");
      setStudents([]); // Aseguramos que sea un array en caso de error
    }
  }, []);

  useEffect(() => {
    refreshStudents();
  }, [refreshStudents]);

  const addStudent = async (studentData: Omit<Student, "studentId" | "enrollmentDate">) => {
    setLoadingAction(true);
    try {
      const newStudent = await studentsService.createStudent(studentData);
      setStudents(prev => [newStudent, ...prev]);
      
      addToast({
        variant: "success",
        title: "Estudiante Creado",
        message: (
          <>
            <p>El estudiante <strong>{newStudent.firstName} {newStudent.lastName}</strong> ha sido registrado correctamente.</p>
            <RecordDetails
              data={newStudent as unknown as Record<string, unknown>}
              labels={STUDENT_LABELS}
              fields={['identificationNumber', 'careerName', 'semester']}
            />
          </>
        ),
      });
    } catch (error) {
      console.error("Error adding student:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "No se pudo registrar el estudiante.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const editStudent = async (studentData: Student) => {
    setLoadingAction(true);
    try {
      const oldStudent = students.find(s => s.studentId === studentData.studentId);
      const updatedStudent = await studentsService.updateStudent(studentData.studentId, studentData);
      
      setStudents(prev => prev.map(s => s.studentId === studentData.studentId ? updatedStudent : s));
      
      addToast({
        variant: "success",
        title: "Actualización Exitosa",
        message: (
          <>
            <p>Se han guardado los cambios para <strong>{updatedStudent.firstName} {updatedStudent.lastName}</strong>.</p>
            {oldStudent && <ChangeComparison
              oldData={oldStudent as unknown as Record<string, unknown>}
              newData={updatedStudent as unknown as Record<string, unknown>}
              labels={STUDENT_LABELS}
            />}
          </>
        ),
      });
    } catch (error) {
      console.error("Error editing student:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "No se pudo actualizar el estudiante.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleStatus = async (student: Student) => {
    setLoadingAction(true);
    try {
      const newStatus = !student.status;
      const updatedStudent = await studentsService.toggleStudentStatus(student.studentId, newStatus);
      
      setStudents(prev => prev.map(s => s.studentId === student.studentId ? updatedStudent : s));

      addToast({
        variant: newStatus ? "success" : "warning",
        title: newStatus ? "Estudiante Restaurado" : "Estudiante Inactivado",
        message: `El estudiante ${student.firstName} ${student.lastName} ahora está ${newStatus ? 'activo' : 'inactivo'}.`,
      });
    } catch (error) {
      console.error("Error toggling student status:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "No se pudo cambiar el estado del estudiante.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRemoveStudents = async (ids: string[]) => {
    setLoadingAction(true);
    try {
      await Promise.all(ids.map(id => studentsService.toggleStudentStatus(id, false)));
      setStudents(prev => prev.map(s => ids.includes(s.studentId) ? { ...s, status: false } : s));
      
      addToast({
        variant: "warning",
        title: "Eliminación Masiva",
        message: `Se han inactivado ${ids.length} estudiantes correctamente.`,
      });
    } catch (error) {
      console.error("Error in bulk remove:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "Ocurrió un error al inactivar los estudiantes.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRestoreStudents = async (ids: string[]) => {
    setLoadingAction(true);
    try {
      await Promise.all(ids.map(id => studentsService.toggleStudentStatus(id, true)));
      setStudents(prev => prev.map(s => ids.includes(s.studentId) ? { ...s, status: true } : s));
      
      addToast({
        variant: "success",
        title: "Restauración Masiva",
        message: `Se han restaurado ${ids.length} estudiantes exitosamente.`,
      });
    } catch (error) {
      console.error("Error in bulk restore:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "Ocurrió un error al restaurar los estudiantes.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  return {
    students,
    status,
    loadingAction,
    error: null,
    addStudent,
    editStudent,
    toggleStatus,
    bulkRemoveStudents,
    bulkRestoreStudents,
    refreshStudents,
  };
};
