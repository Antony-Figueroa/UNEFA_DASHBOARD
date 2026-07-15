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
  // Académico (t_students)
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
  existingStudent?: {
    studentId: number;
    status: number;
    name: string;
  };
  age?: number;
  originalRow?: StudentImportRow;
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
  prefixes: ValidOption[];
  phonePrefixes: ValidOption[];
  civilStatuses: ValidOption[];
  studentTypes: ValidOption[];
  militaryRanks: ValidOption[];
  sexes: ValidOption[];
  workOptions: ValidOption[];
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
  let birth: Date;
  const dateStr = birthDate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    birth = new Date(dateStr);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    birth = new Date(`${y}-${m}-${d}`);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('-');
    birth = new Date(`${y}-${m}-${d}`);
  } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('.');
    birth = new Date(`${y}-${m}-${d}`);
  } else {
    birth = new Date(dateStr);
  }
  
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
    'CORREO', 'DIRECCION',
    'TIPO_ESTUDIANTE', 'RANGO_MILITAR', 'TRABAJA'
  ];

  // Valores de referencia
  const pref = config.prefixes[0]?.abbreviation || 'V';
  const defaultSex = config.sexes[0]?.abbreviation || 'M';
  const civil = config.civilStatuses[0]?.name || 'SOLTERO';
  const phonePref = config.phonePrefixes[0]?.abbreviation || '0412';
  const tipo = config.studentTypes[0]?.abbreviation || 'CIV';

  // Datos de prueba variados — el usuario los reemplaza con los suyos
  const rows = [
    [pref, '12345678', 'Juan',   'Carlos',  'Pérez',   'González', 'M', '2006-03-15', civil, phonePref, '3456789', 'juan.perez@ejemplo.com',   'Av. Principal, Caracas',      tipo, '',    'NO'],
    [pref, '23456789', 'María',  'José',    'López',   'Rodríguez', 'F', '2005-08-22', civil, '0414',    '5678901',  'maria.lopez@ejemplo.com',  'Calle 5, Maracaibo',           'MIL', 'CNEL', 'NO'],
    [pref, '34567890', 'Pedro',  'Antonio', 'Martínez','',          'M', '2004-11-10', civil, '0424',    '6789012',  'pedro.martinez@ejemplo.com','Urb. Las Flores, Valencia',     tipo, '',     'SI'],
    [pref, '45678901', 'Ana',    'Isabel',  'García',  'Torres',    'F', '2006-01-30', civil, '0416',    '7890123',  'ana.garcia@ejemplo.com',    'Calle 10, Barquisimeto',        tipo, '',     'NO'],
  ];

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  sheet['!cols'] = [
    { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 30 }, { wch: 40 },
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
  
  // Mapeo de headers - usa exact match o startsWith para evitar colisiones (ej: PREFIJO_CI contiene CI)
  const getHeader = (names: string[]): string => {
    const keys = Object.keys(rawData[0]).map(k => k.trim().toUpperCase());
    // 1. Exact match
    for (const name of names) {
      const idx = keys.findIndex(k => k === name.toUpperCase());
      if (idx >= 0) return Object.keys(rawData[0])[idx];
    }
    // 2. StartsWith match (e.g., "PREFIJO_CI" starts with "PREFIJO")
    for (const name of names) {
      const idx = keys.findIndex(k => k.startsWith(name.toUpperCase()));
      if (idx >= 0) return Object.keys(rawData[0])[idx];
    }
    // 3. EndsWith match (e.g., "CEDULA" ends with "CI" - but avoid "PREFIJO_CI" ending with "CI")
    for (const name of names) {
      const upperName = name.toUpperCase();
      const idx = keys.findIndex(k => k.endsWith(upperName) && k.length > upperName.length);
      if (idx >= 0) return Object.keys(rawData[0])[idx];
    }
    return '';
  };

  const headerMap = {
    prefixCi: getHeader(['PREFIJO_CI', 'PREFIJO']),
    cedula: getHeader(['CEDULA']),
    firstName: getHeader(['PRIMER_NOMBRE', 'PRIMER', 'NOMBRE']),
    middleName: getHeader(['SEGUNDO_NOMBRE', 'SEGUNDO', 'NOMBRE']),
    lastName: getHeader(['APELLIDO']),
    secondLastName: getHeader(['SEGUNDO_APELLIDO', 'SEGUNDO', 'APELLIDO']),
    sex: getHeader(['SEXO', 'GENERO']),
    birthDate: getHeader(['FECHA_NACIMIENTO', 'NACIMIENTO', 'FECHA']),
    civilStatus: getHeader(['ESTADO_CIVIL', 'CIVIL', 'ESTADO']),
    phonePrefix: getHeader(['PREFIJO_TELEFONO', 'PREFIJO', 'TELEFONO']),
    phoneNumber: getHeader(['TELEFONO']),
    email: getHeader(['CORREO', 'EMAIL']),
    address: getHeader(['DIRECCION', 'DIRECCIÓN']),
    studentType: getHeader(['TIPO_ESTUDIANTE', 'TIPO', 'ESTUDIANTE']),
    militaryRank: getHeader(['RANGO_MILITAR', 'RANGO', 'MILITAR']),
    works: getHeader(['TRABAJA', 'TRABAJ'])
  };

  // Validar headers requeridos mínimos
  const required = [headerMap.cedula, headerMap.firstName];
  const missing = required.filter(h => !h);
  
  if (missing.length > 0) {
    throw new Error('Faltan columnas requeridas básicas (Cédula o Primer Nombre)');
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
  const validPrefixes = config.prefixes.map(p => (p.abbreviation || p.name).toUpperCase());
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
  const validSexes = config.sexes.map(s => (s.abbreviation || s.name).toUpperCase());
  const sexValue = row.sex?.toUpperCase() || '';
  if (row.sex && !validSexes.includes(sexValue)) {
    messages.push(`Sexo inválido. Usar: ${validSexes.join(', ')}`);
  }
  
  // 4. Fecha nacimiento y edad
  let age: number | undefined;
  if (!row.birthDate) {
    messages.push('Fecha de nacimiento requerida');
  } else {
    // Aceptar YYYY-MM-DD o DD/MM/YYYY
    let birthDate: Date;
    const dateStr = row.birthDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      birthDate = new Date(dateStr);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('/');
      birthDate = new Date(`${y}-${m}-${d}`);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('-');
      birthDate = new Date(`${y}-${m}-${d}`);
    } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('.');
      birthDate = new Date(`${y}-${m}-${d}`);
    } else {
      birthDate = new Date(dateStr);
    }
    
    if (isNaN(birthDate.getTime())) {
      messages.push('Fecha de nacimiento inválida');
    } else {
      age = calculateAge(dateStr);
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
  
  // 6. Tipo estudiante (opcional, por defecto CIV)
  if (row.studentType) {
    const typeResult = normalizeValue(row.studentType, config.studentTypes);
    if (!typeResult.matched && config.studentTypes.length > 0) {
      const validTypes = config.studentTypes.map(t => (t.abbreviation || t.name).toUpperCase());
      messages.push(`Tipo inválido. Usar: ${[...new Set(validTypes)].join(', ')}`);
    }
  }
  
  // 7. Trabaja
  const workValue = row.works?.toUpperCase() || 'NO';
  if (row.works) {
    const workValues = config.workOptions.map(w => (w.abbreviation || w.name).toUpperCase());
    if (workValues.length > 0 && !workValues.includes(workValue)) {
      messages.push(`Valor de TRABAJA inválido. Usar: ${workValues.join(', ')}`);
    }
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
  
  const errorMessages = messages.filter(m => !m.includes('existe pero está INACTIVA') && !m.includes('ya registrada'));
  const warningMessages = messages.filter(m => m.includes('existe pero está INACTIVA') || m.includes('ya registrada'));
  
  return {
    rowNumber: row.rowNumber,
    status: errorMessages.length > 0 ? 'error' : (warningMessages.length > 0 ? 'warning' : 'valid'),
    cedula: fullCedula,
    fullName,
    messages: messages.filter(m => m),
    // Datos adicionales
    sexo: row.sex,
    birthDate: row.birthDate,
    email: row.email,
    existingStudent: existingInfo,
    age,
    originalRow: row
  };
};

/**
 * Auto-formatea/normaliza una fila corrigiendo errores comunes
 */
export const autoFormatRow = (
  row: StudentImportRow,
  config: TemplateConfig
): StudentImportRow => {
  const formatted = { ...row };

  // 1. Cédula: normalizar prefijo y limpiar número
  if (formatted.cedulaPrefix || formatted.cedulaNumber) {
    const validPrefixes = config.prefixes.map(p => (p.abbreviation || p.name).toUpperCase());
    const prefix = formatted.cedulaPrefix?.toUpperCase().trim() || '';
    if (prefix && validPrefixes.includes(prefix)) {
      formatted.cedulaPrefix = prefix;
    } else if (prefix) {
      // Intentar mapear por nombre
      const matched = config.prefixes.find(p => 
        p.name.toUpperCase().includes(prefix) || prefix.includes(p.name.toUpperCase())
      );
      formatted.cedulaPrefix = matched?.abbreviation || matched?.name || 'V';
    } else {
      formatted.cedulaPrefix = 'V';
    }
    formatted.cedulaNumber = formatted.cedulaNumber?.replace(/\D/g, '') || '';
  }

  // 2. Nombres: capitalizar correctamente
  const capitalize = (str?: string) => 
    str?.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || '';
  
  formatted.firstName = capitalize(formatted.firstName);
  formatted.middleName = formatted.middleName ? capitalize(formatted.middleName) : undefined;
  formatted.lastName = capitalize(formatted.lastName);
  formatted.secondLastName = formatted.secondLastName ? capitalize(formatted.secondLastName) : undefined;

  // 3. Sexo: normalizar a M/F
  if (formatted.sex) {
    const sexUpper = formatted.sex.toUpperCase().trim();
    if (['M', 'MASCULINO', 'MALE', 'HOMBRE'].includes(sexUpper)) formatted.sex = 'M';
    else if (['F', 'FEMENINO', 'FEMALE', 'MUJER'].includes(sexUpper)) formatted.sex = 'F';
    else {
      const validSexes = config.sexes.map(s => (s.abbreviation || s.name).toUpperCase());
      const matched = config.sexes.find(s => 
        (s.abbreviation || s.name).toUpperCase() === sexUpper ||
        s.name.toUpperCase().includes(sexUpper)
      );
      formatted.sex = matched?.abbreviation || matched?.name || '';
    }
  }

  // 4. Fecha nacimiento: normalizar a DD/MM/YYYY
  if (formatted.birthDate) {
    const dateStr = formatted.birthDate.trim();
    // Intentar varios formatos
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/,     // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/,   // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}$/,     // DD-MM-YYYY
      /^\d{2}\.\d{2}\.\d{4}$/,   // DD.MM.YYYY
    ];
    let parsed: Date | null = null;
    if (formats[0].test(dateStr)) {
      parsed = new Date(dateStr);
    } else if (formats[1].test(dateStr)) {
      const [d, m, y] = dateStr.split('/');
      parsed = new Date(`${y}-${m}-${d}`);
    } else if (formats[2].test(dateStr)) {
      const [d, m, y] = dateStr.split('-');
      parsed = new Date(`${y}-${m}-${d}`);
    } else if (formats[3].test(dateStr)) {
      const [d, m, y] = dateStr.split('.');
      parsed = new Date(`${y}-${m}-${d}`);
    }
    if (parsed && !isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      formatted.birthDate = `${day}/${month}/${year}`;
    }
  }

  // 5. Email: lowercase y trim
  if (formatted.email) {
    formatted.email = formatted.email.toLowerCase().trim();
  }

  // 6. Teléfono: limpiar y separar prefijo/número
  if (formatted.phonePrefix || formatted.phoneNumber) {
    const fullPhone = `${formatted.phonePrefix || ''}${formatted.phoneNumber || ''}`.replace(/\D/g, '');
    const validPrefixes = config.phonePrefixes.map(p => (p.abbreviation || p.name).replace(/\D/g, ''));
    let matchedPrefix = '';
    for (const vp of validPrefixes) {
      if (fullPhone.startsWith(vp)) {
        matchedPrefix = vp;
        break;
      }
    }
    if (matchedPrefix) {
      formatted.phonePrefix = matchedPrefix;
      formatted.phoneNumber = fullPhone.slice(matchedPrefix.length);
    } else if (fullPhone.length >= 7) {
      // Asumir prefijo de 4 dígitos si no coincide
      formatted.phonePrefix = fullPhone.slice(0, 4);
      formatted.phoneNumber = fullPhone.slice(4);
    }
  }

  // 7. Estado civil: normalizar contra opciones válidas
  if (formatted.civilStatus) {
    const civilResult = normalizeValue(formatted.civilStatus, config.civilStatuses);
    if (civilResult.matched) {
      formatted.civilStatus = civilResult.value;
    }
  }

  // 8. Tipo estudiante: normalizar
  if (formatted.studentType) {
    const typeResult = normalizeValue(formatted.studentType, config.studentTypes);
    if (typeResult.matched) {
      formatted.studentType = typeResult.value;
    }
  }

  // 9. Rango militar: normalizar
  if (formatted.militaryRank) {
    const rankResult = normalizeValue(formatted.militaryRank, config.militaryRanks);
    if (rankResult.matched) {
      formatted.militaryRank = rankResult.value;
    }
  }

  // 10. Trabaja: normalizar a SI/NO
  if (formatted.works) {
    const workUpper = formatted.works.toUpperCase().trim();
    if (['SI', 'SÍ', 'YES', 'TRUE', '1'].includes(workUpper)) formatted.works = 'SI';
    else if (['NO', 'NOT', 'FALSE', '0'].includes(workUpper)) formatted.works = 'NO';
    else {
      const workResult = normalizeValue(formatted.works, config.workOptions);
      if (workResult.matched) formatted.works = workResult.value;
    }
  }

  return formatted;
};

/**
 * Convierte al formato de BD
 */
export const mapToDbRecord = (
  row: StudentImportRow,
  config: TemplateConfig
): Record<string, unknown> => {
  // Normalizar tipo estudiante
  const typeResult = normalizeValue(row.studentType, config.studentTypes);
  
  // Normalizar trabaja
  const workResult = normalizeValue(row.works || 'NO', config.workOptions);
  
  // Normalizar rango militar
  const rankResult = row.militaryRank 
    ? normalizeValue(row.militaryRank, config.militaryRanks)
    : { matched: false, value: '' };
  
  return {
    STUDENT_TYPE: typeResult.value || 'CIV',
    MILITARY_RANK: rankResult.value || null,
    EMPLOYMENT: workResult.value === 'SI' ? 'SI' : 'NO',
    STATUS: 1,
    REGISTRATION_DATE: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
};