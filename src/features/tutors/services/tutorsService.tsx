/**
 * @file tutorsService.tsx
 * @description Servicio para la gestión de tutores (API).
 */

import { Tutor } from "../types";

const API_URL = "/api/tutors";

export const getTutors = async (): Promise<Tutor[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  const data = await response.json();
  return (data as Record<string, unknown>[]).map((t: Record<string, unknown>) => ({
    ...t,
    tutorId: (t.tutorId ?? t.id ?? t.ID ?? t._id ?? "") as string,
    firstName: (t.firstName ?? t.first_name ?? t.nombre ?? "") as string,
    lastName: (t.lastName ?? t.last_name ?? t.apellido ?? "") as string,
    registrationDate: t.registrationDate ? new Date(t.registrationDate as string | number) : (t.createdAt ? new Date(t.createdAt as string | number) : new Date())
  })) as unknown as Tutor[];
};

export const createTutor = async (tutor: Omit<Tutor, "tutorId" | "registrationDate">): Promise<Tutor> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tutor),
  });
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  const data = (await response.json()) as Record<string, unknown>;
  return { 
    ...data, 
    tutorId: (data.tutorId ?? data.id ?? "") as string,
    registrationDate: data.registrationDate ? new Date(data.registrationDate as string | number) : new Date() 
  } as unknown as Tutor;
};
