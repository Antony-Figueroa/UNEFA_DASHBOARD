export interface Persona {
  personId: string;
  ci: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
  gender?: string;
  birthDate?: string;
  address?: string;
  maritalStatus?: string;
  status: boolean;
  registrationDate: Date;
}

export interface PersonaDTO {
  personId: number;
  ci: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  birthDate: string | null;
  address: string | null;
  maritalStatus: string | null;
  status: number;
}

export function mapPersonaFromDTO(dto: PersonaDTO): Persona {
  return {
    personId: String(dto.personId),
    ci: dto.ci,
    firstName: dto.firstName,
    middleName: dto.middleName ?? undefined,
    lastName: dto.lastName,
    secondLastName: dto.secondLastName ?? undefined,
    email: dto.email,
    phone: dto.phone ?? '',
    gender: dto.gender ?? undefined,
    birthDate: dto.birthDate ?? undefined,
    address: dto.address ?? undefined,
    maritalStatus: dto.maritalStatus ?? undefined,
    status: dto.status === 1,
    registrationDate: new Date(),
  };
}
