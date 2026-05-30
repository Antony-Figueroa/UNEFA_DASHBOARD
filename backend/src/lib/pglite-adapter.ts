// ================================================================================
// PGliteAdapter
// ================================================================================
// Implementación de DatabaseAdapter que traduce las llamadas estilo Supabase SDK
// a queries SQL ejecutadas contra PGlite (PostgreSQL WASM).
//
// Los controllers llaman cosas como:
//   supabase.from('t_students').select('*').eq('STATUS', 1).order('NAME')
//
// Este adaptador convierte eso a:
//   SELECT * FROM t_students WHERE STATUS = $1 ORDER BY NAME ASC
//
// Para joins estilo Supabase (foreign table syntax):
//   .select(`*, t_persons!inner(ci, email)`)
//   → SELECT t_students.*, t_persons.ci, t_persons.email
//     FROM t_students INNER JOIN t_persons ON ...
//
// Fase 0.3: Implementación BÁSICA con soporte para selects, filters, order, limit, single.
// Fase 1: Soporte completo para joins, insert, update, delete, upsert.
// ================================================================================

import { QueryResponse, DatabaseAdapter, FilterQueryBuilder, InsertQueryBuilder, UpdateQueryBuilder } from './db-adapter.js';

// ─── Tipo para PGlite (duck-typed para no requerir instalación) ───
interface PGliteLike {
  query(sql: string, params?: any[]): Promise<{ rows: any[]; affectedRows?: number }>;
}

// ─── SQL Builder ───
// Traduce la API chainable de Supabase a SQL parametrizado.

interface Filter {
  type: 'eq' | 'neq' | 'in' | 'is' | 'not' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'raw';
  column: string;
  value: any;
  operator?: string;   // para .not(column, operator, value) y .or(rawString)
}

interface JoinNode {
  table: string;
  columns: string[];
  isInner: boolean;
  alias?: string;
  children: JoinNode[];
}

interface OrderRef {
  column: string;
  ascending: boolean;
  foreignTable?: string;
}

// Mapa de PK conocidas por tabla (del schema real DB-postgres.sql)
// Auditado contra las PRIMARY KEY del schema.
const TABLE_PKS: Record<string, string> = {
  t_persons: 'person_id',
  t_students: 'STUDENTS_ID',
  t_tutors: 'TUTOR_ID',
  t_user: 'USER_ID',
  t_institution_manager: 'MANAGER_ID',
  t_enrollment: 'ENROLLMENT_ID',
  t_professional_practices: 'PROFESSIONAL_PRACTICES_ID',
  t_professional_practices_tutor: 'PROFESSIONAL_PRACTICES_TUTOR_ID',
  t_tutor_career: 'TUTOR_CAREER_ID',
  t_career: 'CAREER_ID',
  t_career_internship_type: 'ID_CAREER_INTERNSHIP_TYPE_ID',
  t_internship_type: 'INTERNSHIP_TYPE_ID',
  t_internships_period: 'PERIOD_ID',
  t_practice_visits: 'VISIT_ID',
  t_activity_logs: 'ACTIVITY_LOG_ID',
  t_evaluation: 'EVALUATION_ID',
  t_evaluation_detail: 'DETAIL_ID',
  t_evaluation_criteria: 'CRITERIA_ID',
  t_institution: 'INSTITUTION_ID',
  t_institution_manager_institution: 'INSTITUTION_MANAGER_INSTITUTION_ID',
  t_user_roles: 'USER_ROLE_ID',
  t_roles_permissions: 'ROLES_ID',  // composite PK, usamos la primera columna
  t_student_documents: 'DOCUMENT_ID',
  t_student_requests: 'REQUEST_ID',
  t_notifications: 'NOTIFICATION_ID',
  t_change_log: 'CHANGE_LOG_ID',
  t_operation: 'OPERATION_ID',
  t_tables: 'TABLE_ID',
  t_columns: 'COLUMN_ID',
  t_roles: 'ID_ROLS',
  t_permissions: 'PERMISSIONS_ID',
  t_visit: 'VISIT_ID',
};

// Mapa de FK: tabla_hija → { fk_columna → tabla_padre }
//
// AUDITADO contra DB-postgres.sql + migrations 001-004.
// Regla: la columna existe en la tabla_hija y REFERENCES una tabla_padre.
// NO incluir columnas que no existan en el schema base (DB-postgres.sql).
//
// Tablas corregidas respecto a la versión original:
//   t_role_permissions → t_roles_permissions,  t_documents → t_student_documents,
//   t_requests → t_student_requests,  t_institutional_responsible → t_institution_manager
// Columnas corregidas: t_professional_practices.STUDENT_ID → STUDENTS_ID,
//   t_roles_permissions.ID_ROLS → ROLES_ID,  PERMISSION_ID → PERMISSIONS_ID
// Eliminadas: t_evaluation_detail_allocations, t_visit_files (no existen)
// Agregadas: t_visit, t_institution_manager, columnas faltantes en t_activity_logs,
//   t_evaluation, t_evaluation_detail, t_change_log, t_columns
const KNOWN_FOREIGN_KEYS: Record<string, Record<string, string>> = {
  // ── PERSONAS ─────────────────────────────────────────────
  // person_id se agrega via migrations 003/004 (existe en Supabase).
  // En PGlite local DB-postgres.sql NO incluye person_id aún —
  // si se ejecutan las migrations, estas entries son correctas.
  t_students:                { person_id: 't_persons', CAREER_ID: 't_career' },
  t_tutors:                  { person_id: 't_persons' },
  t_user:                    { person_id: 't_persons' },
  t_institution_manager:     { person_id: 't_persons', INSTITUTION_ID: 't_institution' },

  // ── INSCRIPCIONES ─────────────────────────────────────────
  // t_enrollment — no existe en DB-postgres.sql (solo Supabase).
  // Se mantiene para compatibilidad con tests.
  t_enrollment:              { STUDENT_ID: 't_students', PERIOD_ID: 't_internships_period', CAREER_ID: 't_career' },

  // ── PASANTÍAS ────────────────────────────────────────────
  t_professional_practices:  { STUDENTS_ID: 't_students', INSTITUTION_ID: 't_institution', CAREER_ID: 't_career', PERIOD_ID: 't_internships_period', MANAGER_ID: 't_institution_manager', INTERNSHIP_TYPE_ID: 't_internship_type' },
  t_professional_practices_tutor: { TUTOR_ID: 't_tutors', PROFESSIONAL_PRACTICE_ID: 't_professional_practices' },
  t_tutor_career:            { TUTOR_ID: 't_tutors', CAREER_ID: 't_career' },
  t_career_internship_type:  { CAREER_ID: 't_career', INTERNSHIP_TYPE_ID: 't_internship_type' },
  t_internships_period:      { },

  // ── SEGUIMIENTO Y EVALUACIÓN ─────────────────────────────
  t_practice_visits:         { PROFESSIONAL_PRACTICE_ID: 't_professional_practices', TUTOR_ID: 't_tutors' },
  t_visit:                   { PROFESSIONAL_PRACTICE_ID: 't_professional_practices', TUTOR_ID: 't_tutors' },
  t_activity_logs:           { PROFESSIONAL_PRACTICE_ID: 't_professional_practices', STUDENT_ID: 't_students' },
  t_evaluation:              { PROFESSIONAL_PRACTICE_ID: 't_professional_practices', REGISTERED_BY: 't_user' },
  t_evaluation_detail:       { EVALUATION_ID: 't_evaluation', CRITERIA_ID: 't_evaluation_criteria' },

  // ── INSTITUCIONES ────────────────────────────────────────
  t_institution:             { },
  t_institution_manager_institution: { MANAGER_ID: 't_institution_manager', INSTITUTION_ID: 't_institution' },

  // ── ROLES Y PERMISOS ─────────────────────────────────────
  t_user_roles:              { ID_USER: 't_user', ID_ROLES: 't_roles' },
  t_roles_permissions:       { ROLES_ID: 't_roles', PERMISSIONS_ID: 't_permissions' },

  // ── DOCUMENTOS Y SOLICITUDES ────────────────────────────
  t_student_documents:       { STUDENT_ID: 't_students' },
  t_student_requests:        { STUDENT_ID: 't_students', REQUEST_TYPE_ID: 't_request_types' },

  // ── NOTIFICACIONES ───────────────────────────────────────
  t_notifications:           { USER_ID: 't_user' },

  // ── LOGGING ──────────────────────────────────────────────
  t_change_log:              { COLUMN_ID: 't_columns', OPERATION_ID: 't_operation', TABLE_ID: 't_tables', USER_ID: 't_user' },
  t_operation:               { },
  t_tables:                  { },
  t_columns:                 { TABLE_ID: 't_tables' },

  // ── OTRAS ────────────────────────────────────────────────
  // t_enrollment — NO existe en DB-postgres.sql (solo en tests)
  // t_evaluation_detail_allocations — NO existe
  // t_visit_files — NO existe
  // t_person_merge_log — solo en migration 002, no en schema base
};

// Mapa inverso: nombre de columna FK → { tabla referenciada, columna PK }
// Permite resolver joins por alias: `institution:INSTITUTION_ID(*)`
const FK_COLUMN_MAP: Record<string, { refTable: string; refColumn: string }> = {};
function buildFKColumnMap(): void {
  for (const [_childTable, fks] of Object.entries(KNOWN_FOREIGN_KEYS)) {
    for (const [fkCol, parentTable] of Object.entries(fks)) {
      if (!FK_COLUMN_MAP[fkCol]) {
        const pkCol = findPKForTable(parentTable);
        FK_COLUMN_MAP[fkCol] = { refTable: parentTable, refColumn: pkCol };
      }
    }
  }
}
buildFKColumnMap();

function findPKForTable(table: string): string {
  // 1. PK conocida del schema real
  if (TABLE_PKS[table]) return TABLE_PKS[table];
  // 2. Buscar en FK map inverso: qué columnas apuntan a esta tabla
  for (const [_fkCol, info] of Object.entries(FK_COLUMN_MAP)) {
    if (info.refTable === table) return info.refColumn;
  }
  // 3. Fallback: naming convention
  const candidates = [
    `${table.replace('t_', '').toUpperCase()}_ID`,
    `${table}_id`,
    'ID',
    'id',
  ];
  return candidates[0];
}

/**
 * Busca una FK DIRECTA: fromTable.tiene_una_columna → targetTable.
 * Si no existe, devuelve null — la FK inversa la maneja resolveInverseFK.
 * 
 * ANTES esta función también buscaba FKs inversas, lo cual causaba bugs:
 * resolveFK('t_user', 't_user_roles') devolvía 'USER_ID' (columna de t_user_roles),
 * pero generateJoinSQL lo usaba como "t_user"."USER_ID" — FK incorrecta.
 */
function resolveFK(fromTable: string, targetTable: string): string | null {
  const fks = KNOWN_FOREIGN_KEYS[fromTable];
  if (fks) {
    for (const [col, tbl] of Object.entries(fks)) {
      if (tbl === targetTable) return col;
    }
  }
  return null;
}

function resolveInverseFK(parentTable: string, childTable: string): { fkColumn: string; sourceTable: string } | null {
  const childFks = KNOWN_FOREIGN_KEYS[childTable];
  if (childFks) {
    for (const [col, tbl] of Object.entries(childFks)) {
      if (tbl === parentTable) return { fkColumn: col, sourceTable: childTable };
    }
  }
  return null;
}

// Exportado para tests unitarios
export class SqlBuilder {
  private table: string;
  private selectRaw: string = '*';
  private filters: Filter[] = [];
  private orders: OrderRef[] = [];
  private limitCount: number | null = null;
  private offsetCount: number | null = null;
  private rangeSet = false;
  private isSingle = false;
  private isMaybeSingle = false;
  private countOption: 'exact' | null = null;
  private headOnly = false;
  private joins: JoinNode[] = [];
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertData: any = null;
  private updateData: any = null;

  // OR groups: cada grupo es un array de condiciones unidas con OR.
  // Múltiples grupos se unen con AND entre sí.
  private orGroups: { column: string; operator: string; value: any }[][] = [];

  constructor(table: string) {
    this.table = table;
  }

  /**
   * Parser recursivo descendente para joins estilo Supabase.
   *
   * Ej: "t_persons!inner(ci, first_name)"
   *     "t_tutor_career(CAREER_ID, t_career(t_career_internship_type(t_internship_type(NAME))))"
   *     "institution:INSTITUTION_ID(*)"
   *
   * EBNF simplificado:
   *   select_list = item (',' item)*
   *   item        = column_name | join_expr
   *   join_expr   = [alias ':'] table_name ['!inner'] '(' select_list ')'
   */
  private parseJoins(input: string): JoinNode[] {
    const joins: JoinNode[] = [];
    const len = input.length;
    let pos = 0;

    function skipWhitespace() {
      while (pos < len && /\s/.test(input[pos])) pos++;
    }

    function peek(): string {
      skipWhitespace();
      return pos < len ? input[pos] : '\0';
    }

    function consume(): string {
      skipWhitespace();
      return pos < len ? input[pos++] : '\0';
    }

    function parseIdentifier(): string {
      skipWhitespace();
      let start = pos;
      // Identifier: alfanumérico más underscore, punto, posiblemente con t_
      while (pos < len && /[\w.]/.test(input[pos])) pos++;
      return input.slice(start, pos).trim();
    }

    /**
     * Parse a select list: comma-separated items (column names or join expressions)
     * Each item can be a simple column name or a join expression.
     * Join expressions look like: [alias:]table[!inner](columns, ...)
     */
    function parseSelectList(parentTable: string): { columns: string[]; children: JoinNode[] } {
      const columns: string[] = [];
      const children: JoinNode[] = [];

      while (pos < len) {
        skipWhitespace();
        if (pos >= len || input[pos] === ')') break;

        const startPos = pos;
        // Read the first token (identifier or alias)
        const token1 = parseIdentifier();
        if (!token1) { pos++; continue; }

        // Check what follows
        skipWhitespace();
        const next = pos < len ? input[pos] : '\0';

        if (next === ':') {
          // Alias-based join: alias:table(...) or alias:FK_COLUMN(...)
          pos++; // consume ':'
          const token2 = parseIdentifier(); // table name or FK column name
          skipWhitespace();
          if (pos < len && input[pos] === '(') {
            // It's a join with alias
            let isInner = false;
            // Check for !inner before the paren
            const afterToken2 = pos;
            // Need to check if there's !inner between token2 and (
            const beforeParen = input.slice(afterToken2, input.indexOf('(', afterToken2)).trim();
            isInner = beforeParen.includes('!inner');

            // Consume '('
            while (pos < len && input[pos] !== '(') pos++;
            if (pos < len) pos++; // consume '('

            const inner = parseSelectList(token2);
            // Closing ')'
            while (pos < len && input[pos] !== ')') pos++;
            if (pos < len) pos++; // consume ')'

            children.push({
              table: token2,
              alias: token1,
              columns: inner.columns,
              isInner,
              children: inner.children,
            });
          } else {
            // Just "alias:column" - treat as column reference
            columns.push(`${token1}:${token2}`);
          }
        } else if (next === '!' || next === '(') {
          // Table join: table[!inner](columns, ...)
          let isInner = false;
          skipWhitespace();
          if (pos < len && input[pos] === '!') {
            pos++; // consume '!'
            const modStart = pos;
            while (pos < len && /[\w]/.test(input[pos])) pos++;
            const modifier = input.slice(modStart, pos);
            isInner = modifier === 'inner';
            skipWhitespace();
          }
          if (pos < len && input[pos] === '(') {
            pos++; // consume '('
            const inner = parseSelectList(token1);
            // Consume ')'
            while (pos < len && input[pos] !== ')') pos++;
            if (pos < len) pos++; // consume ')'

            children.push({
              table: token1,
              columns: inner.columns,
              isInner,
              children: inner.children,
            });
          } else {
            columns.push(token1);
          }
        } else if (next === ',') {
          // Simple column
          columns.push(token1);
          pos++; // consume ','
        } else {
          // Simple column (end of list or next token)
          columns.push(token1);
        }

        // Skip comma if present
        skipWhitespace();
        if (pos < len && input[pos] === ',') {
          pos++;
        }
      }

      return { columns, children };
    }

    // Parse the top-level select list
    const result = parseSelectList(this.table);
    joins.push(...result.children);

    return joins;
  }

  // ─── Configuración de SELECT ───

  setSelect(columns: string, options?: { count?: string; head?: boolean }) {
    this.selectRaw = columns || '*';
    if (options?.count === 'exact') this.countOption = 'exact';
    if (options?.head) this.headOnly = true;

    // Parsear joins con el recursive descent parser
    if (columns) {
      this.joins = this.parseJoins(columns);
    }
    return this;
  }

  // ─── Filtros ───

  addFilter(type: Filter['type'], column: string, value: any, operator?: string) {
    this.filters.push({ type, column, value, operator });
    return this;
  }

  /**
   * Agrega un grupo de condiciones OR.
   * Cada grupo se renderiza como `(cond1 OR cond2 OR ...)` en el WHERE.
   * Múltiples grupos se combinan con AND.
   */
  addOrGroup(conditions: { column: string; operator: string; value: any }[]) {
    this.orGroups.push(conditions);
    return this;
  }

  // ─── Ordenamiento ───

  addOrder(column: string, ascending: boolean, foreignTable?: string) {
    this.orders.push({ column, ascending, foreignTable });
    return this;
  }

  // ─── Límite ───

  addLimit(count: number) {
    this.limitCount = count;
    return this;
  }

  // ─── Range (paginación: offset + limit) ───
  // .range(from, to) → from = offset, limit = to - from + 1
  // Si también hay .limit(), range sobreescribe el limit

  addRange(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    this.rangeSet = true;
    return this;
  }

  // ─── Single ───

  setSingle() { this.isSingle = true; return this; }
  setMaybeSingle() { this.isMaybeSingle = true; return this; }

  // ─── INSERT ───

  setInsert(data: any) {
    this.operation = 'insert';
    // Supabase SDK acepta insert([data]) - unwrap array
    this.insertData = Array.isArray(data) ? data[0] : data;
    return this;
  }

  // ─── UPDATE ───

  setUpdate(data: any) {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  // ─── DELETE ───

  setDelete() {
    this.operation = 'delete';
    return this;
  }

  // ─── Build SQL ───

  buildSQL(): { sql: string; params: any[] } {
    const params: any[] = [];
    let paramIndex = 1;

    switch (this.operation) {
      case 'select': return this.buildSelectSQL(params, paramIndex);
      case 'insert': return this.buildInsertSQL(params);
      case 'update': return this.buildUpdateSQL(params, paramIndex);
      case 'delete': return this.buildDeleteSQL(params, paramIndex);
    }
  }

  private quoteCol(column: string): string {
    // Si ya está quoted o tiene punto (table.column), devolver tal cual
    if (column.includes('"') || column.includes('.')) return column;
    // Si tiene prefijo de tabla (t_persons.ci), dejar así
    if (column.includes('.')) return column;
    return `"${column}"`;
  }

  private buildSelectSQL(params: any[], paramIndex: number): { sql: string; params: any[] } {
    let selectClause: string;

    if (this.headOnly && this.countOption === 'exact') {
      selectClause = 'COUNT(*) AS count';
    } else {
      const mainCols = this.parseMainColumns(this.selectRaw);
      // Columnas de joins (incluyendo nested recursivamente)
      const joinCols = this.collectJoinColumns(this.joins);
      const allCols = [...mainCols, ...joinCols];
      selectClause = allCols.length > 0 ? allCols.join(', ') : '*';
    }

    // FROM
    let sql = `SELECT ${selectClause} FROM ${this.quoteCol(this.table)}`;

    // JOINs (generación recursiva)
    const joinSql = this.generateJoinSQL(this.joins, this.table);
    sql += joinSql;

    // WHERE
    const whereClauses = this.buildWhereClauses(params, paramIndex);
    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // ORDER BY
    if (this.orders.length > 0) {
      const orderClauses = this.orders.map(o => {
        const col = o.foreignTable
          ? `"${o.foreignTable}".${this.quoteCol(o.column)}`
          : this.quoteCol(o.column);
        return `${col} ${o.ascending ? 'ASC' : 'DESC'}`;
      });
      sql += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    if (this.limitCount !== null) {
      sql += ` LIMIT ${this.limitCount}`;
    } else if (this.isSingle) {
      sql += ' LIMIT 2';
    } else if (this.isMaybeSingle) {
      sql += ' LIMIT 2';
    }

    if (this.offsetCount !== null) {
      sql += ` OFFSET ${this.offsetCount}`;
    }

    return { sql, params };
  }

  /**
   * Recolecta todas las columnas de joins (incluyendo nested) para la cláusula SELECT.
   */
  private collectJoinColumns(joins: JoinNode[]): string[] {
    const result: string[] = [];
    for (const join of joins) {
      for (const col of join.columns) {
        const alias = join.alias || join.table;
        result.push(`${alias}.${this.quoteCol(col)} AS "${alias}_${col}"`);
      }
      // Recurse into children
      result.push(...this.collectJoinColumns(join.children));
    }
    return result;
  }

  /**
   * Genera cláusulas JOIN SQL recursivamente para el árbol de JoinNode.
   * Cada nivel se une al nivel superior (parentTable).
   */
  private generateJoinSQL(joins: JoinNode[], parentTable: string): string {
    let sql = '';
    for (const join of joins) {
      const alias = join.alias || join.table;
      const resolvedTable = this.resolveJoinTable(join);
      const joinType = join.isInner ? 'INNER JOIN' : 'LEFT JOIN';

      // Determinar la FK entre parentTable y la tabla resuelta
      const fkCol = resolveFK(parentTable, resolvedTable);
      const inverseFk = resolveInverseFK(parentTable, resolvedTable);

      if (fkCol) {
        // FK directa: parentTable.fkCol = resolvedTable.PK
        const pkCol = findPKForTable(resolvedTable);
        sql += ` ${joinType} ${this.quoteCol(resolvedTable)} AS "${alias}" ON ${parentTable}.${this.quoteCol(fkCol)} = "${alias}".${this.quoteCol(pkCol)}`;
      } else if (inverseFk) {
        // FK inversa: resolvedTable apunta a parentTable
        const pkCol = findPKForTable(parentTable);
        sql += ` ${joinType} ${this.quoteCol(resolvedTable)} AS "${alias}" ON "${alias}".${this.quoteCol(inverseFk.fkColumn)} = ${parentTable}.${this.quoteCol(pkCol)}`;
      } else {
        console.warn(`[PGliteAdapter] FK desconocida entre ${parentTable} y ${resolvedTable}, LEFT JOIN sin ON`);
        sql += ` ${joinType} ${this.quoteCol(resolvedTable)} AS "${alias}" ON 1=0`;
      }

      // Recurse: children join to their resolved parent table
      if (join.children.length > 0) {
        sql += this.generateJoinSQL(join.children, resolvedTable);
      }
    }
    return sql;
  }

  /**
   * Resuelve el nombre real de la tabla para un JoinNode.
   * Si el join se especificó como alias:FK_COLUMN, usamos FK_COLUMN_MAP para resolver.
   */
  private resolveJoinTable(join: JoinNode): string {
    // Si el nombre parece una FK column (ej: INSTITUTION_ID), resolver
    if (FK_COLUMN_MAP[join.table]) {
      return FK_COLUMN_MAP[join.table].refTable;
    }
    return join.table;
  }

  private parseMainColumns(selectRaw: string): string[] {
    // Remover las referencias a foreign tables (con paréntesis)
    let cleaned = selectRaw.replace(/\w+(?:\.\w+)?\s*:\s*\w+\s*\([^)]*\)/g, '');
    cleaned = cleaned.replace(/\w+\s*!?\w*\s*\([^)]*\)/g, '');
    // Partir por comas y limpiar
    const parts = cleaned.split(',').map(p => p.trim()).filter(p => p && p !== '*');
    if (parts.length === 0) return ['*'];
    // Si hay joins, las columnas principales deben ir calificadas con la tabla base
    // para evitar ambigüedad (ej: STATUS existe tanto en t_students como en t_career)
    const hasJoins = this.joins.length > 0;
    return parts.map(p => {
      // Ya tiene calificación de tabla (ej: "t_students.STATUS")
      if (p.includes('.')) return p;
      // Si hay joins, calificar con la tabla base
      if (hasJoins) return `${this.quoteCol(this.table)}.${this.quoteCol(p)}`;
      return this.quoteCol(p);
    });
  }

  private buildInsertSQL(params: any[]): { sql: string; params: any[] } {
    if (!this.insertData) throw new Error('[PGliteAdapter] No hay datos para insertar');

    const data = this.insertData;
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`);

    const sql = `INSERT INTO ${this.quoteCol(this.table)} (${columns.map(c => this.quoteCol(c)).join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;

    return { sql, params: values };
  }

  private buildUpdateSQL(params: any[], paramIndex: number): { sql: string; params: any[] } {
    if (!this.updateData) throw new Error('[PGliteAdapter] No hay datos para actualizar');

    const data = this.updateData;
    const columns = Object.keys(data);
    const values = Object.values(data);

    const setClauses = columns.map((col, i) => `${this.quoteCol(col)} = $${i + 1}`);
    const valuesForSet = [...values];

    // WHERE filters
    const whereClauses = this.buildWhereClausesForUpdate(valuesForSet, valuesForSet.length + 1);
    const whereStr = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `UPDATE ${this.quoteCol(this.table)} SET ${setClauses.join(', ')}${whereStr} RETURNING *`;

    return { sql, params: valuesForSet };
  }

  private buildDeleteSQL(params: any[], paramIndex: number): { sql: string; params: any[] } {
    const whereClauses = this.buildWhereClauses(params, paramIndex);
    const whereStr = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `DELETE FROM ${this.quoteCol(this.table)}${whereStr} RETURNING *`;

    return { sql, params };
  }

  private buildWhereClauses(params: any[], startIndex: number): string[] {
    const clauses = this.filters.map(f => this.buildWhereClause(f, params, startIndex));

    // OR groups: cada grupo se convierte en (cond1 OR cond2) separado con AND
    for (const group of this.orGroups) {
      const orClauses = group.map(f =>
        this.buildWhereClause(
          { type: f.operator as Filter['type'], column: f.column, value: f.value },
          params,
          startIndex,
        ),
      );
      clauses.push(`(${orClauses.join(' OR ')})`);
    }

    return clauses;
  }

  private buildWhereClausesForUpdate(params: any[], startIndex: number): string[] {
    const clauses = this.filters.map(f => this.buildWhereClause(f, params, startIndex));

    for (const group of this.orGroups) {
      const orClauses = group.map(f =>
        this.buildWhereClause(
          { type: f.operator as Filter['type'], column: f.column, value: f.value },
          params,
          startIndex,
        ),
      );
      clauses.push(`(${orClauses.join(' OR ')})`);
    }

    return clauses;
  }

  private buildWhereClause(filter: Filter, params: any[], startIndex: number): string {
    // Si hay joins, calificar con la tabla base para evitar ambigüedad
    // ej: "USER_CI" → "t_user"."USER_CI" cuando hay LEFT JOIN t_user_roles
    const hasJoins = this.joins.length > 0;
    const col = hasJoins && !filter.column.includes('.')
      ? `${this.quoteCol(this.table)}.${this.quoteCol(filter.column)}`
      : this.quoteCol(filter.column);

    switch (filter.type) {
      case 'eq':
        params.push(filter.value);
        return `${col} = $${params.length}`;
      case 'neq':
        params.push(filter.value);
        return `${col} != $${params.length}`;
      case 'gt':
        params.push(filter.value);
        return `${col} > $${params.length}`;
      case 'gte':
        params.push(filter.value);
        return `${col} >= $${params.length}`;
      case 'lt':
        params.push(filter.value);
        return `${col} < $${params.length}`;
      case 'lte':
        params.push(filter.value);
        return `${col} <= $${params.length}`;
      case 'like':
        params.push(filter.value);
        return `${col} LIKE $${params.length}`;
      case 'ilike':
        params.push(filter.value);
        return `${col} ILIKE $${params.length}`;
      case 'in': {
        const values = Array.isArray(filter.value) ? filter.value : [];
        const placeholders = values.map(v => {
          params.push(v);
          return `$${params.length}`;
        });
        return `${col} IN (${placeholders.join(', ')})`;
      }
      case 'is':
        if (filter.value === null) {
          return `${col} IS NULL`;
        }
        params.push(filter.value);
        return `${col} IS $${params.length}`;
      case 'raw':
        // .or() y otros filtros raw SQL
        return `(${filter.value})`;
      case 'not':
        if (filter.operator === 'is' && filter.value === null) {
          return `${col} IS NOT NULL`;
        }
        if (filter.operator === 'in') {
          // El valor viene como string "(1,2,3)" de Supabase
          const rawValues = typeof filter.value === 'string'
            ? filter.value.replace(/[()]/g, '').split(',').map(s => s.trim())
            : [];
          const placeholders = rawValues.map(v => {
            // Intentar parsear como número
            const num = Number(v);
            params.push(isNaN(num) ? v : num);
            return `$${params.length}`;
          });
          return `${col} NOT IN (${placeholders.join(', ')})`;
        }
        params.push(filter.value);
        return `NOT (${col} ${filter.operator || '='} $${params.length})`;
      default:
        params.push(filter.value);
        return `${col} = $${params.length}`;
    }
  }
}

// ─── FilterBuilder ───
// Implementa la interfaz chainable que esperan los controllers.

class PGliteFilterBuilder implements FilterQueryBuilder, InsertQueryBuilder, UpdateQueryBuilder {
  private builder: SqlBuilder;
  private db: PGliteLike;
  private executed = false;
  private resultPromise: Promise<QueryResponse> | null = null;

  constructor(db: PGliteLike, builder: SqlBuilder) {
    this.db = db;
    this.builder = builder;
  }

  // ─── Select (para cadenas insert/update/delete) ───
  select(columns?: string): this {
    if (columns) {
      this.builder.setSelect(columns);
    }
    return this;
  }

  // ─── Filtros ───
  eq(column: string, value: any) { this.builder.addFilter('eq', column, value); return this; }
  neq(column: string, value: any) { this.builder.addFilter('neq', column, value); return this; }
  in(column: string, values: any[]) { this.builder.addFilter('in', column, values); return this; }
  is(column: string, value: any) { this.builder.addFilter('is', column, value); return this; }
  not(column: string, operator: string, value: any) { this.builder.addFilter('not', column, value, operator); return this; }
  gt(column: string, value: any) { this.builder.addFilter('gt', column, value); return this; }
  gte(column: string, value: any) { this.builder.addFilter('gte', column, value); return this; }
  lt(column: string, value: any) { this.builder.addFilter('lt', column, value); return this; }
  lte(column: string, value: any) { this.builder.addFilter('lte', column, value); return this; }
  like(column: string, pattern: string) { this.builder.addFilter('like', column, pattern); return this; }
  ilike(column: string, pattern: string) { this.builder.addFilter('ilike', column, pattern); return this; }

  // ─── Ordenamiento ───
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string }) {
    const foreignTable = options?.foreignTable || (options as any)?.referencedTable;
    this.builder.addOrder(column, options?.ascending ?? true, foreignTable);
    return this;
  }

  // ─── Límite ───
  limit(count: number, _options?: { foreignTable?: string }) {
    this.builder.addLimit(count);
    return this;
  }

  // ─── Range (paginación estilo Supabase) ───
  range(from: number, to: number, _options?: { foreignTable?: string }) {
    this.builder.addRange(from, to);
    return this;
  }

  // ─── Single ───
  single() { this.builder.setSingle(); return this; }
  maybeSingle() { this.builder.setMaybeSingle(); return this; }

  // ─── OR ───
  or(filters: string, _options?: { foreignTable?: string }) {
    // Supabase .or() usa dot-notation: "column.operator.value,column.operator.value"
    // Ej: "first_name.eq.Juan,first_name.eq.María"
    //     → ("first_name" = 'Juan' OR "first_name" = 'María')
    //
    // También soporta raw SQL como: "LOWER(first_name) ILIKE '%term%',LOWER(last_name) ILIKE '%term%'"
    // Detecta automáticamente el formato.

    const conditions: { column: string; operator: string; value: any }[] = [];
    const parts = filters.split(',').map(p => p.trim()).filter(p => p);

    for (const part of parts) {
      // Intentar parsear dot-notation: column.operator.value
      const match = part.match(/^(.+?)\.(eq|neq|gt|gte|lt|lte|like|ilike|is|in)\.(.+)$/);
      if (match) {
        const [, column, operator, rawValue] = match;
        let value: any = rawValue;
        if (rawValue.toLowerCase() === 'null') {
          value = null;
        } else {
          const num = Number(rawValue);
          if (!isNaN(num) && rawValue.trim() !== '') {
            value = num;
          }
        }
        conditions.push({ column, operator, value });
      } else {
        // No es dot-notation → tratarlo como raw SQL
        conditions.push({ column: '', operator: 'raw', value: part });
      }
    }

    this.builder.addOrGroup(conditions);
    return this;
  }

  // ─── Returns ───
  returns(_type: 'minimal' | 'representation') { return this; }

  // ─── Text Search ───
  textSearch(_column: string, _query: string, _options?: { type?: string; config?: string }) {
    console.warn('[PGliteAdapter] textSearch no implementado aún');
    return this;
  }

  // ─── Ejecución ───
  then<TResult1 = QueryResponse, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    if (!this.resultPromise) {
      this.resultPromise = this.execute();
    }
    return this.resultPromise.then(onfulfilled as any, onrejected);
  }

  /**
   * Normaliza columnas planas de joins (t_persons_ci) a objetos anidados ({ t_persons: { ci } }).
   * 
   * En Supabase, joins con !inner devuelven objetos (relación 1:1 directa por FK).
   * Joins sin !inner devuelven arrays (relación 1:N inversa).
   * 
   * PGlite siempre produce columnas planas (t_persons_ci). Esta función las
   * reagrupa en objetos anidados para compatibilidad con los controllers.
   * 
   * NO elimina las claves planas — controllers que tienen fallbacks
   * (?? t_user_roles_ID_ROLES) siguen funcionando.
   * 
   * Ej: { t_persons_ci: 'V-1234', t_persons_first_name: 'John' }
   *   → { t_persons_ci: 'V-1234', t_persons_first_name: 'John',
   *       t_persons: { ci: 'V-1234', first_name: 'John' } }
   */
  private normalizeJoinRows(rows: any[], joins: JoinNode[]): any[] {
    if (joins.length === 0) return rows;

    // Recolectar recursivamente todos los joins (alias + columnas esperadas)
    function collectJoins(nodes: JoinNode[]): { alias: string; columns: string[] }[] {
      const result: { alias: string; columns: string[] }[] = [];
      for (const node of nodes) {
        const alias = node.alias || node.table;
        result.push({ alias, columns: node.columns });
        result.push(...collectJoins(node.children));
      }
      return result;
    }

    const joinMap = collectJoins(joins);
    if (joinMap.length === 0) return rows;

    return rows.map(row => {
      if (!row || typeof row !== 'object') return row;
      const result = { ...row };

      for (const { alias, columns } of joinMap) {
        const nested: Record<string, any> = {};
        let hasAny = false;

        for (const col of columns) {
          const flatKey = `${alias}_${col}`;
          if (flatKey in result) {
            nested[col] = result[flatKey];
            hasAny = true;
          }
        }

        // Agregar objeto anidado SIN eliminar las claves planas
        // (los controllers pueden tener fallbacks que usan las claves planas)
        if (hasAny) {
          result[alias] = nested;
        }
      }

      return result;
    });
  }

  private async execute(): Promise<QueryResponse> {
    try {
      const { sql, params } = this.builder.buildSQL();
      const result = await this.db.query(sql, params);

      // Transformar resultado al formato Supabase
      const rows = result.rows || [];
      // Normalizar columnas planas de joins a objetos anidados
      const normalizedRows = this.normalizeJoinRows(rows, this.builder['joins']);

      const count = 'count' in result ? (result as any).count : null;

      // Si es head/true (count query)
      if (this.builder['headOnly'] && this.builder['countOption'] === 'exact') {
        return {
          data: null,
          error: null,
          count: Number(rows[0]?.count || 0),
          status: 200,
          statusText: 'OK',
        };
      }

      // Si es single
      if (this.builder['isSingle']) {
        if (normalizedRows.length === 0) {
          return { data: null, error: null, status: 200, statusText: 'OK' };
        }
        if (normalizedRows.length > 1) {
          return {
            data: null,
            error: { message: 'La query devolvió múltiples filas cuando se esperaba una sola', code: 'PGRST100', details: '', hint: '' },
            status: 406,
            statusText: 'Not Acceptable',
          };
        }
        return { data: normalizedRows[0], error: null, status: 200, statusText: 'OK' };
      }

      // Si es maybeSingle
      if (this.builder['isMaybeSingle']) {
        return { data: normalizedRows[0] || null, error: null, status: 200, statusText: 'OK' };
      }

      // Count query (sin head)
      if (this.builder['countOption'] === 'exact') {
        return { data: normalizedRows, error: null, count: normalizedRows.length, status: 200, statusText: 'OK' };
      }

      // SELECT normal
      return { data: normalizedRows, error: null, status: 200, statusText: 'OK' };

    } catch (err: any) {
      console.error('[PGliteAdapter] Error en query:', err);
      return {
        data: null,
        error: { message: err.message || 'Error en PGliteAdapter', code: err.code || 'PGLITE_ERR', details: err.detail || '', hint: '' },
        status: 500,
        statusText: 'Internal Server Error',
      };
    }
  }
}

// ─── PGliteAdapter ───
// Implementación principal que los controllers usarán en modo offline.

export class PGliteAdapter implements DatabaseAdapter {
  private db: PGliteLike;

  constructor(db: PGliteLike) {
    this.db = db;
  }

  from(table: string) {
    return {
      select: (columns: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => {
        const builder = new SqlBuilder(table);
        builder.setSelect(columns, options as any);
        return new PGliteFilterBuilder(this.db, builder);
      },
      insert: (values: any, _options?: { defaultToNull?: boolean }) => {
        const builder = new SqlBuilder(table);
        builder.setInsert(values);
        return new PGliteFilterBuilder(this.db, builder);
      },
      update: (values: any, _options?: { defaultToNull?: boolean }) => {
        const builder = new SqlBuilder(table);
        builder.setUpdate(values);
        return new PGliteFilterBuilder(this.db, builder);
      },
      delete: (_options?: { returning?: 'minimal' | 'representation' }) => {
        const builder = new SqlBuilder(table);
        builder.setDelete();
        return new PGliteFilterBuilder(this.db, builder);
      },
      upsert: (_values: any, _options?: { onConflict?: string; ignoreDuplicates?: boolean; defaultToNull?: boolean }) => {
        // No usado en ningún controller actualmente
        throw new Error('[PGliteAdapter] upsert no implementado aún');
      },
    };
  }

  async rpc(_fn: string, _params?: any): Promise<QueryResponse> {
    // No implementado - backup.controller.ts usa execute_sql y backup.service.ts usa funciones custom
    console.warn('[PGliteAdapter] rpc no implementado aún');
    return { data: null, error: null, status: 501, statusText: 'Not Implemented' };
  }
}
