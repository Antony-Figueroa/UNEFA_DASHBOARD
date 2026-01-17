export interface InternshipType {
  INTERNSHIP_TYPE_ID: number;
  NAME: string;
  ABBREVIATION: string;
  PRIORITY: number;
  STATUS: number;
  CREATION_DATE: string;
}

export interface InternshipTypeOption {
  value: string;
  label: string;
  text: string; // Para compatibilidad con MultiSelect
}
