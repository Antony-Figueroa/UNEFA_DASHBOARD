import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';
import * as listsService from '../services/lists.service.js';
import * as careersService from '../services/careers.service.js';
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
  
  // Obtener carreras
  const careers = await careersService.getCareers();
  
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
    // Fallback si no hay lista
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
  
  // Regímenes
  const regList = lists.find(l => 
    l.name.toUpperCase().includes('REGIMEN') || 
    l.name.toUpperCase().includes('RÉGIMEN') ||
    l.name.toUpperCase().includes('TURNO')
  );
  const regimes = (regList?.values || []).map(v => ({
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
    careers: careers.map(c => ({
      id: String(c.careerId),
      name: c.careerName || '',
      code: c.careerCode ? String(c.careerCode) : ''
    })),
    prefixes,
    phonePrefixes,
    civilStatuses,
    regimes,
    studentTypes,
    militaryRanks,
    sexes,
    workOptions,
    semesters: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    sections: ['A', 'B', 'C', 'U']
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
      
      // Si hay errores, no importer esa fila
      if (result.status === 'error') {
        validationResults.push(result);
        continue;
      }
      
      // Si hay advertencias y no confirmada, registrar pero no ejecutar
      if (result.status === 'warning' && !confirmed) {
        validationResults.push(result);
        continue;
      }
      
      // Determinar si crear o actualizar
      const fullCedula = `${row.cedulaPrefix}-${row.cedulaNumber}`;
      const existing = existingStudents.get(fullCedula);
      
      if (existing) {
        // Actualizar estudiante existente
        const dbData = mapToDbRecord(row, config);

        // Actualizar datos de persona en t_persons
        const { data: studentRecord } = await supabase
          .from(TABLE_NAME)
          .select('person_id')
          .eq('STUDENTS_ID', existing.studentId)
          .single();

        if (studentRecord?.person_id) {
          const phone = row.phonePrefix && row.phoneNumber
            ? `${row.phonePrefix}-${row.phoneNumber}`
            : null;

          await supabase
            .from('t_persons')
            .update({
              email: row.email,
              phone: phone,
              gender: row.sex,
              birth_date: row.birthDate,
              address: row.address || null,
              marital_status: row.civilStatus || null
            })
            .eq('person_id', studentRecord.person_id);
        }

        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update({
            CAREER_ID: dbData.CAREER_ID,
            REGIME: dbData.REGIME,
            STUDENT_TYPE: dbData.STUDENT_TYPE,
            SEMESTER: dbData.SEMESTER,
            SECTION: dbData.SECTION,
            MILITARY_RANK: dbData.MILITARY_RANK,
            EMPLOYMENT: dbData.EMPLOYMENT,
            STATUS: 1
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
          validationResults.push({
            rowNumber: row.rowNumber,
            status: 'valid',
            cedula: fullCedula,
            fullName: `${row.firstName} ${row.lastName}`,
            messages: ['Estudiante actualizado exitosamente']
          });
        }
      } else {
        // Crear nuevo estudiante
        const dbData = mapToDbRecord(row, config);
        
        // Crear registro en t_persons primero
        const phone = row.phonePrefix && row.phoneNumber 
          ? `${row.phonePrefix}-${row.phoneNumber}` 
          : null;
        
        const { data: person, error: personError } = await supabase
          .from('t_persons')
          .insert([{
            ci: fullCedula,
            first_name: row.firstName,
            middle_name: row.middleName || null,
            last_name: row.lastName,
            second_last_name: row.secondLastName || null,
            email: row.email,
            phone: phone,
            gender: row.sex,
            birth_date: row.birthDate,
            address: row.address || null,
            status: 1
          }])
          .select('person_id')
          .single();
        
        if (personError) {
          validationResults.push({
            rowNumber: row.rowNumber,
            status: 'error',
            cedula: fullCedula,
            fullName: `${row.firstName} ${row.lastName}`,
            messages: ['Error al crear registro de persona: ' + personError.message]
          });
          continue;
        }
        
        const { data: insertData, error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([{
            person_id: person.person_id,
            CAREER_ID: dbData.CAREER_ID,
            REGIME: dbData.REGIME,
            STUDENT_TYPE: dbData.STUDENT_TYPE,
            SEMESTER: dbData.SEMESTER,
            SECTION: dbData.SECTION,
            MILITARY_RANK: dbData.MILITARY_RANK,
            EMPLOYMENT: dbData.EMPLOYMENT,
            STATUS: 1
          }])
          .select();
        
        if (insertError) {
          validationResults.push({
            rowNumber: row.rowNumber,
            status: 'error',
            cedula: fullCedula,
            fullName: `${row.firstName} ${row.lastName}`,
            messages: ['Error al crear: ' + insertError.message]
          });
        } else {
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