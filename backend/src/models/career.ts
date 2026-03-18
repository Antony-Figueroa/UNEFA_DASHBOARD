export interface CareerDBRecord {
  CAREER_ID?: number;
  CAREER_NAME?: string;
  CAREER_CODE?: number;
  MINIMUM_GRADE?: number;
  CAREER_ABBREVIATION?: string;
  CAREER_TYPE?: string;
  STATUS?: number;
  CREATION_DATE?: string;
  MODIF_USER_ID?: number;
  MODIF_USER_DATE?: string;
  ELIM_USER_ID?: number;
  ELIM_USER_DATE?: string;
  REST_USER_ID?: number;
  REST_USER_DATE?: string;
  [key: string]: unknown;
}

export interface Career {
  careerId?: number | string;
  careerName?: string;
  careerCode?: number;
  minimumGrade?: number;
  careerAbbreviation?: string;
  careerType?: string;
  status?: boolean;
  internshipTypeIds?: string[];
  internshipPriorities?: number[];
  [key: string]: unknown;
}
