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
  type: 'eq' | 'neq' | 'in' | 'is' | 'not' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike';
  column: string;
  value: any;
  operator?: string;   // para .not(column, operator, value)
}

interface JoinRef {
  table: string;
  columns: string[];
  isInner: boolean;
  alias?: string;
}

interface OrderRef {
  column: string;
  ascending: boolean;
  foreignTable?: string;
}

// Mapa de FK conocido entre tablas (extraído del schema de Supabase).
// Formato: { tabla_hija: { fk_column: tabla_padre } }
const KNOWN_FOREIGN_KEYS: Record<string, Record<string, string>> = {
  // t_persons es referencia central
  t_students:                { person_id: 't_persons' },
  t_tutors:                  { person_id: 't_persons' },
  t_user:                    { person_id: 't_persons' },
  t_institutional_responsible: { person_id: 't_persons' },

  // Relaciones académicas
  t_enrollment:              { STUDENT_ID: 't_students', PERIOD_ID: 't_periods', CAREER_ID: 't_career' },
  t_professional_practices:  { STUDENT_ID: 't_students', INSTITUTION_ID: 't_institution', CAREER_ID: 't_career', PERIOD_ID: 't_periods' },
  t_professional_practices_tutor: { PROFESSIONAL_PRACTICE_ID: 't_professional_practices', TUTOR_ID: 't_tutors' },
  t_tutor_career:            { TUTOR_ID: 't_tutors', CAREER_ID: 't_career' },
  t_career:                  { CAREER_ID: 't_career' },
  t_career_internship_type:  { CAREER_ID: 't_career', INTERNSHIP_TYPE_ID: 't_internship_type' },
  t_internship_type:         { INTERNSHIP_TYPE_ID: 't_internship_type' },
  t_internships_period:      { PERIOD_ID: 't_periods' },

  // Visitas y evaluaciones
  t_practice_visits:         { PROFESSIONAL_PRACTICE_ID: 't_professional_practices', TUTOR_ID: 't_tutors' },
  t_activity_logs:           { PROFESSIONAL_PRACTICE_ID: 't_professional_practices' },
  t_evaluation:              { PROFESSIONAL_PRACTICE_ID: 't_professional_practices' },
  t_evaluation_detail:       { EVALUATION_ID: 't_evaluation' },

  // Gestión
  t_institution:             { },
  t_institution_manager_institution: { MANAGER_ID: 't_institutional_responsible', INSTITUTION_ID: 't_institution' },
  t_user_roles:              { USER_ID: 't_user', ID_ROLS: 't_roles' },
  t_role_permissions:        { ID_ROLS: 't_roles', PERMISSION_ID: 't_permissions' },
  t_visit_files:             { VISIT_ID: 't_practice_visits' },
  t_person_merge_log:        { SURVIVOR_PERSON_ID: 't_persons', MERGED_PERSON_ID: 't_persons' },
};

function resolveFK(fromTable: string, targetTable: string): string | null {
  // Buscar FK directa
  const fks = KNOWN_FOREIGN_KEYS[fromTable];
  if (fks) {
    for (const [col, tbl] of Object.entries(fks)) {
      if (tbl === targetTable) return col;
    }
  }
  // Buscar FK inversa (otra tabla apunta a esta)
  for (const [otherTable, otherFks] of Object.entries(KNOWN_FOREIGN_KEYS)) {
    if (otherTable === fromTable) continue;
    for (const [col, tbl] of Object.entries(otherFks)) {
      if (tbl === fromTable && otherTable === targetTable) return col;
    }
  }
  // Fallback: convención por naming
  const convention1 = `${targetTable.replace('t_', '').toUpperCase()}_ID`;
  if (fks?.[convention1]) return convention1;
  return null;
}

function resolveInverseFK(fromTable: string, targetTable: string): { fkColumn: string; sourceTable: string } | null {
  // Caso t_persons es el target y fromTable tiene person_id
  const fks = KNOWN_FOREIGN_KEYS[fromTable];
  if (fks) {
    for (const [col, tbl] of Object.entries(fks)) {
      if (tbl === targetTable) return { fkColumn: col, sourceTable: fromTable };
    }
  }
  return null;
}

class SqlBuilder {
  private table: string;
  private selectRaw: string = '*';
  private filters: Filter[] = [];
  private orders: OrderRef[] = [];
  private limitCount: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;
  private countOption: 'exact' | null = null;
  private headOnly = false;
  private joins: JoinRef[] = [];
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertData: any = null;
  private updateData: any = null;
  // Flag para saber si ya se ejecutó y no acepta más encadenamiento (para insert/update/delete)
  private executed = false;

  constructor(table: string) {
    this.table = table;
  }

  // ─── Configuración de SELECT ───

  setSelect(columns: string, options?: { count?: string; head?: boolean }) {
    this.selectRaw = columns || '*';
    if (options?.count === 'exact') this.countOption = 'exact';
    if (options?.head) this.headOnly = true;

    // Parsear foreign table references en la select string
    // Ej: "*, t_persons!inner(ci, email)" o "t_visit(VISIT_ID)"
    // También: "alias:table(col1, col2)"
    this.parseJoinsFromSelect(columns);
    return this;
  }

  private parseJoinsFromSelect(selectStr: string) {
    // Patrón: tableName(columns) o tableName!inner(columns) o alias:tableName(columns)
    const joinPattern = /(?:(?:,\s*)?(\w+))\s*(?::(\w+))?\s*(?:!inner)?\s*\(([^)]*)\)/g;
    let match;
    while ((match = joinPattern.exec(selectStr)) !== null) {
      const fullMatch = match[0];
      const tableName = match[2] || match[1]; // Si tiene alias, el nombre real está en grupo 2
      const alias = match[2] ? match[1] : undefined;
      const cols = match[3].split(',').map(c => c.trim());
      // Determinar inner o left
      const isInner = fullMatch.includes('!inner');
      // Solo procesar si parece una referencia a tabla foránea (empieza con t_ normalmente)
      if (tableName.startsWith('t_') || tableName.startsWith('t')) {
        this.joins.push({ table: tableName, columns: cols, isInner, alias });
      }
    }
  }

  // ─── Filtros ───

  addFilter(type: Filter['type'], column: string, value: any, operator?: string) {
    this.filters.push({ type, column, value, operator });
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
    // SELECT columns
    let selectClause: string;

    if (this.headOnly && this.countOption === 'exact') {
      // COUNT query
      selectClause = 'COUNT(*) AS count';
    } else {
      // Columnas principales
      const mainCols = this.parseMainColumns(this.selectRaw);
      // Columnas de joins
      const joinCols = this.joins.flatMap(j =>
        j.columns.map(c => `${j.alias || j.table}.${this.quoteCol(c)} AS "${j.alias || j.table}_${c}"`)
      );
      const allCols = [...mainCols, ...joinCols];
      selectClause = allCols.length > 0 ? allCols.join(', ') : '*';
    }

    // FROM
    let sql = `SELECT ${selectClause} FROM ${this.quoteCol(this.table)}`;

    // JOINs
    for (const join of this.joins) {
      const fkCol = resolveFK(this.table, join.table);
      const inverseFk = resolveInverseFK(this.table, join.table);

      if (fkCol) {
        // FK directa: this.table.fkCol = join.table.PK (asumimos PK = ID columna con _ID)
        const pkCol = Object.keys(KNOWN_FOREIGN_KEYS[join.table] || {}).find(k => k.endsWith('_ID'))
          || `${join.table.replace('t_', '').toUpperCase()}_ID`;
        const joinType = join.isInner ? 'INNER JOIN' : 'LEFT JOIN';
        sql += ` ${joinType} ${this.quoteCol(join.table)} AS "${join.alias || join.table}" ON ${this.table}.${this.quoteCol(fkCol)} = "${join.alias || join.table}".${this.quoteCol(pkCol)}`;
      } else if (inverseFk) {
        // FK inversa: join.table apunta a this.table
        const pkCol = this.findPK();
        const joinType = join.isInner ? 'INNER JOIN' : 'LEFT JOIN';
        sql += ` ${joinType} ${this.quoteCol(join.table)} AS "${join.alias || join.table}" ON "${join.alias || join.table}".${this.quoteCol(inverseFk.fkColumn)} = ${this.table}.${this.quoteCol(pkCol)}`;
      } else {
        // No se encontró FK - usar LEFT JOIN con condición genérica
        // Esto puede fallar pero al menos no crashea
        console.warn(`[PGliteAdapter] FK desconocida entre ${this.table} y ${join.table}, usando LEFT JOIN sin ON`);
        sql += ` LEFT JOIN ${this.quoteCol(join.table)} AS "${join.alias || join.table}" ON 1=0`;
      }
    }

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

    // LIMIT
    if (this.limitCount !== null) {
      sql += ` LIMIT ${this.limitCount}`;
    } else if (this.isSingle) {
      sql += ' LIMIT 2'; // Para detectar si hay más de 1
    } else if (this.isMaybeSingle) {
      sql += ' LIMIT 2';
    }

    return { sql, params };
  }

  private findPK(): string {
    // Intenta encontrar la PK de la tabla basada en convención
    const candidates = [
      `${this.table.replace('t_', '').toUpperCase()}_ID`,
      'ID',
      'id',
      `${this.table}_id`,
    ];
    // Devolvemos la primera candidata (no podemos saber sin schema real)
    return candidates[0];
  }

  private parseMainColumns(selectRaw: string): string[] {
    // Remover las referencias a foreign tables (con paréntesis)
    let cleaned = selectRaw.replace(/\w+(?:\.\w+)?\s*:\s*\w+\s*\([^)]*\)/g, '');
    cleaned = cleaned.replace(/\w+\s*!?\w*\s*\([^)]*\)/g, '');
    // Partir por comas y limpiar
    const parts = cleaned.split(',').map(p => p.trim()).filter(p => p && p !== '*');
    if (parts.length === 0) return ['*'];
    return parts;
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
    return this.filters.map(f => this.buildWhereClause(f, params, startIndex));
  }

  private buildWhereClausesForUpdate(params: any[], startIndex: number): string[] {
    return this.filters.map(f => this.buildWhereClause(f, params, startIndex));
  }

  private buildWhereClause(filter: Filter, params: any[], startIndex: number): string {
    const col = this.quoteCol(filter.column);

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
      case 'not':
        // .not(column, operator, value) - ej: .not('STUDENTS_ID', 'in', '(1,2,3)')
        // También .not('EVALUATION_DATE', 'is', null)
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

  // ─── Single ───
  single() { this.builder.setSingle(); return this; }
  maybeSingle() { this.builder.setMaybeSingle(); return this; }

  // ─── OR ───
  or(filters: string, _options?: { foreignTable?: string }) {
    this.builder.addFilter('eq' as any, `(${filters})`, true);
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

  private async execute(): Promise<QueryResponse> {
    try {
      const { sql, params } = this.builder.buildSQL();
      const result = await this.db.query(sql, params);

      // Transformar resultado al formato Supabase
      const rows = result.rows || [];
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
        if (rows.length === 0) {
          return { data: null, error: null, status: 200, statusText: 'OK' };
        }
        if (rows.length > 1) {
          return {
            data: null,
            error: { message: 'La query devolvió múltiples filas cuando se esperaba una sola', code: 'PGRST100', details: '', hint: '' },
            status: 406,
            statusText: 'Not Acceptable',
          };
        }
        return { data: rows[0], error: null, status: 200, statusText: 'OK' };
      }

      // Si es maybeSingle
      if (this.builder['isMaybeSingle']) {
        return { data: rows[0] || null, error: null, status: 200, statusText: 'OK' };
      }

      // Count query (sin head)
      if (this.builder['countOption'] === 'exact') {
        return { data: rows, error: null, count: rows.length, status: 200, statusText: 'OK' };
      }

      // SELECT normal
      return { data: rows, error: null, status: 200, statusText: 'OK' };

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
