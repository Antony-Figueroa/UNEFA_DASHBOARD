import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';
import * as listsService from '../services/lists.service.js';
import * as personService from '../services/person.service.js';
import {
  parseExcelFile,
  generateTemplate,
  validateRow,
  mapToDbRecord,
  normalizeValue,
  validateRow as validateRowFn,
  TemplateConfig,
  ValidationResult
} from '../services/excel-parser.service.js';
import { supabase } from '../lib/supabase.js';
import { cacheManager } from '../lib/cache-manager.js';
import { sanitizeText } from '../utils/text-utils.js';
import { auditCreate } from '../utils/audit-helpers.js';

const TABLE_NAME = 't_students';
const CACHE_PREFIX = 'students:';

/**
 * Extrae el buffer de un archivo Multer
 */
const getFileBuffer = (file: Express.Multer.File): Buffer => {
  return file.buffer;
};

/**
 * Obtiene la configuración completa para la plantilla
 */
const getTemplateConfig = async (): Promise<TemplateConfig> => {
  // Obtener listas del sistema
  const lists = await listsService.getAllLists();
  
  // Prefijos de Cédula (hardcoded porque no hay lista en BD)
  const prefixes = [
    { id: '1', name: 'Venezolano', abbreviation: 'V' },
    { id: '2', name: 'Extranjero', abbreviation: 'E' },
    { id: '3', name: 'Jurídico', abbreviation: 'J' },
    { id: '4', name: 'Pasaporte', abbreviation: 'P' },
    { id: '5', name: 'Gestionado', abbreviation: 'G' }
  ];
  
  // Obtener prefijos de teléfono de la lista o usar defaults
  const phoneList = lists.find(l => l.name.toUpperCase() === 'PREFIJO');
  const phonePrefixes = (phoneList?.values || []).map(v => ({
    id: v.id,
    name: v.name,
    abbreviation: v.abbreviation
  }));
  if (phonePrefixes.length === 0) {
    phonePrefixes.push(
      { id: '1', name: '0412', abbreviation: '0412' },
      { id: '2', name: '0414', abbreviation: '0414' },
      { id: '3', name: '0424', abbreviation: '0424' },
      { id: '4', name: '0426', abbreviation: '0426' },
      { id: '5', name: '0212', abbreviation: '0212' }
    );
  }
  
  // Estados civiles
  const civilList = lists.find(l => l.name.toUpperCase().includes('REGISTRO') && l.name.toUpperCase().includes('CIVIL'));
  const civilStatuses = (civilList?.values || []).map(v => ({
    id: v.id,
    name: v.name,
    abbreviation: v.abbreviation
  }));
  
  // Tipos de estudiante
  const typeList = lists.find(l => 
    l.name.toUpperCase().includes('TIPO') && 
    l.name.toUpperCase().includes('ESTUDIANTE')
  );
  const studentTypes = (typeList?.values || []).map(v => ({
    id: v.id,
    name: v.name,
    abbreviation: v.abbreviation
  }));
  
  // Rangos militares
  const rankList = lists.find(l => l.name.toUpperCase().includes('RANGO') && l.name.toUpperCase().includes('MILITAR'));
  const militaryRanks = (rankList?.values || []).map(v => ({
    id: v.id,
    name: v.name,
    abbreviation: v.abbreviation
  }));
  
  // Sexos
  const sexoList = lists.find(l => l.name.toUpperCase() === 'SEXO');
  const sexes = (sexoList?.values || []).map(v => ({
    id: v.id,
    name: v.name,
    abbreviation: v.abbreviation
  }));
  
  // Opciones de trabajo
  const workList = lists.find(l => l.name.toUpperCase().includes('TRABAJO'));
  const workOptions = (workList?.values || []).map(v => ({
    id: v.id,
    name: v.name,
    abbreviation: v.abbreviation
  }));
  
  return {
    prefixes,
    phonePrefixes,
    civilStatuses,
    studentTypes,
    militaryRanks,
    sexes,
    workOptions
  };
};

/**
 * Obtiene estudiantes existentes por cédula
 */
const getExistingStudents = async (cedulas: string[]): Promise<Map<string, { studentId: number; status: number; name: string }>> => {
  if (cedulas.length === 0) return new Map();
  
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('STUDENTS_ID, STATUS, t_persons!inner(ci, first_name, last_name)')
    .in('t_persons.ci', cedulas);
  
  if (error) {
    console.error('[StudentsImport] Error fetching existing students:', error);
    return new Map();
  }
  
  const map = new Map<string, { studentId: number; status: number; name: string }>();
  (data || []).forEach(s => {
    map.set((s as any).t_persons?.ci, {
      studentId: s.STUDENTS_ID,
      status: s.STATUS,
      name: `${(s as any).t_persons?.first_name || ''} ${(s as any).t_persons?.last_name || ''}`.trim()
    });
  });
  
  return map;
};

/**
 * Valida Cédulas duplicadas dentro del mismo Excel
 */
const findDuplicateCedulas = (rows: any[]): Map<string, number[]> => {
  const cedulaMap = new Map<string, number[]>();
  
  rows.forEach(row => {
    const prefix = row.cedulaPrefix || 'V';
    const number = row.cedulaNumber || '';
    const fullCedula = `${prefix}-${number}`;
    
    if (!cedulaMap.has(fullCedula)) {
      cedulaMap.set(fullCedula, []);
    }
    cedulaMap.get(fullCedula)!.push(row.rowNumber);
  });
  
  // Solo devolver los duplicados
  const duplicates = new Map<string, number[]>();
  cedulaMap.forEach((rows, ci) => {
    if (rows.length > 1) {
      duplicates.set(ci, rows);
    }
  });
  
  return duplicates;
};

/**
 * Controlador: Valida un archivo Excel sin guardar
 */
export const validateImport = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ valid: false, message: 'No se ha proporcionado archivo' });
      return;
    }
    
    const buffer = getFileBuffer(req.file);
    
    // Parsear Excel
    const rows = await parseExcelFile(buffer);
    
    if (rows.length === 0) {
      res.status(400).json({ valid: false, message: 'El archivo está vacío' });
      return;
    }
    
    // Obtener config
    const config = await getTemplateConfig();
    
    // Obtener estudiantes existentes
    const cedulas = rows.map(r => `${r.cedulaPrefix}-${r.cedulaNumber}`);
    const existingStudents = await getExistingStudents(cedulas);
    
    // Verificar duplicados en el mismo Excel
    const duplicates = findDuplicateCedulas(rows);
    
    // Validar cada fila
    const validationResults: ValidationResult[] = [];
    
    for (const row of rows) {
      // Verificar duplicado en Excel
      if (duplicates.has(`${row.cedulaPrefix}-${row.cedulaNumber}`)) {
        validationResults.push({
          rowNumber: row.rowNumber,
          status: 'error',
          cedula: `${row.cedulaPrefix}-${row.cedulaNumber}`,
          fullName: `${row.firstName} ${row.lastName}`,
          messages: ['Cédula duplicada en el mismo archivo Excel']
        });
        continue;
      }
      
      // Validar fila
      const result = validateRowFn(row, config, existingStudents);
      validationResults.push(result);
    }
    
    const summary = {
      total: validationResults.length,
      validCount: validationResults.filter(r => r.status === 'valid').length,
      warningCount: validationResults.filter(r => r.status === 'warning').length,
      errorCount: validationResults.filter(r => r.status === 'error').length
    };
    
    res.json({
      valid: summary.errorCount === 0,
      rows: validationResults,
      summary
    });
    
  } catch (error: any) {
    console.error('[StudentsImport] Error en validación:', error);
    res.status(500).json({ valid: false, message: error.message });
  }
};

/**
 * Controlador: Ejecuta la importación
 */
const STUDENT_COLUMNS_TO_AUDIT = [
  'STUDENT_TYPE', 'MILITARY_RANK', 'EMPLOYMENT', 'STATUS'
];

const PERSON_COLUMNS_TO_AUDIT = [
  'ci', 'first_name', 'last_name', 'email', 'phone', 'gender', 'birthdate'
];

export const executeImport = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No se ha proporcionado archivo' });
      return;
    }
    
    const confirmed = req.body.confirmed === 'true';
    const buffer = getFileBuffer(req.file);
    
    // Parsear Excel
    const rows = await parseExcelFile(buffer);
    
    if (rows.length === 0) {
      res.status(400).json({ success: false, message: 'El archivo está vacío' });
      return;
    }
    
    // Obtener config
    const config = await getTemplateConfig();
    
    // Obtener estudiantes existentes
    const cedulas = rows.map(r => `${r.cedulaPrefix}-${r.cedulaNumber}`);
    const existingStudents = await getExistingStudents(cedulas);
    
    // Verificar duplicados en Excel
    const duplicates = findDuplicateCedulas(rows);
    
    // Validar cada fila
    const validationResults: ValidationResult[] = [];
    
    for (const row of rows) {
      if (duplicates.has(`${row.cedulaPrefix}-${row.cedulaNumber}`)) {
        validationResults.push({
          rowNumber: row.rowNumber,
          status: 'error',
          cedula: `${row.cedulaPrefix}-${row.cedulaNumber}`,
          fullName: `${row.firstName} ${row.lastName}`,
          messages: ['Cédula duplicada en el archivo']
        });
        continue;
      }
      
      const result = validateRowFn(row, config, existingStudents);
      
      // Si hay errores, no importar esa fila
      if (result.status === 'error') {
        validationResults.push(result);
        continue;
      }
      
      // Si hay advertencias y no confirmada, registrar pero no ejecutar
      if (result.status === 'warning' && !confirmed) {
        validationResults.push(result);
        continue;
      }
      
      const fullCedula = `${row.cedulaPrefix}-${row.cedulaNumber}`;
      const existing = existingStudents.get(fullCedula);
      const phone = row.phonePrefix && row.phoneNumber
        ? `${row.phonePrefix}-${row.phoneNumber}`
        : null;
      
      // Validar email único (contra toda t_persons, no solo estudiantes)
      if (row.email) {
        const existingPersonCi = existing
          ? await personService.getPersonByCi(fullCedula)
          : null;
        const emailCheck = await personService.validateUniqueEmail(
          row.email,
          existingPersonCi?.personId
        );
        if (!emailCheck.available) {
          validationResults.push({
            rowNumber: row.rowNumber,
            status: 'error',
            cedula: fullCedula,
            fullName: `${row.firstName} ${row.lastName}`,
            messages: [`El correo ${row.email} ya está registrado por otra persona`]
          });
          continue;
        }
      }
      
      if (existing) {
        // ── Actualizar estudiante existente ──
        const dbData = mapToDbRecord(row, config);

        const { data: studentRecord } = await supabase
          .from(TABLE_NAME)
          .select('person_id')
          .eq('STUDENTS_ID', existing.studentId)
          .single();

        if (studentRecord?.person_id) {
          await supabase
            .from('t_persons')
            .update({
              first_name: sanitizeText(row.firstName) ?? '',
              middle_name: sanitizeText(row.middleName) || null,
              last_name: sanitizeText(row.lastName) ?? '',
              second_last_name: sanitizeText(row.secondLastName) || null,
              email: row.email,
              phone: phone,
              gender: row.sex,
              birthdate: row.birthDate,
              address: row.address || null,
              marital_status: row.civilStatus || null
            })
            .eq('person_id', studentRecord.person_id);
        }

        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update({
            STUDENT_TYPE: dbData.STUDENT_TYPE,
            MILITARY_RANK: dbData.MILITARY_RANK,
            EMPLOYMENT: dbData.EMPLOYMENT
          })
          .eq('STUDENTS_ID', existing.studentId);
        
        if (updateError) {
          validationResults.push({
            rowNumber: row.rowNumber,
            status: 'error',
            cedula: fullCedula,
            fullName: `${row.firstName} ${row.lastName}`,
            messages: ['Error al actualizar: ' + updateError.message]
          });
        } else {
          // Audit
          try {
            await auditCreate(req, 't_students', { ...dbData, ci: fullCedula }, STUDENT_COLUMNS_TO_AUDIT, existing.studentId);
          } catch { /* silent */ }

          validationResults.push({
            rowNumber: row.rowNumber,
            status: 'valid',
            cedula: fullCedula,
            fullName: `${row.firstName} ${row.lastName}`,
            existingStudent: existing,
            messages: ['Estudiante actualizado exitosamente']
          });
        }
      } else {
        // ── Crear nuevo estudiante ──
        const dbData = mapToDbRecord(row, config);
        
        // Usar findOrCreatePerson para evitar duplicados de CI en t_persons
        const personData = {
          ci: fullCedula,
          firstName: sanitizeText(row.firstName) ?? '',
          middleName: sanitizeText(row.middleName) || null,
          lastName: sanitizeText(row.lastName) ?? '',
          secondLastName: sanitizeText(row.secondLastName) || null,
          email: row.email,
          phone: phone,
          gender: row.sex,
          birthDate: row.birthDate,
          address: row.address || null,
          maritalStatus: row.civilStatus || null,
          status: 1
        };

        let personId: number;
        try {
          const person = await personService.findOrCreatePerson(personData);
          personId = person.personId;
        } catch (pError: any) {
          // Si falló por email duplicado que se creó entre la validación y acá
          if (pError?.code === '23505' || (pError?.message && pError.message.includes('email'))) {
            validationResults.push({
              rowNumber: row.rowNumber,
              status: 'error',
              cedula: fullCedula,
              fullName: `${row.firstName} ${row.lastName}`,
              messages: ['El correo ya está registrado. Intentá de nuevo.']
            });
          } else {
            validationResults.push({
              rowNumber: row.rowNumber,
              status: 'error',
              cedula: fullCedula,
              fullName: `${row.firstName} ${row.lastName}`,
              messages: ['Error al crear registro de persona: ' + (pError?.message || 'Error desconocido')]
            });
          }
          continue;
        }
        
        const { data: insertData, error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([{
            person_id: personId,
            ...dbData
          }])
          .select('STUDENTS_ID');
        
        if (insertError) {
          validationResults.push({
            rowNumber: row.rowNumber,
            status: 'error',
            cedula: fullCedula,
            fullName: `${row.firstName} ${row.lastName}`,
            messages: ['Error al crear: ' + insertError.message]
          });
        } else {
          const newStudentId = (insertData?.[0] as any)?.STUDENTS_ID;
          
          // Audit
          try {
            await auditCreate(req, 't_students', { ...dbData, ci: fullCedula }, STUDENT_COLUMNS_TO_AUDIT, newStudentId);
          } catch { /* silent */ }

          validationResults.push({
            rowNumber: row.rowNumber,
            status: 'valid',
            cedula: fullCedula,
            fullName: `${row.firstName} ${row.lastName}`,
            messages: ['Estudiante creado exitosamente']
          });
        }
      }
    }
    
    const summary = {
      total: validationResults.length,
      validCount: validationResults.filter(r => r.status === 'valid').length,
      warningCount: validationResults.filter(r => r.status === 'warning').length,
      errorCount: validationResults.filter(r => r.status === 'error').length
    };
    
    // Clear cache
    cacheManager.deleteByPrefix(CACHE_PREFIX);
    
    res.json({
      success: summary.errorCount === 0,
      created: validationResults.filter(r => r.status === 'valid' && !r.existingStudent).length,
      updated: validationResults.filter(r => r.status === 'valid' && r.existingStudent).length,
      failed: summary.errorCount,
      results: validationResults
    });
    
  } catch (error: any) {
    console.error('[StudentsImport] Error en ejecución:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Controlador: Descarga la plantilla
 */
export const getTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const config = await getTemplateConfig();
    const buffer = await generateTemplate(config);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_estudiantes.xlsx');
    res.send(buffer);
    
  } catch (error: any) {
    console.error('[StudentsImport] Error al generar plantilla:', error);
    res.status(500).json({ message: error.message });
  }
};