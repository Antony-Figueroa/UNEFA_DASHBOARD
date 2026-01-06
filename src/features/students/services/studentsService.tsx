/**
 * @file studentsService.tsx
 * @description Servicio estático para la gestión de estudiantes (Modo Demo).
 * No realiza conexiones a servicios externos.
 */

import { Student } from "../types";

/**
 * Datos estáticos de la demostración.
 */
const MOCK_STUDENTS: Student[] = [
  {
    studentId: "1",
    identificationPrefix: "V",
    identificationNumber: "12345678",
    firstName: "Juan",
    lastName: "Pérez",
    sex: "MASCULINO",
    birthDate: "2000-05-15",
    civilStatus: "SOLTERO",
    phone: "0426-1234567",
    email: "juan.perez@universidad.edu",
    careerId: "1",
    careerName: "Ingeniería de Sistemas",
    semester: "08",
    section: "236",
    regime: "DIURNO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "NO",
    status: true,
    enrollmentDate: new Date("2023-01-15"),
  },
  {
    studentId: "2",
    identificationPrefix: "V",
    identificationNumber: "23456789",
    firstName: "María",
    lastName: "García",
    sex: "FEMENINO",
    birthDate: "2001-08-20",
    civilStatus: "SOLTERO",
    phone: "0414-2345678",
    email: "maria.garcia@universidad.edu",
    careerId: "2",
    careerName: "Administración de Empresas",
    semester: "06",
    section: "112",
    regime: "DIURNO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "SI",
    status: true,
    enrollmentDate: new Date("2023-02-20"),
  },
  {
    studentId: "3",
    identificationPrefix: "V",
    identificationNumber: "34567890",
    firstName: "Carlos",
    lastName: "Rodríguez",
    sex: "MASCULINO",
    birthDate: "1999-11-10",
    civilStatus: "CASADO",
    phone: "0412-3456789",
    email: "carlos.rod@universidad.edu",
    careerId: "3",
    careerName: "Derecho",
    semester: "04",
    section: "445",
    regime: "NOCTURNO",
    studentType: "MILITAR",
    militaryRank: "TENIENTE",
    works: "SI",
    status: false,
    enrollmentDate: new Date("2022-11-10"),
  },
  {
    studentId: "4",
    identificationPrefix: "V",
    identificationNumber: "45678901",
    firstName: "Ana",
    lastName: "Martínez",
    sex: "FEMENINO",
    birthDate: "2002-03-05",
    civilStatus: "SOLTERO",
    phone: "0416-4567890",
    email: "ana.mtz@universidad.edu",
    careerId: "4",
    careerName: "Medicina",
    semester: "02",
    section: "667",
    regime: "DIURNO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "NO",
    status: true,
    enrollmentDate: new Date("2023-03-05"),
  },
  {
    studentId: "5",
    identificationPrefix: "V",
    identificationNumber: "56789012",
    firstName: "Luis",
    lastName: "Sánchez",
    sex: "MASCULINO",
    birthDate: "2000-01-10",
    civilStatus: "SOLTERO",
    phone: "0424-5678901",
    email: "luis.sanchez@universidad.edu",
    careerId: "5",
    careerName: "Arquitectura",
    semester: "09",
    section: "889",
    regime: "MIXTO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "NO",
    status: true,
    enrollmentDate: new Date("2023-01-10"),
  }
];

/**
 * Obtiene la lista de estudiantes desde el mock local.
 */
export const getStudents = async (): Promise<Student[]> => {
  // Simular un pequeño retraso para mantener la experiencia de carga
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_STUDENTS]), 300);
  });
};

/**
 * Simula la creación de un estudiante.
 */
export const createStudent = async (student: Omit<Student, "studentId" | "enrollmentDate">): Promise<Student> => {
  return new Promise((resolve) => {
    const newStudent: Student = {
      ...student,
      studentId: Math.random().toString(36).substr(2, 9),
      enrollmentDate: new Date(),
    };
    // En una demo real, podrías añadirlo al array MOCK_STUDENTS si fuera una variable mutable
    setTimeout(() => resolve(newStudent), 500);
  });
};

/**
 * Simula la actualización de un estudiante.
 */
export const updateStudent = async (id: string, student: Partial<Student>): Promise<Student> => {
  return new Promise((resolve, reject) => {
    const existing = MOCK_STUDENTS.find(s => s.studentId === id);
    if (!existing) return reject(new Error("Estudiante no encontrado"));
    
    setTimeout(() => resolve({ ...existing, ...student }), 500);
  });
};

/**
 * Simula la eliminación (desactivación) de un estudiante.
 */
export const deleteStudent = async (studentId: string): Promise<void> => {
  return new Promise((resolve) => {
    console.log(`[studentsService] Eliminando estudiante: ${studentId}`);
    setTimeout(resolve, 300);
  });
};
