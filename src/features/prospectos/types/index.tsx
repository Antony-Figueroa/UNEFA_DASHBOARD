export interface ProspectList {
  listId: number;
  name: string;
  description?: string;
  periodId: number;
  periodDescription?: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  itemCount?: number;
}

export interface ProspectListItem {
  itemId: number;
  listId: number;
  studentsId: number;
  enrolled: boolean;
  notes?: string;
  addedAt: string;
  addedBy?: number;
  student?: {
    studentsId: number;
    studentCi: string;
    name: string;
    secondName?: string;
    surname: string;
    secondSurname?: string;
    contactPhone?: string;
    email?: string;
  } | null;
}

export interface EligibleStudent {
  studentsId: number;
  studentCi: string;
  identificationPrefix: string;
  identificationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
  careerName?: string;
  careerId?: number | null;
}

export interface CreateProspectListPayload {
  name: string;
  description?: string;
  periodId: number;
  createdBy?: number;
}

export interface UpdateProspectListPayload {
  name?: string;
  description?: string;
}

export interface AddListItemPayload {
  studentsId: number;
  notes?: string;
  addedBy?: number;
}
