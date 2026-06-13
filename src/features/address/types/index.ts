export interface AddressType {
  addressTypeId: number;
  code: string;
  name: string;
  description?: string;
  status: number;
}

export interface GeographicHierarchy {
  estadoId: number;
  estado: string;
  municipioId: number;
  municipio: string;
  parroquiaId: number;
  parroquia: string;
}

export interface Address {
  addressId: number;
  streetAddress: string;
  reference?: string;
  parroquiaId: number;
  parroquia: string;
  municipioId: number;
  municipio: string;
  estadoId: number;
  estado: string;
  fullAddress: string;
  createdAt: string;
}

export interface PersonAddress {
  personAddressId: number;
  personId: number;
  isPrimary: boolean;
  addressType: AddressType;
  address: Address;
  createdAt: string;
}

export interface InstitutionAddress {
  institutionAddressId: number;
  institutionId: number;
  isPrimary: boolean;
  addressType: AddressType;
  address: Address;
  createdAt: string;
}

export interface AddressInfo {
  addressId: number;
  streetAddress: string;
  reference: string | null;
  parroquiaId: number;
  parroquia: string;
  municipioId: number;
  municipio: string;
  estadoId: number;
  estado: string;
  fullAddress: string;
}

export interface CreateAddressPayload {
  entityType: "person" | "institution";
  entityId: number;
  addressTypeId: number;
  parroquiaId: number;
  streetAddress: string;
  reference?: string;
  isPrimary?: boolean;
}

export interface UpdateAddressPayload {
  parroquiaId?: number;
  streetAddress?: string;
  reference?: string;
}

export interface CoincidenceResult {
  level: "SAME_PARROQUIA" | "SAME_MUNICIPIO" | "SAME_STATE" | "DIFFERENT_STATE";
  stateMatch: boolean;
  municipalityMatch: boolean;
  parishMatch: boolean;
  proximityScore: number;
}

export interface AddressCoincidence {
  studentAddress: AddressInfo;
  institutionAddress: AddressInfo;
  coincidence: CoincidenceResult;
}

export interface AddressSuggestion {
  institutionId: number;
  institutionName: string;
  institutionAddress: string;
  estado: string;
  municipio: string;
  proximityScore: number;
}
