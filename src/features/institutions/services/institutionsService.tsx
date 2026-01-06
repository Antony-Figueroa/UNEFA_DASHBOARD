/**
 * @file institutionsService.tsx
 * @description Servicio estático para la gestión de instituciones (Modo Demo).
 */

import { Institution } from "../types";

const MOCK_INSTITUTIONS: Institution[] = [
  {
    institutionId: "1",
    rif: "J-123456789",
    name: "Hospital Central de Maracay",
    fiscalAddress: "Av. Las Delicias, Maracay, Aragua",
    phone: "0243-1234567",
    practiceType: "HOSPITALARIA",
    careerId: "ENF_GENERAL",
    careerName: "Enfermería General",
    region: "Central",
    nucleus: "Aragua",
    extension: "Maracay",
    institutionType: "Pública",
    status: true,
    registrationDate: new Date("2023-05-10"),
  },
  {
    institutionId: "2",
    rif: "J-987654321",
    name: "Centro Clínico Universitario",
    fiscalAddress: "Calle 100, Valencia, Carabobo",
    phone: "0241-7654321",
    practiceType: "HOSPITALARIA",
    careerId: "ENF_PEDIATRICA",
    careerName: "Enfermería Pediátrica",
    region: "Central",
    nucleus: "Carabobo",
    extension: "Valencia",
    institutionType: "Privada",
    status: true,
    registrationDate: new Date("2023-06-15"),
  },
  {
    institutionId: "3",
    rif: "G-200012345",
    name: "Alcaldía de Girardot",
    fiscalAddress: "Palacio Municipal, Maracay",
    phone: "0243-5551234",
    practiceType: "ORDINARIA",
    careerId: "ING_SISTEMAS",
    careerName: "Ingeniería en Sistemas",
    region: "Central",
    nucleus: "Aragua",
    extension: "Maracay",
    institutionType: "Pública",
    status: true,
    registrationDate: new Date("2023-08-20"),
  },
  {
    institutionId: "4",
    rif: "J-311223344",
    name: "Corporación Tecnológica C.A.",
    fiscalAddress: "Torre BOD, Valencia",
    phone: "0241-8884433",
    practiceType: "ORDINARIA",
    careerId: "ING_CIVIL",
    careerName: "Ingeniería Civil",
    region: "Central",
    nucleus: "Carabobo",
    extension: "Valencia",
    institutionType: "Privada",
    status: false,
    registrationDate: new Date("2023-01-10"),
  },
];

export const getInstitutions = async (): Promise<Institution[]> => {
  return [...MOCK_INSTITUTIONS];
};
