/**
 * @file useStudents.tsx
 * @description Hook para la gestión de estudiantes.
 */

import { useState, useEffect, useCallback } from "react";
import { AxiosError } from "axios";
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
  const [error, setError] = useState<Error | null>(null);
  const { addToast } = useToast();

  const refreshStudents = useCallback(async (showLoading = true) => {
    if (showLoading) setStatus("loading");
    setError(null);
    try {
      const response = await studentsService.getStudents();
      const studentsArray = Array.isArray(response.data) ? response.data : [];
      setStudents(studentsArray);
      if (showLoading) setStatus("success");
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Error desconocido al cargar estudiantes");
      setError(err);
      if (showLoading) setStatus("error");
      setStudents([]);
      addToast({
        variant: "error",
        title: "Error de Conexión",
        message: "No se pudieron cargar los estudiantes. Verifique su conexión.",
      });
    }
  }, [addToast]);

  useEffect(() => {
    refreshStudents(true);
  }, [refreshStudents]);

  const addStudent = async (studentData: Omit<Student, "studentId" | "enrollmentDate">) => {
    setLoadingAction(true);
    try {
      const newStudent = await studentsService.createStudent(studentData);
      await refreshStudents(false);
      
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
    } catch (e) {
      const axiosError = e as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || axiosError.message || "Error al registrar el estudiante";
      addToast({
        variant: "error",
        title: "Error de Registro",
        message: errorMessage,
      });
      throw e;
    } finally {
      setLoadingAction(false);
    }
  };

  const editStudent = async (studentData: Student) => {
    setLoadingAction(true);
    try {
      const oldStudent = students.find(s => s.studentId === studentData.studentId);
      const updatedStudent = await studentsService.updateStudent(studentData.studentId, studentData);
      await refreshStudents(false);
      
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
    } catch (e) {
      const axiosError = e as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || axiosError.message || "Error al actualizar el estudiante";
      addToast({
        variant: "error",
        title: "Error de Actualización",
        message: errorMessage,
      });
      throw e;
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleStatus = async (student: Student) => {
    setLoadingAction(true);
    const oldStatus = student.status;
    const newStatus = !oldStatus;

    // Actualización optimista
    setStudents(prev => prev.map(s => 
      s.studentId === student.studentId ? { ...s, status: newStatus } : s
    ));

    try {
      await studentsService.toggleStudentStatus(student.studentId, newStatus);
      await refreshStudents(false);

      addToast({
        variant: newStatus ? "success" : "warning",
        title: newStatus ? "Estudiante Restaurado" : "Estudiante Inactivado",
        message: `El estudiante ${student.firstName} ${student.lastName} ahora está ${newStatus ? 'activo' : 'inactivo'}.`,
      });
    } catch (e) {
      // Revertir cambio optimista en caso de error
      setStudents(prev => prev.map(s => 
        s.studentId === student.studentId ? { ...s, status: oldStatus } : s
      ));

      const axiosError = e as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || axiosError.message || "Error al cambiar el estado";
      addToast({
        variant: "error",
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRemoveStudents = async (ids: string[]) => {
    setLoadingAction(true);
    
    // Guardar estados anteriores para revertir si es necesario
    const previousStudents = [...students];
    
    // Actualización optimista
    setStudents(prev => prev.map(s => 
      ids.includes(s.studentId) ? { ...s, status: false } : s
    ));

    try {
      await Promise.all(ids.map(id => studentsService.toggleStudentStatus(id, false)));
      await refreshStudents(false);
      
      addToast({
        variant: "warning",
        title: "Inactivación Masiva",
        message: `Se han inactivado ${ids.length} estudiantes correctamente.`,
      });
    } catch (e) {
      // Revertir cambio optimista
      setStudents(previousStudents);

      const axiosError = e as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || axiosError.message || "Error en inactivación masiva";
      addToast({
        variant: "error",
        title: "Error Masivo",
        message: errorMessage,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRestoreStudents = async (ids: string[]) => {
    setLoadingAction(true);
    
    // Guardar estados anteriores
    const previousStudents = [...students];

    // Actualización optimista
    setStudents(prev => prev.map(s => 
      ids.includes(s.studentId) ? { ...s, status: true } : s
    ));

    try {
      await Promise.all(ids.map(id => studentsService.toggleStudentStatus(id, true)));
      await refreshStudents(false);
      
      addToast({
        variant: "success",
        title: "Restauración Masiva",
        message: `Se han restaurado ${ids.length} estudiantes exitosamente.`,
      });
    } catch (e) {
      // Revertir cambio optimista
      setStudents(previousStudents);

      const axiosError = e as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || axiosError.message || "Error en restauración masiva";
      addToast({
        variant: "error",
        title: "Error Masivo",
        message: errorMessage,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  return {
    students,
    status,
    loadingAction,
    error,
    addStudent,
    editStudent,
    toggleStatus,
    bulkRemoveStudents,
    bulkRestoreStudents,
    refreshStudents,
  };
};
