/**
 * @file useStudents.tsx
 * @description Hook para la gestión de estudiantes en modo demostración.
 * Todas las operaciones son locales y no realizan llamadas a API externas.
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

  // Efecto para manejar el timeout de seguridad (30 segundos) en acciones críticas
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (loadingAction) {
      timeoutId = setTimeout(() => {
        setLoadingAction(false);
        console.warn("[useStudents] Timeout de 30s alcanzado. Rehabilitando botones.");
      }, 30000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadingAction]);

  const refreshStudents = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await studentsService.getStudents();
      setStudents(data);
      setStatus("success");
    } catch (e) {
      console.error("Error loading students:", e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshStudents();
  }, [refreshStudents]);

  /**
   * Simulación de creación de estudiante.
   * @param studentData Datos del nuevo estudiante
   */
  const addStudent = async (studentData: Omit<Student, "studentId" | "enrollmentDate">) => {
    setLoadingAction(true);
    // Simular retraso de red
    await new Promise(resolve => setTimeout(resolve, 800));

    const newStudent: Student = {
      ...studentData,
      studentId: Math.random().toString(36).substr(2, 9),
      enrollmentDate: new Date(),
    };

    setStudents(prev => [newStudent, ...prev]);
    setLoadingAction(false);

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
      onViewDetails: () => console.log("Ver detalles de:", newStudent.studentId),
      onUndo: () => setStudents(prev => prev.filter(s => s.studentId !== newStudent.studentId))
    });
  };

  /**
   * Simulación de edición de estudiante.
   * @param studentData Datos actualizados
   */
  const editStudent = async (studentData: Student) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const oldStudent = students.find(s => s.studentId === studentData.studentId);

    setStudents(prev => prev.map(s => s.studentId === studentData.studentId ? studentData : s));
    setLoadingAction(false);

    if (oldStudent) {
      addToast({
        variant: "success",
        title: "Actualización Exitosa",
        message: (
          <>
            <p>Se han guardado los cambios para <strong>{studentData.firstName} {studentData.lastName}</strong>.</p>
            <ChangeComparison
              oldData={oldStudent as unknown as Record<string, unknown>}
              newData={studentData as unknown as Record<string, unknown>}
              labels={STUDENT_LABELS}
            />
          </>
        ),
        onUndo: () => setStudents(prev => prev.map(s => s.studentId === studentData.studentId ? oldStudent : s))
      });
    }
  };

  /**
   * Alternar estado activo/inactivo.
   */
  const toggleStatus = async (student: Student) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    const isInactivating = student.status;
    const oldStatus = student.status;

    setStudents(prev => prev.map(s => s.studentId === student.studentId ? { ...s, status: !s.status } : s));
    setLoadingAction(false);

    addToast({
      variant: isInactivating ? "warning" : "success",
      title: isInactivating ? "Estudiante Inactivado" : "Estudiante Restaurado",
      message: (
        <>
          <p>
            El estudiante <strong>{student.firstName} {student.lastName}</strong> ahora está
            <span className={`font-bold ${isInactivating ? 'text-warning-600' : 'text-success-600'}`}>
              {isInactivating ? ' INACTIVO' : ' ACTIVO'}
            </span>.
          </p>
          {isInactivating && (
            <p className="mt-1 text-xs text-gray-500 italic">
              * El estudiante no aparecerá en las listas de asistencia actuales.
            </p>
          )}
          {!isInactivating && (
            <p className="mt-1 text-xs text-gray-500 italic">
              * El registro ha sido recuperado con todos sus datos previos.
            </p>
          )}
        </>
      ),
      onUndo: () => setStudents(prev => prev.map(s => s.studentId === student.studentId ? { ...s, status: oldStatus } : s))
    });
  };

  /**
   * Acciones masivas de eliminación.
   */
  const bulkRemoveStudents = async (ids: string[]) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setStudents(prev => prev.map(s => ids.includes(s.studentId) ? { ...s, status: false } : s));
    setLoadingAction(false);

    addToast({
      variant: "warning",
      title: "Eliminación Masiva",
      message: (
        <p>Se han inactivado <strong>{ids.length}</strong> estudiantes correctamente.</p>
      ),
      onUndo: () => setStudents(prev => prev.map(s => ids.includes(s.studentId) ? { ...s, status: true } : s))
    });
  };

  /**
   * Acciones masivas de restauración.
   */
  const bulkRestoreStudents = async (ids: string[]) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setStudents(prev => prev.map(s => ids.includes(s.studentId) ? { ...s, status: true } : s));
    setLoadingAction(false);

    addToast({
      variant: "success",
      title: "Restauración Masiva",
      message: (
        <p>Se han restaurado <strong>{ids.length}</strong> estudiantes exitosamente.</p>
      ),
      onUndo: () => setStudents(prev => prev.map(s => ids.includes(s.studentId) ? { ...s, status: false } : s))
    });
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
  };
};
