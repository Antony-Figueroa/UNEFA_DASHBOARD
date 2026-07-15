import { Response } from 'express';
import * as XLSX from 'xlsx';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';
import { logAuthAction } from '../services/auth.service.js';
import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';

const STUDENT_COLUMNS = [
  'CEDULA_PREFIJO', 'CEDULA_NUMERO', 'PRIMER_NOMBRE', 'SEGUNDO_NOMBRE',
  'PRIMER_APELLIDO', 'SEGUNDO_APELLIDO', 'SEXO', 'FECHA_NACIMIENTO',
  'ESTADO_CIVIL', 'TELEFONO', 'CORREO', 'DIRECCION', 'TIPO_ESTUDIANTE', 'TRABAJA'
] as const;

const ENROLLMENT_COLUMNS = [
  'CEDULA_ESTUDIANTE', 'CARRERA', 'PERIODO', 'TIPO_PRACTICA', 'INSTITUCION'
] as const;

const BATCH_SIZE = 500;

// ─── Helpers ────────────────────────────────────────────────────────────────

function detectType(columns: string[]): 'students' | 'enrollments' {
  return columns.includes('CEDULA_PREFIJO') ? 'students' : 'enrollments';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(val: unknown): boolean {
  if (!val) return false;
  if (typeof val === 'number') return true; // Excel serial date
  const d = new Date(String(val));
  return !isNaN(d.getTime());
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    // Check if it's a date serial number (rough heuristic)
    if (val > 40000 && val < 60000) return String(val);
    return String(val);
  }
  return String(val).trim();
}

// ponytail: simple column lookup, no framework
function findColumn(columns: string[], ...names: string[]): number {
  for (const name of names) {
    const idx = columns.findIndex(c => c.toUpperCase().trim() === name.toUpperCase().trim());
    if (idx !== -1) return idx;
  }
  return -1;
}

function getRowValue(row: unknown[], colIdx: number): string {
  if (colIdx === -1 || colIdx >= row.length) return '';
  return formatCellValue(row[colIdx]);
}

// ─── Template Generation ────────────────────────────────────────────────────

/**
 * GET /api/bulk-import/template/:type
 * Genera una plantilla Excel con encabezado UNEFA, columnas y fila de ejemplo.
 */
export const getTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;
    if (type !== 'students' && type !== 'enrollments') {
      res.status(400).json({ message: 'Tipo de plantilla inválido. Use: students o enrollments' });
      return;
    }

    const wb = XLSX.utils.book_new();
    const columns = type === 'students' ? STUDENT_COLUMNS : ENROLLMENT_COLUMNS;
    const headerRows: string[][] = [];

    // Header institucional UNEFA
    headerRows.push(['REPÚBLICA BOLIVARIANA DE VENEZUELA']);
    headerRows.push(['MINISTERIO DEL PODER POPULAR PARA LA DEFENSA']);
    headerRows.push(['UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA DE LA FUERZA ARMADA BOLIVARIANA']);
    headerRows.push(['UNEFA - DIRECCIÓN DE ASUNTOS ACADÉMICOS']);
    headerRows.push([]); // blank row
    headerRows.push(type === 'students'
      ? ['PLANTILLA DE IMPORTACIÓN - DATOS DE ESTUDIANTES']
      : ['PLANTILLA DE IMPORTACIÓN - INSCRIPCIÓN DE PASANTÍAS']);
    headerRows.push([]);

    // Column headers
    headerRows.push([...columns]);

    // ponytail: one example row, that's enough
    if (type === 'students') {
      headerRows.push(['V', '12345678', 'JUAN', 'CARLOS', 'PÉREZ', 'GÓMEZ', 'M', '15/05/2000', 'SOLTERO', '0412-1234567', 'juan.perez@correo.com', 'Av. Principal', 'REGULAR', 'NO']);
    } else {
      headerRows.push(['V-12345678', 'INGENIERÍA EN SISTEMAS', '2025-I', 'PASANTÍA CORTA', 'EMPRESA EJEMPLO C.A.']);
    }

    const ws = XLSX.utils.aoa_to_sheet(headerRows);

    // Ancho de columnas
    ws['!cols'] = columns.map(() => ({ wch: 22 }));

    // Merge header cells for institutional text (first row spans all columns)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: columns.length - 1 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: columns.length - 1 } },
      { s: { r: 5, c: 0 }, e: { r: 5, c: columns.length - 1 } },
    ];

    const fileName = type === 'students' ? 'plantilla_estudiantes.xlsx' : 'plantilla_inscripciones.xlsx';
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error: any) {
    console.error('[BulkImport] Error generando plantilla:', error);
    res.status(500).json({ message: 'Error al generar la plantilla', error: error.message });
  }
};

// ─── Preview Import ─────────────────────────────────────────────────────────

/**
 * POST /api/bulk-import/preview
 * Recibe archivo Excel, parsea, valida y retorna resumen.
 */
export const previewImport = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No se ha proporcionado archivo' });
      return;
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Find the row with column headers (look for first row containing known columns)
    let dataStartRow = -1;
    let columns: string[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] as string[];
      const upper = row.map(c => String(c || '').toUpperCase().trim());
      if (upper.includes('CEDULA_PREFIJO') || upper.includes('CEDULA_ESTUDIANTE')) {
        columns = row.map(c => String(c || '').trim());
        dataStartRow = i + 1;
        break;
      }
    }

    if (dataStartRow === -1) {
      res.status(400).json({ success: false, message: 'No se encontraron encabezados de columnas en el archivo' });
      return;
    }

    const type = detectType(columns);
    const supabase = dbManager.getConnection();

    // Collect all CIs for duplicate check
    const ciColumnIdx = type === 'students'
      ? findColumn(columns, 'CEDULA_NUMERO')
      : findColumn(columns, 'CEDULA_ESTUDIANTE');
    const prefixColumnIdx = type === 'students'
      ? findColumn(columns, 'CEDULA_PREFIJO')
      : -1;

    const allCis: string[] = [];
    const rows: Array<{ row: number; data: Record<string, string>; errors: string[]; warnings: string[] }> = [];

    for (let i = dataStartRow; i < rawData.length; i++) {
      const rowData = rawData[i] as unknown[];
      const rowNum = i + 1; // 1-based for user display
      const data: Record<string, string> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      columns.forEach((col, idx) => {
        data[col] = getRowValue(rowData, idx);
      });

      // Skip completely empty rows
      if (columns.every(col => !data[col])) continue;

      if (type === 'students') {
        const prefix = getRowValue(rowData, prefixColumnIdx).toUpperCase();
        const ciNum = getRowValue(rowData, ciColumnIdx);

        // CEDULA_PREFIJO: V or E
        if (prefix && prefix !== 'V' && prefix !== 'E') {
          errors.push('CEDULA_PREFIJO debe ser V o E');
        }

        // Campos requeridos
        if (!prefix) errors.push('CEDULA_PREFIJO es requerido');
        if (!ciNum) errors.push('CEDULA_NUMERO es requerido');
        if (!data['PRIMER_NOMBRE']) errors.push('PRIMER_NOMBRE es requerido');
        if (!data['PRIMER_APELLIDO']) errors.push('PRIMER_APELLIDO es requerido');
        if (!data['SEXO']) errors.push('SEXO es requerido');
        if (!data['FECHA_NACIMIENTO']) errors.push('FECHA_NACIMIENTO es requerido');
        if (!data['CORREO']) errors.push('CORREO es requerido');

        // FECHA_NACIMIENTO: valid date
        if (data['FECHA_NACIMIENTO'] && !isValidDate(data['FECHA_NACIMIENTO'])) {
          errors.push('FECHA_NACIMIENTO no es una fecha válida');
        }

        // CORREO: email format
        if (data['CORREO'] && !isValidEmail(data['CORREO'])) {
          errors.push('CORREO no tiene formato de email válido');
        }

        // TELEFONO: mínimo 7 caracteres (digits only after removing non-digits)
        if (data['TELEFONO']) {
          const digits = data['TELEFONO'].replace(/\D/g, '');
          if (digits.length < 7) {
            errors.push('TELEFONO debe tener al menos 7 dígitos');
          }
        }

        const fullCi = prefix ? `${prefix}-${ciNum}` : ciNum;
        if (fullCi) allCis.push(fullCi);
      } else {
        const ciEst = getRowValue(rowData, ciColumnIdx);

        // Campos requeridos
        if (!ciEst) errors.push('CEDULA_ESTUDIANTE es requerido');
        if (!data['CARRERA']) errors.push('CARRERA es requerido');
        if (!data['PERIODO']) errors.push('PERIODO es requerido');
        if (!data['TIPO_PRACTICA']) errors.push('TIPO_PRACTICA es requerido');
        if (!data['INSTITUCION']) errors.push('INSTITUCION es requerido');

        if (ciEst) allCis.push(ciEst);
      }

      rows.push({ row: rowNum, data, errors, warnings });
    }

    if (rows.length === 0) {
      res.status(400).json({ success: false, message: 'El archivo no contiene datos válidos' });
      return;
    }

    // Check duplicates in DB (t_persons)
    const duplicates: Array<{ row: number; ci: string }> = [];
    if (allCis.length > 0) {
      // ponytail: simple batch query, skip if too many
      const uniqueCis = [...new Set(allCis)];
      const { data: existingPersons } = await supabase
        .from('t_persons')
        .select('ci')
        .in('ci', uniqueCis.slice(0, 1000)); // limit to 1000 to avoid query explosion

      if (existingPersons && existingPersons.length > 0) {
        const existingSet = new Set(existingPersons.map((p: any) => p.ci));
        rows.forEach(row => {
          const ci = type === 'students'
            ? `${row.data['CEDULA_PREFIJO'] || ''}-${row.data['CEDULA_NUMERO'] || ''}`
            : row.data['CEDULA_ESTUDIANTE'] || '';
          if (ci && existingSet.has(ci)) {
            duplicates.push({ row: row.row, ci });
          }
        });
      }
    }

    const summary = {
      total: rows.length,
      valid: rows.filter(r => r.errors.length === 0).length,
      invalid: rows.filter(r => r.errors.length > 0).length
    };

    res.json({
      success: true,
      data: {
        type,
        columns,
        rows,
        summary,
        duplicates: duplicates.filter((d, idx, self) => self.findIndex(s => s.row === d.row) === idx)
      }
    });
  } catch (error: any) {
    console.error('[BulkImport] Error en preview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Execute Import ─────────────────────────────────────────────────────────

interface ImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

/**
 * POST /api/bulk-import/execute
 * Recibe JSON con type, rows y options. Procesa en lotes de 500.
 */
export const executeImport = async (req: AuthRequest, res: Response) => {
  try {
    const { type, rows, options } = req.body as {
      type: 'students' | 'enrollments';
      rows: Array<{ row: number; data: Record<string, string>; errors?: string[]; warnings?: string[] }>;
      options?: ImportOptions;
    };

    if (!type || !rows || !Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, message: 'Datos inválidos. Se requieren type y rows.' });
      return;
    }

    if (type !== 'students' && type !== 'enrollments') {
      res.status(400).json({ success: false, message: 'Tipo inválido. Use: students o enrollments' });
      return;
    }

    const opts: ImportOptions = {
      skipDuplicates: options?.skipDuplicates ?? true,
      updateExisting: options?.updateExisting ?? false
    };

    const supabase = dbManager.getConnection();
    const userId = req.user?.userId ?? null;
    const userCi = req.user?.userCi ?? null;
    const ip = req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    const details: Array<{ row: number; status: string; message: string }> = [];
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    // ── Pre-cache lookups for enrollments ──
    let careerCache: Map<string, number> = new Map();
    let periodCache: Map<string, number> = new Map();
    let institutionCache: Map<string, number> = new Map();
    let internshipTypeCache: Map<string, number> = new Map();
    let studentCiCache: Map<string, { studentId: number; personId: number }> = new Map();

    if (type === 'enrollments') {
      // Load all careers
      const { data: careers } = await supabase.from('t_career').select('CAREER_ID, CAREER_NAME');
      if (careers) {
        careers.forEach((c: any) => careerCache.set(String(c.CAREER_NAME || '').toUpperCase().trim(), c.CAREER_ID));
      }

      // Load all periods
      const { data: periods } = await supabase.from('t_internships_period').select('PERIOD_ID, DESCRIPTION');
      if (periods) {
        periods.forEach((p: any) => periodCache.set(String(p.DESCRIPTION || '').toUpperCase().trim(), p.PERIOD_ID));
      }

      // Load all institutions
      const { data: institutions } = await supabase.from('t_institution').select('INSTITUTION_ID, NAME');
      if (institutions) {
        institutions.forEach((i: any) => institutionCache.set(String(i.NAME || '').toUpperCase().trim(), i.INSTITUTION_ID));
      }

      // Load all internship types
      const { data: types } = await supabase.from('t_internship_type').select('INTERNSHIP_TYPE_ID, NAME');
      if (types) {
        types.forEach((t: any) => internshipTypeCache.set(String(t.NAME || '').toUpperCase().trim(), t.INTERNSHIP_TYPE_ID));
      }

      // Load all students by CI
      const { data: students } = await supabase
        .from('t_students')
        .select('STUDENTS_ID, person_id, t_persons!inner(ci)');
      if (students) {
        students.forEach((s: any) => {
          const ci = s.t_persons?.ci;
          if (ci) studentCiCache.set(ci, { studentId: s.STUDENTS_ID, personId: s.person_id });
        });
      }
    }

    // ── Pre-check duplicates for students ──
    let existingCiSet: Set<string> = new Set();
    if (type === 'students') {
      const allCis = rows
        .map(r => `${r.data['CEDULA_PREFIJO'] || ''}-${r.data['CEDULA_NUMERO'] || ''}`)
        .filter(Boolean);
      const uniqueCis = [...new Set(allCis)];
      if (uniqueCis.length > 0) {
        const { data: existing } = await supabase
          .from('t_persons')
          .select('ci')
          .in('ci', uniqueCis.slice(0, 1000));
        if (existing) {
          existing.forEach((p: any) => existingCiSet.add(p.ci));
        }
      }
    }

    // ── Process in batches ──
    for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
      const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);

      if (type === 'students') {
        await processStudentBatch(supabase, batch, opts, existingCiSet, details, inserted, updated, errors);
      } else {
        await processEnrollmentBatch(
          supabase, batch, opts, careerCache, periodCache, institutionCache,
          internshipTypeCache, studentCiCache, details, inserted, updated, errors
        );
      }
    }

    // Count results from details
    inserted = details.filter(d => d.status === 'inserted').length;
    updated = details.filter(d => d.status === 'updated').length;
    errors = details.filter(d => d.status === 'error').length;

    // Audit
    logAuthAction(
      userId, userCi, 'BULK_IMPORT', ip, userAgent,
      `Importación masiva: ${type}, ${rows.length} filas, ${inserted} insertados, ${updated} actualizados, ${errors} errores`
    ).catch(() => {});

    res.json({
      success: errors === 0 || (errors > 0 && inserted + updated > 0),
      results: {
        total: rows.length,
        inserted,
        updated,
        errors,
        details: details.filter(d => d.status === 'error')
      }
    });
  } catch (error: any) {
    console.error('[BulkImport] Error en ejecución:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Batch Processors ───────────────────────────────────────────────────────

async function processStudentBatch(
  supabase: any,
  batch: Array<{ row: number; data: Record<string, string> }>,
  opts: ImportOptions,
  existingCiSet: Set<string>,
  details: Array<{ row: number; status: string; message: string }>,
  _inserted: number,
  _updated: number,
  _errors: number
) {
  for (const row of batch) {
    try {
      const d = row.data;
      const prefix = (d['CEDULA_PREFIJO'] || '').toUpperCase();
      const ciNum = d['CEDULA_NUMERO'] || '';
      const fullCi = `${prefix}-${ciNum}`;

      // Validate required fields
      if (!prefix || !ciNum || !d['PRIMER_NOMBRE'] || !d['PRIMER_APELLIDO']) {
        details.push({ row: row.row, status: 'error', message: 'Campos requeridos faltantes' });
        continue;
      }

      // Check duplicate
      if (existingCiSet.has(fullCi)) {
        if (opts.skipDuplicates) {
          details.push({ row: row.row, status: 'error', message: `Cédula duplicada: ${fullCi}` });
          continue;
        }
        if (opts.updateExisting) {
          // Update existing person
          const { error: updateErr } = await supabase
            .from('t_persons')
            .update({
              first_name: d['PRIMER_NOMBRE'],
              middle_name: d['SEGUNDO_NOMBRE'] || null,
              last_name: d['PRIMER_APELLIDO'],
              second_last_name: d['SEGUNDO_APELLIDO'] || null,
              gender: d['SEXO'] || null,
              birth_date: d['FECHA_NACIMIENTO'] || null,
              marital_status: d['ESTADO_CIVIL'] || null,
              phone: d['TELEFONO'] || null,
              email: d['CORREO'] || null,
              address: d['DIRECCION'] || null
            })
            .eq('ci', fullCi);

          if (updateErr) throw updateErr;
          details.push({ row: row.row, status: 'updated', message: 'Estudiante actualizado' });
          continue;
        }
        details.push({ row: row.row, status: 'error', message: `Cédula duplicada: ${fullCi}` });
        continue;
      }

      // Insert t_persons
      const { data: person, error: personErr } = await supabase
        .from('t_persons')
        .insert({
          ci: fullCi,
          first_name: d['PRIMER_NOMBRE'],
          middle_name: d['SEGUNDO_NOMBRE'] || null,
          last_name: d['PRIMER_APELLIDO'],
          second_last_name: d['SEGUNDO_APELLIDO'] || null,
          gender: d['SEXO'] || null,
          birth_date: d['FECHA_NACIMIENTO'] || null,
          marital_status: d['ESTADO_CIVIL'] || null,
          phone: d['TELEFONO'] || null,
          email: d['CORREO'] || null,
          address: d['DIRECCION'] || null,
          status: 1
        })
        .select('person_id')
        .single();

      if (personErr) {
        // ponytail: unique violation means another process inserted it
        if (personErr.code === '23505') {
          if (opts.skipDuplicates) {
            details.push({ row: row.row, status: 'error', message: `Cédula duplicada: ${fullCi}` });
            continue;
          }
        }
        throw personErr;
      }

      // Insert t_students
      const { error: studentErr } = await supabase
        .from('t_students')
        .insert({
          person_id: person.person_id,
          STUDENT_TYPE: d['TIPO_ESTUDIANTE'] || null,
          EMPLOYMENT: d['TRABAJA'] || null,
          STATUS: 1
        });

      if (studentErr) throw studentErr;

      existingCiSet.add(fullCi); // prevent re-insert in same batch
      details.push({ row: row.row, status: 'inserted', message: 'Estudiante creado exitosamente' });
    } catch (err: any) {
      console.error(`[BulkImport] Error fila ${row.row}:`, err.message);
      details.push({ row: row.row, status: 'error', message: err.message });
    }
  }
}

async function processEnrollmentBatch(
  supabase: any,
  batch: Array<{ row: number; data: Record<string, string> }>,
  opts: ImportOptions,
  careerCache: Map<string, number>,
  periodCache: Map<string, number>,
  institutionCache: Map<string, number>,
  internshipTypeCache: Map<string, number>,
  studentCiCache: Map<string, { studentId: number; personId: number }>,
  details: Array<{ row: number; status: string; message: string }>,
  _inserted: number,
  _updated: number,
  _errors: number
) {
  for (const row of batch) {
    try {
      const d = row.data;
      const ci = (d['CEDULA_ESTUDIANTE'] || '').trim();
      const careerName = (d['CARRERA'] || '').toUpperCase().trim();
      const periodDesc = (d['PERIODO'] || '').toUpperCase().trim();
      const practiceType = (d['TIPO_PRACTICA'] || '').toUpperCase().trim();
      const institutionName = (d['INSTITUCION'] || '').toUpperCase().trim();

      if (!ci || !careerName || !periodDesc || !practiceType || !institutionName) {
        details.push({ row: row.row, status: 'error', message: 'Campos requeridos faltantes' });
        continue;
      }

      // Lookup student
      const student = studentCiCache.get(ci);
      if (!student) {
        details.push({ row: row.row, status: 'error', message: `Estudiante no encontrado: ${ci}` });
        continue;
      }

      // Lookup career
      const careerId = careerCache.get(careerName);
      if (!careerId) {
        details.push({ row: row.row, status: 'error', message: `Carrera no encontrada: ${d['CARRERA']}` });
        continue;
      }

      // Lookup period
      const periodId = periodCache.get(periodDesc);
      if (!periodId) {
        details.push({ row: row.row, status: 'error', message: `Período no encontrado: ${d['PERIODO']}` });
        continue;
      }

      // Lookup institution
      const institutionId = institutionCache.get(institutionName);
      if (!institutionId) {
        details.push({ row: row.row, status: 'error', message: `Institución no encontrada: ${d['INSTITUCION']}` });
        continue;
      }

      // Lookup internship type
      const typeId = internshipTypeCache.get(practiceType);
      if (!typeId) {
        details.push({ row: row.row, status: 'error', message: `Tipo de práctica no encontrado: ${d['TIPO_PRACTICA']}` });
        continue;
      }

      // Check if enrollment already exists
      const { data: existing } = await supabase
        .from('t_professional_practices')
        .select('PROFESSIONAL_PRACTICE_ID')
        .eq('STUDENTS_ID', student.studentId)
        .eq('CAREER_ID', careerId)
        .eq('PERIOD_ID', periodId)
        .eq('INSTITUTION_ID', institutionId)
        .eq('STATUS', 1)
        .maybeSingle();

      if (existing) {
        if (opts.skipDuplicates) {
          details.push({ row: row.row, status: 'error', message: 'Inscripción ya existe' });
          continue;
        }
        // Update
        const { error: updateErr } = await supabase
          .from('t_professional_practices')
          .update({ INTERNSHIP_TYPE_ID: typeId })
          .eq('PROFESSIONAL_PRACTICE_ID', existing.PROFESSIONAL_PRACTICE_ID);

        if (updateErr) throw updateErr;
        details.push({ row: row.row, status: 'updated', message: 'Inscripción actualizada' });
        continue;
      }

      // Insert
      const { error: insertErr } = await supabase
        .from('t_professional_practices')
        .insert({
          STUDENTS_ID: student.studentId,
          CAREER_ID: careerId,
          PERIOD_ID: periodId,
          INSTITUTION_ID: institutionId,
          INTERNSHIP_TYPE_ID: typeId,
          PRACTICES_STATUS: PRACTICES_STATUS.INSCRITO,
          REGISTRATION_DATE: new Date().toISOString(),
          STATUS: 1,
          INTERNSHIP_STATUS: 1
        });

      if (insertErr) throw insertErr;
      details.push({ row: row.row, status: 'inserted', message: 'Inscripción creada exitosamente' });
    } catch (err: any) {
      console.error(`[BulkImport] Error fila ${row.row}:`, err.message);
      details.push({ row: row.row, status: 'error', message: err.message });
    }
  }
}
