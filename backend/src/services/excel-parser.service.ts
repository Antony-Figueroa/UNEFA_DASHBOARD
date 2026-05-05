import * as XLSX from 'xlsx';

/**
 * Representa una fila de estudiante importada desde Excel (nueva estructura completa)
 */
export interface StudentImportRow {
  rowNumber: number;
  // Cédula
  cedulaPrefix: string;
  cedulaNumber: string;
  // Nombres
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  // Datos personales
  sex: string;
  birthDate: string;
  civilStatus?: string;
  // Contacto
  phonePrefix?: string;
  phoneNumber?: string;
  email: string;
  address?: string;
  // Académico
  careerCode: string;
  regime: string;
  semester: string;
  section: string;
  studentType: string;
  militaryRank?: string;
  works?: string;
}

/**
 * Representa una opción válida para un campo
 */
export interface ValidOption {
  id: string;
  name: string;
  abbreviation?: string;
}

/**
 * Resultado de normalización
 */
export interface MatchResult {
  matched: boolean;
  value: string;
  matchedId?: string;
  originalValue: string;
  suggestions?: string[];
}

/**
 * Resultado de validación de una fila
 */
export interface ValidationResult {
  rowNumber: number;
  status: 'valid' | 'warning' | 'error';
  cedula: string;
  fullName: string;
  messages: string[];
  // Datos adicionales para el frontend
  sexo?: string;
  birthDate?: string;
  email?: string;
  career?: string;
  existingStudent?: {
    studentId: number;
    status: number;
    name: string;
  };
  age?: number;
}

/**
 * Resultado de ejecución
 */
export interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  results: Array<{
    row: number;
    status: 'created' | 'updated' | 'error';
    message: string;
    studentId?: number;
  }>;
}

/**
 * Datos de configuración para la plantilla
 */
export interface TemplateConfig {
  careers: Array<{ id: string; name: string; code: string }>;
  prefixes: ValidOption[];
  phonePrefixes: ValidOption[];
  civilStatuses: ValidOption[];
  regimes: ValidOption[];
  studentTypes: ValidOption[];
  militaryRanks: ValidOption[];
  sexes: ValidOption[];
  workOptions: ValidOption[];
  semesters: string[];
  sections: string[];
}

/**
 * Normaliza una cédula
 */
export const normalizeCedula = (prefix: string, number: string): string => {
  if (!number) return '';
  const validPrefixes = ['V', 'E', 'J', 'P', 'G'];
  const p = validPrefixes.includes(prefix?.toUpperCase()) ? prefix.toUpperCase() : 'V';
  return `${p}-${number.replace(/\D/g, '')}`;
};

/**
 * Calcula la edad
 */
export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;
  
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Normaliza un valor contra opciones válidas
 */
export const normalizeValue = (
  value: string,
  validOptions: ValidOption[]
): MatchResult => {
  if (!value) {
    return { matched: false, value: '', originalValue: '' };
  }

  const normalized = value.trim().toUpperCase();
  
  // Buscar por nombre
  const byName = validOptions.find(opt => opt.name.toUpperCase() === normalized);
  if (byName) {
    return { matched: true, value: byName.abbreviation || byName.name, matchedId: byName.id, originalValue: value };
  }
  
  // Buscar por abreviatura
  const byAbbrev = validOptions.find(opt => opt.abbreviation?.toUpperCase() === normalized);
  if (byAbbrev) {
    return { matched: true, value: byAbbrev.abbreviation || byAbbrev.name, matchedId: byAbbrev.id, originalValue: value };
  }
  
  // Coincidencia parcial
  const partial = validOptions.find(opt => opt.name.toUpperCase().includes(normalized) || normalized.includes(opt.name.toUpperCase()));
  if (partial) {
    return { matched: true, value: partial.abbreviation || partial.name, matchedId: partial.id, originalValue: value };
  }

  return {
    matched: false,
    value: normalized,
    originalValue: value,
    suggestions: validOptions.map(o => o.name)
  };
};

/**
 * Busca carrera por código o nombre
 */
export const findCareer = (
  value: string,
  careers: Array<{ id: string; name: string; code: string }>
): { found: boolean; id?: string; code: string; name: string } => {
  if (!value) return { found: false, code: '', name: '' };
  
  const normalized = value.trim().toUpperCase();
  
  // Por código
  const byCode = careers.find(c => c.code.toUpperCase() === normalized);
  if (byCode) return { found: true, id: byCode.id, code: byCode.code, name: byCode.name };
  
  // Por nombre
  const byName = careers.find(c => c.name.toUpperCase() === normalized);
  if (byName) return { found: true, id: byName.id, code: byName.code, name: byName.name };
  
  // Parcial
  const partial = careers.find(c => c.name.toUpperCase().includes(normalized) || normalized.includes(c.name.toUpperCase()));
  if (partial) return { found: true, id: partial.id, code: partial.code, name: partial.name };
  
  return { found: false, code: normalized, name: value };
};

/**
 * Genera plantilla con los datos de la BD
 */
export const generateTemplate = async (config: TemplateConfig): Promise<Buffer> => {
  const workbook = XLSX.utils.book_new();
  
  const headers = [
    'PREFIJO_CI', 'CEDULA', 'PRIMER_NOMBRE', 'SEGUNDO_NOMBRE', 'APELLIDO', 'SEGUNDO_APELLIDO',
    'SEXO', 'FECHA_NACIMIENTO', 'ESTADO_CIVIL', 'PREFIJO_TELEFONO', 'TELEFONO',
    'CORREO', 'DIRECCION', 'CARRERA', 'REGIMEN', 'SEMESTRE', 'SECCION',
    'TIPO_ESTUDIANTE', 'RANGO_MILITAR', 'TRABAJA'
  ];

  // Valores por defecto válidos - siempre tener algo
  const pref = config.prefixes[0]?.abbreviation || 'V';
  const sex = config.sexes[0]?.abbreviation || 'M';
  const civil = config.civilStatuses[0]?.name || 'SOLTERO';
  const phonePref = config.phonePrefixes[0]?.abbreviation || '0412';
  const career = config.careers[0]?.code || '';
  const regime = config.regimes[0]?.abbreviation || '';
  const semester = config.semesters[0] || '1';
  const section = config.sections[0] || 'A';
  const tipo = config.studentTypes[0]?.abbreviation || '';
  const trabaja = 'NO'; // Siempre NO para evitar error de rango militar

  // Ejemplo COMPLETO válido (toda la fila con datos)
  const example = [
    pref,                      // PREFIJO_CI
    '99999999',                // CEDULA (número alto para evitar conflictos)
    'Juan',                   // PRIMER_NOMBRE
    'Antonio',                // SEGUNDO_NOMBRE
    'Pérez',                 // APELLIDO
    'García',                // SEGUNDO_APELLIDO
    sex,                      // SEXO
    '2010-01-15',             // FECHA_NACIMIENTO (16+ años)
    civil,                    // ESTADO_CIVIL
    phonePref,                // PREFIJO_TELEFONO
    '1234567',                // TELEFONO
    'juan.perez@test.com',   // CORREO
    'Caracas',                // DIRECCION
    career,                   // CARRERA
    regime,                   // REGIMEN
    semester,                 // SEMESTRE
    section,                  // SECCION
    tipo,                     // TIPO_ESTUDIANTE
    '',                       // RANGO_MILITAR (vacío porque TRABAJA=NO)
    trabaja                   // TRABAJA
  ];

  const sheet = XLSX.utils.aoa_to_sheet([headers, example]);
  
  sheet['!cols'] = [
    { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 6 },
    { wch: 14 }, { wch: 14 }, { wch: 6 }
  ];

  XLSX.utils.book_append_sheet(workbook, sheet, 'Importar');

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
};

/**
 * Parsea archivo Excel con nueva estructura
 */
export const parseExcelFile = async (buffer: Buffer): Promise<StudentImportRow[]> => {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  
  const sheetName = workbook.SheetNames.find(s => s.includes('Importar')) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { 
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd'
  }) as Record<string, unknown>[];

  if (!rawData || rawData.length === 0) {
    throw new Error('El archivo Excel está vacío');
  }

  // Headers disponibles
  const headers = Object.keys(rawData[0]).map(h => h.trim().toUpperCase());
  
  // Mapeo de headers
  const getHeader = (names: string[]): string => {
    return Object.keys(rawData[0]).find(h => 
      names.some(n => h.trim().toUpperCase().includes(n))
    ) || '';
  };

  const headerMap = {
    prefixCi: getHeader(['PREFIJO', 'PREFIJO_CI']),
    cedula: getHeader(['CEDULA', 'CI']),
    firstName: getHeader(['PRIMER', 'NOMBRE']),
    middleName: getHeader(['SEGUNDO', 'NOMBRE']),
    lastName: getHeader(['APELLIDO']),
    secondLastName: getHeader(['SEGUNDO', 'APELLIDO']),
    sex: getHeader(['SEXO', 'GENERO']),
    birthDate: getHeader(['NACIMIENTO', 'FECHA']),
    civilStatus: getHeader(['CIVIL', 'ESTADO']),
    phonePrefix: getHeader(['PREFIJO', 'TELEFONO']),
    phoneNumber: getHeader(['TELEFONO']),
    email: getHeader(['CORREO', 'EMAIL']),
    address: getHeader(['DIRECCION', 'DIRECCIÓN']),
    career: getHeader(['CARRERA']),
    regime: getHeader(['REGIMEN', 'RÉGIMEN']),
    semester: getHeader(['SEMESTRE']),
    section: getHeader(['SECCION', 'SECCIÓN']),
    studentType: getHeader(['TIPO', 'ESTUDIANTE']),
    militaryRank: getHeader(['RANGO', 'MILITAR']),
    works: getHeader(['TRABAJA', 'TRABAJ'])
  };

  // Validar headers requeridos
  const required = [headerMap.prefixCi, headerMap.cedula, headerMap.firstName, headerMap.lastName, 
                  headerMap.sex, headerMap.birthDate, headerMap.email, headerMap.career];
  const missing = required.filter(h => !h);
  
  if (missing.length > 0) {
    throw new Error(`Faltan columnas requeridas: ${missing.join(', ')}`);
  }

  // Mapear filas
  const rows: StudentImportRow[] = rawData.map((row, index) => {
    const getVal = (key: string): string => {
      if (!key || !row[key]) return '';
      let val = row[key];
      if (val instanceof Date) return val.toISOString().split('T')[0];
      return String(val).trim();
    };

    return {
      rowNumber: index + 2,
      cedulaPrefix: getVal(headerMap.prefixCi),
      cedulaNumber: getVal(headerMap.cedula),
      firstName: getVal(headerMap.firstName),
      middleName: getVal(headerMap.middleName) || undefined,
      lastName: getVal(headerMap.lastName),
      secondLastName: getVal(headerMap.secondLastName) || undefined,
      sex: getVal(headerMap.sex),
      birthDate: getVal(headerMap.birthDate),
      civilStatus: getVal(headerMap.civilStatus) || undefined,
      phonePrefix: getVal(headerMap.phonePrefix) || undefined,
      phoneNumber: getVal(headerMap.phoneNumber) || undefined,
      email: getVal(headerMap.email),
      address: getVal(headerMap.address) || undefined,
      careerCode: getVal(headerMap.career),
      regime: getVal(headerMap.regime),
      semester: getVal(headerMap.semester) || '1',
      section: getVal(headerMap.section) || 'A',
      studentType: getVal(headerMap.studentType),
      militaryRank: getVal(headerMap.militaryRank) || undefined,
      works: getVal(headerMap.works)
    };
  });

  // Filtrar filas vacías
  return rows.filter(r => r.cedulaNumber || r.firstName);
};

/**
 * Valida una fila
 */
export const validateRow = (
  row: StudentImportRow,
  config: TemplateConfig,
  existingStudents: Map<string, { studentId: number; status: number; name: string }>
): ValidationResult => {
  const messages: string[] = [];
  
  // 1. Cédula - verificar que ambos campos existan
  const validPrefixes = config.prefixes.length > 0 
    ? config.prefixes.map(p => (p.abbreviation || p.name).toUpperCase())
    : ['V', 'E', 'J', 'P', 'G']; // defaults si no hay lista
  const prefixValue = row.cedulaPrefix?.toUpperCase() || '';
  const numberValue = row.cedulaNumber?.trim() || '';
  const cedulaFull = `${prefixValue}-${numberValue}`;
  
  // Solo validar si hay datos de cédula
  if (!prefixValue && !numberValue) {
    messages.push('Cédula requerida');
  } else if (prefixValue && !validPrefixes.includes(prefixValue)) {
    messages.push(`Prefijo CI inválido. Usar: ${validPrefixes.join(', ')}`);
  } else if (numberValue && numberValue.length < 5) {
    messages.push('Cédula debe tener al menos 5 dígitos');
  } else if (prefixValue && numberValue) {
    // Cédula válida
  } else if (prefixValue && !numberValue) {
    messages.push('Falta el número de cédula');
  }
  
  const fullCedula = normalizeCedula(row.cedulaPrefix, row.cedulaNumber);
  
  // 2. Nombres - solo warning si faltan
  if (!row.firstName) messages.push('Primer nombre requerido');
  if (!row.lastName) messages.push('Apellido requerido');
  
  const fullName = `${row.firstName || ''} ${row.middleName || ''} ${row.lastName || ''} ${row.secondLastName || ''}`.trim();
  
  // 3. Sexo - solo validar si está presente
  const validSexes = config.sexes.length > 0 
    ? config.sexes.map(s => (s.abbreviation || s.name).toUpperCase())
    : ['M', 'F']; // defaults
  const sexValue = row.sex?.toUpperCase() || '';
  if (row.sex && validSexes.length > 0 && !validSexes.includes(sexValue)) {
    messages.push(`Sexo inválido. Usar: ${validSexes.join(', ')}`);
  }
  
  // 4. Fecha nacimiento y edad
  let age: number | undefined;
  if (!row.birthDate) {
    messages.push('Fecha de nacimiento requerida');
  } else {
    const birthDate = new Date(row.birthDate);
    if (isNaN(birthDate.getTime())) {
      messages.push('Fecha de nacimiento inválida');
    } else {
      age = calculateAge(row.birthDate);
      if (age < 16) {
        messages.push(`El estudiante debe tener al menos 16 años (tiene ${age} años)`);
      }
    }
  }
  
  // 5. Correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!row.email || !emailRegex.test(row.email)) {
    messages.push('Correo electrónico inválido');
  }
  
  // 6. Carrera
  const career = findCareer(row.careerCode, config.careers);
  if (config.careers.length > 0 && !career.found) {
    messages.push(`Carrera "${row.careerCode}" no encontrada. Códigos válidos: ${config.careers.map(c => c.code).join(', ')}`);
  }
  
  // 7. Régimen
  const validRegimes = config.regimes.map(r => (r.abbreviation || r.name).toUpperCase());
  const regimeValue = row.regime?.toUpperCase() || '';
  if (config.regimes.length > 0 && !validRegimes.includes(regimeValue)) {
    messages.push(`Régimen inválido. Usar: ${validRegimes.join(', ')}`);
  }
  
  // 8. Tipo estudiante
  const validTypes = config.studentTypes.map(t => (t.abbreviation || t.name).toUpperCase());
  const typeValue = row.studentType?.toUpperCase() || '';
  if (config.studentTypes.length > 0 && !validTypes.includes(typeValue)) {
    messages.push(`Tipo inválido. Usar: ${validTypes.join(', ')}`);
  }
  
  // 9. Semestre
  const validSemesters = config.semesters.map(s => String(s));
  const semesterValue = String(row.semester || '');
  if (config.semesters.length > 0 && !validSemesters.includes(semesterValue)) {
    messages.push(`Semestre inválido. Usar: ${validSemesters.join(', ')}`);
  }
  
  // 10. Trabaja - solo warning si está presente
  const workValue = row.works?.toUpperCase() || 'NO';
  if (row.works) {
    const workValues = config.workOptions.map(w => (w.abbreviation || w.name).toUpperCase());
    if (workValues.length > 0 && !workValues.includes(workValue)) {
      messages.push(`Valor de TRABAJA inválido. Usar: ${workValues.join(', ')}`);
    }
  }
  
  // 11. Rango militar - solo si trabaja = SI
  if (workValue === 'SI' && !row.militaryRank) {
    messages.push('Si TRABAJA = SI, debe especificar RANGO_MILITAR');
  }
  
  // ---- ADVERTENCIAS ----
  const existing = existingStudents.get(fullCedula);
  let existingInfo: ValidationResult['existingStudent'];
  if (existing) {
    if (existing.status === 0) {
      messages.push(`Cédula ${fullCedula} existe pero está INACTIVA. Se reactivará.`);
      existingInfo = existing;
    } else {
      messages.push(`Cédula ${fullCedula} ya registrada. Se actualizará.`);
      existingInfo = existing;
    }
  }
  
  return {
    rowNumber: row.rowNumber,
    status: messages.filter(m => m.includes('inválida') || m.includes('requerida') || m.includes('debe')).length > 0 ? 'error' : 'warning',
    cedula: fullCedula,
    fullName,
    messages: messages.filter(m => m),
    // Datos adicionales
    sexo: row.sex,
    birthDate: row.birthDate,
    email: row.email,
    career: row.careerCode,
    existingStudent: existingInfo,
    age
  };
};

/**
 * Convierte al formato de BD
 */
export const mapToDbRecord = (
  row: StudentImportRow,
  config: TemplateConfig
): Record<string, unknown> => {
  const fullCedula = normalizeCedula(row.cedulaPrefix, row.cedulaNumber);
  
  // Normalizar sexo
  const sexMap: Record<string, string> = {};
  config.sexes.forEach(s => {
    sexMap[s.name.toUpperCase()] = s.abbreviation || s.name;
    sexMap[s.abbreviation?.toUpperCase() || ''] = s.abbreviation || s.name;
  });
  
  // Normalizar estado civil
  const civilResult = normalizeValue(row.civilStatus || 'SOLTERO', config.civilStatuses);
  
  // Normalizar régimen
  const regimeResult = normalizeValue(row.regime, config.regimes);
  
  // Normalizar tipo estudiante
  const typeResult = normalizeValue(row.studentType, config.studentTypes);
  
  // Buscar carrera
  const career = findCareer(row.careerCode, config.careers);
  
  // Normalizar trabaja
  const workResult = normalizeValue(row.works || 'NO', config.workOptions);
  
  // Normalizar rango militar
  const rankResult = row.militaryRank 
    ? normalizeValue(row.militaryRank, config.militaryRanks)
    : { matched: false, value: '' };
  
  // Teléfono
  const phone = row.phonePrefix && row.phoneNumber 
    ? `${row.phonePrefix}-${row.phoneNumber}` 
    : null;
  
  const sexValue = row.sex?.toUpperCase() || 'O';
  
  return {
    STUDENTS_CI: fullCedula,
    NAME: row.firstName,
    SURNAME: row.lastName,
    SECOND_NAME: row.middleName || null,
    SECOND_SURNAME: row.secondLastName || null,
    GENDER: sexMap[sexValue] || 'O',
    BIRTHDATE: row.birthDate,
    MARITAL_STATUS: civilResult.value || 'S',
    CONTACT_PHONE: phone,
    EMAIL: row.email,
    ADDRESS: row.address || null,
    CAREER_ID: career.id ? parseInt(career.id) : null,
    REGIME: regimeResult.value || 'D1',
    STUDENT_TYPE: typeResult.value || 'NUEVO',
    SEMESTER: row.semester || '1',
    SECTION: row.section || 'A',
    MILITARY_RANK: rankResult.value || null,
    EMPLOYMENT: workResult.value === 'SI' ? 'SI' : 'NO',
    STATUS: 1,
    REGISTRATION_DATE: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
};