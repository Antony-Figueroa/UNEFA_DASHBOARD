/**
 * @file tutorsService.tsx
 * @description Servicio estático para la gestión de tutores (Modo Demo).
 * No realiza conexiones a servicios externos.
 */

import { Tutor } from "../types";

/**
 * Datos estáticos de la demostración.
 */
const MOCK_TUTORS: Tutor[] = [
  {
    tutorId: "1",
    identificationPrefix: "V",
    identificationNumber: "11223344",
    firstName: "Roberto",
    lastName: "Gómez",
    sex: "MASCULINO",
    phone: "04261122334",
    email: "roberto.gomez@universidad.edu",
    profession: "Matemáticas Avanzadas",
    condition: "CONTRATADO",
    dedication: "TIEMPO COMPLETO",
    category: "TITULAR",
    status: true,
    registrationDate: new Date("2022-05-10"),
    carreras: ["1", "2"]
  },
  {
    tutorId: "2",
    identificationPrefix: "V",
    identificationNumber: "22334455",
    firstName: "Elena",
    lastName: "Beltrán",
    sex: "FEMENINO",
    phone: "04142233445",
    email: "elena.beltran@universidad.edu",
    profession: "Física Cuántica",
    condition: "ORDINARIO",
    dedication: "DEDICACION EXCLUSIVA",
    category: "ASOCIADO",
    status: true,
    registrationDate: new Date("2022-08-15"),
    carreras: ["4"]
  },
  {
    tutorId: "3",
    identificationPrefix: "V",
    identificationNumber: "33445566",
    firstName: "Ricardo",
    lastName: "Mendoza",
    sex: "MASCULINO",
    phone: "04123344556",
    email: "ricardo.mendoza@universidad.edu",
    profession: "Programación Web",
    condition: "CONTRATADO",
    dedication: "MEDIO TIEMPO",
    category: "ASISTENTE",
    status: true,
    registrationDate: new Date("2023-01-20"),
    carreras: ["1", "3", "5"]
  },
  {
    tutorId: "4",
    identificationPrefix: "V",
    identificationNumber: "44556677",
    firstName: "Sofía",
    lastName: "Vargas",
    sex: "FEMENINO",
    phone: "04164455667",
    email: "sofia.vargas@universidad.edu",
    profession: "Inteligencia Artificial",
    condition: "ORDINARIO",
    dedication: "TIEMPO COMPLETO",
    category: "INSTRUCTOR",
    status: false,
    registrationDate: new Date("2022-12-05"),
    carreras: ["2", "4"]
  },
  {
    tutorId: "5",
    identificationPrefix: "V",
    identificationNumber: "55667788",
    firstName: "Fernando",
    lastName: "Castro",
    sex: "MASCULINO",
    phone: "04245566778",
    email: "fernando.castro@universidad.edu",
    profession: "Base de Datos",
    condition: "CONTRATADO",
    dedication: "TIEMPO COMPLETO",
    category: "ASOCIADO",
    status: true,
    registrationDate: new Date("2023-02-10"),
    carreras: ["1", "5"]
  }
];

/**
 * Obtiene la lista de tutores desde el mock local.
 */
export const getTutors = async (): Promise<Tutor[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_TUTORS]), 300);
  });
};

/**
 * Simula la creación de un tutor.
 */
export const createTutor = async (tutor: Omit<Tutor, "tutorId" | "registrationDate">): Promise<Tutor> => {
  return new Promise((resolve) => {
    const newTutor: Tutor = {
      ...tutor,
      tutorId: Math.random().toString(36).substr(2, 9),
      registrationDate: new Date(),
    };
    setTimeout(() => resolve(newTutor), 500);
  });
};

/**
 * Simula la actualización de un tutor.
 */
export const updateTutor = async (id: string, tutor: Partial<Tutor>): Promise<Tutor> => {
  return new Promise((resolve, reject) => {
    const existing = MOCK_TUTORS.find(t => t.tutorId === id);
    if (!existing) return reject(new Error("Tutor no encontrado"));
    
    setTimeout(() => resolve({ ...existing, ...tutor }), 500);
  });
};

/**
 * Simula la eliminación (desactivación) de un tutor.
 */
export const deleteTutor = async (tutorId: string): Promise<void> => {
  return new Promise((resolve) => {
    console.log(`[tutorsService] Eliminando tutor: ${tutorId}`);
    setTimeout(resolve, 300);
  });
};
