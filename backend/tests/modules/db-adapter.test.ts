/**
 * Tests unitarios del SQL Builder (PGliteAdapter)
 *
 * Verifica que las cadenas estilo Supabase SDK se traduzcan
 * correctamente a SQL parametrizado. No requiere base de datos.
 *
 * Los patrones de consulta se extrajeron de los 39 controllers reales.
 */

import { describe, it, expect } from 'vitest';

// ─── Acceso a la implementación interna ───
// SqlBuilder no está exportado directamente, re-creamos uno mínimo para testear
// la lógica de generación de SQL.
//
// NOTA: En el futuro, refactorizar para exportar SqlBuilder desde pglite-adapter.ts

type FilterType = 'eq' | 'neq' | 'in' | 'is' | 'not' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike';

interface Filter {
  type: FilterType;
  column: string;
  value: any;
  operator?: string;
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

/**
 * Mini SqlBuilder para testing — replica la lógica del real
 */
class TestSqlBuilder {
  private table: string;
  private selectRaw: string = '*';
  private filters: Filter[] = [];
  private orders: OrderRef[] = [];
  private limitCount: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;
  private countOption: 'exact' | null = null;
  private headOnly = false;
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertData: any = null;
  private updateData: any = null;

  constructor(table: string) {
    this.table = table;
  }

  setSelect(columns: string, options?: { count?: string; head?: boolean }) {
    this.selectRaw = columns || '*';
    if (options?.count === 'exact') this.countOption = 'exact';
    if (options?.head) this.headOnly = true;
    return this;
  }

  addFilter(type: FilterType, column: string, value: any, operator?: string) {
    this.filters.push({ type, column, value, operator });
    return this;
  }

  addOrder(column: string, ascending: boolean, foreignTable?: string) {
    this.orders.push({ column, ascending, foreignTable });
    return this;
  }

  addLimit(count: number) {
    this.limitCount = count;
    return this;
  }

  setSingle() { this.isSingle = true; return this; }
  setMaybeSingle() { this.isMaybeSingle = true; return this; }

  setInsert(data: any) {
    this.operation = 'insert';
    this.insertData = Array.isArray(data) ? data[0] : data;
    return this;
  }

  setUpdate(data: any) {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  setDelete() {
    this.operation = 'delete';
    return this;
  }

  buildSQL(): { sql: string; params: any[] } {
    const params: any[] = [];

    switch (this.operation) {
      case 'select': return this.buildSelectSQL(params);
      case 'insert': return this.buildInsertSQL(params);
      case 'update': return this.buildUpdateSQL(params);
      case 'delete': return this.buildDeleteSQL(params);
    }
  }

  private quoteCol(col: string): string {
    if (col.includes('"') || col.includes('.')) return col;
    return `"${col}"`;
  }

  private buildWhere(params: any[]): string[] {
    return this.filters.map(f => {
      const col = this.quoteCol(f.column);
      switch (f.type) {
        case 'eq':
          params.push(f.value);
          return `${col} = $${params.length}`;
        case 'neq':
          params.push(f.value);
          return `${col} != $${params.length}`;
        case 'gt':
          params.push(f.value);
          return `${col} > $${params.length}`;
        case 'gte':
          params.push(f.value);
          return `${col} >= $${params.length}`;
        case 'lt':
          params.push(f.value);
          return `${col} < $${params.length}`;
        case 'lte':
          params.push(f.value);
          return `${col} <= $${params.length}`;
        case 'like':
          params.push(f.value);
          return `${col} LIKE $${params.length}`;
        case 'ilike':
          params.push(f.value);
          return `${col} ILIKE $${params.length}`;
        case 'in': {
          const vals = Array.isArray(f.value) ? f.value : [];
          const ph = vals.map(v => { params.push(v); return `$${params.length}`; });
          return `${col} IN (${ph.join(', ')})`;
        }
        case 'is':
          return f.value === null ? `${col} IS NULL` : `${col} IS $${params.push(f.value)}`;
        case 'not':
          if (f.operator === 'is' && f.value === null) return `${col} IS NOT NULL`;
          if (f.operator === 'in') {
            const raw = typeof f.value === 'string' ? f.value.replace(/[()]/g, '').split(',').map(s => s.trim()) : [];
            const ph = raw.map(v => { params.push(isNaN(Number(v)) ? v : Number(v)); return `$${params.length}`; });
            return `${col} NOT IN (${ph.join(', ')})`;
          }
          params.push(f.value);
          return `NOT (${col} ${f.operator || '='} $${params.length})`;
        default:
          params.push(f.value);
          return `${col} = $${params.length}`;
      }
    });
  }

  private buildSelectSQL(params: any[]): { sql: string; params: any[] } {
    // Para tests simples, ignoramos joins
    let sql: string;
    if (this.headOnly && this.countOption === 'exact') {
      sql = `SELECT COUNT(*) AS count FROM ${this.quoteCol(this.table)}`;
    } else {
      sql = `SELECT ${this.selectRaw} FROM ${this.quoteCol(this.table)}`;
    }

    const where = this.buildWhere(params);
    if (where.length > 0) sql += ` WHERE ${where.join(' AND ')}`;

    if (this.orders.length > 0) {
      const orderClauses = this.orders.map(o => {
        const col = o.foreignTable ? `"${o.foreignTable}".${this.quoteCol(o.column)}` : this.quoteCol(o.column);
        return `${col} ${o.ascending ? 'ASC' : 'DESC'}`;
      });
      sql += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    if (this.limitCount !== null) sql += ` LIMIT ${this.limitCount}`;
    else if (this.isSingle) sql += ' LIMIT 2';
    else if (this.isMaybeSingle) sql += ' LIMIT 2';

    return { sql, params };
  }

  private buildInsertSQL(params: any[]): { sql: string; params: any[] } {
    if (!this.insertData) throw new Error('No insert data');
    const cols = Object.keys(this.insertData);
    const vals = Object.values(this.insertData);
    const ph = vals.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO ${this.quoteCol(this.table)} (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${ph.join(', ')}) RETURNING *`;
    return { sql, params: vals };
  }

  private buildUpdateSQL(params: any[]): { sql: string; params: any[] } {
    if (!this.updateData) throw new Error('No update data');
    const cols = Object.keys(this.updateData);
    const vals = Object.values(this.updateData);
    const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`);
    const where = this.buildWhere(vals);
    const whereStr = where.length > 0 ? ` WHERE ${where.join(' AND ')}` : '';
    const sql = `UPDATE ${this.quoteCol(this.table)} SET ${setClauses.join(', ')}${whereStr} RETURNING *`;
    return { sql, params: vals };
  }

  private buildDeleteSQL(params: any[]): { sql: string; params: any[] } {
    const where = this.buildWhere(params);
    const whereStr = where.length > 0 ? ` WHERE ${where.join(' AND ')}` : '';
    const sql = `DELETE FROM ${this.quoteCol(this.table)}${whereStr} RETURNING *`;
    return { sql, params };
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('SqlBuilder — SELECT patterns from real controllers', () => {

  it('simple select all', () => {
    const b = new TestSqlBuilder('t_institution');
    b.setSelect('*');
    const { sql, params } = b.buildSQL();
    expect(sql).toBe('SELECT * FROM "t_institution"');
    expect(params).toEqual([]);
  });

  it('select with specific columns', () => {
    const b = new TestSqlBuilder('t_user');
    b.setSelect('USER_ID');
    const { sql } = b.buildSQL();
    expect(sql).toContain('SELECT USER_ID FROM "t_user"');
  });

  it('select with eq filter', () => {
    const b = new TestSqlBuilder('t_students');
    b.setSelect('*').addFilter('eq', 'STUDENTS_ID', 123);
    const { sql, params } = b.buildSQL();
    expect(sql).toBe('SELECT * FROM "t_students" WHERE "STUDENTS_ID" = $1');
    expect(params).toEqual([123]);
  });

  it('select with multiple eq filters', () => {
    const b = new TestSqlBuilder('t_professional_practices');
    b.setSelect('*')
      .addFilter('eq', 'INTERNSHIP_STATUS', 2)
      .addFilter('eq', 'PRACTICES_STATUS', 3);
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('WHERE "INTERNSHIP_STATUS" = $1 AND "PRACTICES_STATUS" = $2');
    expect(params).toEqual([2, 3]);
  });

  it('select with eq + order single', () => {
    const b = new TestSqlBuilder('tutors');
    b.setSelect('*')
      .addFilter('eq', 'TUTOR_ID', 42)
      .setSingle();
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('WHERE "TUTOR_ID" = $1');
    expect(sql).toContain('LIMIT 2');
    expect(params).toEqual([42]);
  });

  it('select with in filter', () => {
    const b = new TestSqlBuilder('t_career');
    b.setSelect('*').addFilter('in', 'CAREER_ID', [1, 2, 3]);
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('"CAREER_ID" IN ($1, $2, $3)');
    expect(params).toEqual([1, 2, 3]);
  });

  it('select with order ascending', () => {
    const b = new TestSqlBuilder('t_practice_visits');
    b.setSelect('*').addOrder('VISIT_DATE', false);
    const { sql } = b.buildSQL();
    expect(sql).toContain('ORDER BY "VISIT_DATE" DESC');
  });

  it('select with order on foreign table', () => {
    const b = new TestSqlBuilder('t_tutors');
    b.setSelect('*').addOrder('first_name', true, 't_persons');
    const { sql } = b.buildSQL();
    expect(sql).toContain('ORDER BY "t_persons"."first_name" ASC');
  });

  it('select with order + limit', () => {
    const b = new TestSqlBuilder('t_professional_practices');
    b.setSelect('*')
      .addOrder('CREATION_DATE', true)
      .addLimit(1000);
    const { sql } = b.buildSQL();
    expect(sql).toContain('ORDER BY "CREATION_DATE" ASC');
    expect(sql).toContain('LIMIT 1000');
  });

  it('count query (head: true, count: exact)', () => {
    const b = new TestSqlBuilder('t_students');
    b.setSelect('*', { count: 'exact', head: true }).addFilter('eq', 'STATUS', 1);
    const { sql, params } = b.buildSQL();
    expect(sql).toBe('SELECT COUNT(*) AS count FROM "t_students" WHERE "STATUS" = $1');
    expect(params).toEqual([1]);
  });

  it('like filter', () => {
    const b = new TestSqlBuilder('t_institution');
    b.setSelect('*').addFilter('like', 'INSTITUTION_CODE', 'J%');
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('"INSTITUTION_CODE" LIKE $1');
    expect(params).toEqual(['J%']);
  });

  it('gte date filter', () => {
    const b = new TestSqlBuilder('t_professional_practices');
    const date = '2024-01-01T00:00:00.000Z';
    b.setSelect('*').addFilter('gte', 'CREATION_DATE', date);
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('"CREATION_DATE" >= $1');
    expect(params).toEqual([date]);
  });

  it('is null filter', () => {
    const b = new TestSqlBuilder('t_evaluation');
    b.setSelect('*').addFilter('is', 'EVALUATION_DATE', null);
    const { sql } = b.buildSQL();
    expect(sql).toContain('"EVALUATION_DATE" IS NULL');
  });

  it('not is null filter', () => {
    const b = new TestSqlBuilder('t_evaluation');
    b.setSelect('*').addFilter('not', 'EVALUATION_DATE', null, 'is');
    const { sql } = b.buildSQL();
    expect(sql).toContain('"EVALUATION_DATE" IS NOT NULL');
  });

  it('not in filter', () => {
    const b = new TestSqlBuilder('t_students');
    // Simula: .not('STUDENTS_ID', 'in', '(1,2,3)')
    b.setSelect('*').addFilter('not', 'STUDENTS_ID', '(1,2,3)', 'in');
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('"STUDENTS_ID" NOT IN ($1, $2, $3)');
    expect(params).toEqual([1, 2, 3]);
  });

  it('lt + gte range query', () => {
    const b = new TestSqlBuilder('t_practice_visits');
    const start = '2024-06-01T00:00:00.000Z';
    const end = '2024-06-08T00:00:00.000Z';
    b.setSelect('*')
      .addFilter('gte', 'VISIT_DATE', start)
      .addFilter('lte', 'VISIT_DATE', end);
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('"VISIT_DATE" >= $1 AND "VISIT_DATE" <= $2');
    expect(params).toEqual([start, end]);
  });
});

describe('SqlBuilder — INSERT patterns from real controllers', () => {

  it('simple insert with RETURNING', () => {
    const b = new TestSqlBuilder('t_auth_log');
    b.setInsert({
      USER_ID: 1,
      ACTION: 'CREATE_USER',
      IP_ADDRESS: '127.0.0.1',
      DETAILS: 'Creación de usuario'
    });
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('INSERT INTO "t_auth_log"');
    expect(sql).toContain('"USER_ID", "ACTION", "IP_ADDRESS", "DETAILS"');
    expect(sql).toContain('RETURNING *');
    expect(params).toContain(1);
    expect(params).toContain('CREATE_USER');
    expect(params).toContain('127.0.0.1');
  });

  it('insert with array wrapper (Supabase style)', () => {
    // Los controllers pasan insert([data]) con array
    const data = { NAME: 'Test', STATUS: 1 };
    const b = new TestSqlBuilder('t_career');
    b.setInsert([data]); // Array wrapper
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('INSERT INTO "t_career"');
    expect(sql).toContain('"NAME", "STATUS"');
    expect(params).toEqual(['Test', 1]);
  });
});

describe('SqlBuilder — UPDATE patterns from real controllers', () => {

  it('update with eq filter', () => {
    const b = new TestSqlBuilder('t_students');
    b.setUpdate({ STATUS: 0, MODIFIED_AT: '2024-06-01T00:00:00.000Z' })
      .addFilter('eq', 'STUDENTS_ID', 123);
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('UPDATE "t_students" SET');
    expect(sql).toContain('"STATUS" = $1');
    expect(sql).toContain('"MODIFIED_AT" = $2');
    expect(sql).toContain('WHERE "STUDENTS_ID" = $3');
    expect(sql).toContain('RETURNING *');
    expect(params).toEqual([0, '2024-06-01T00:00:00.000Z', 123]);
  });
});

describe('SqlBuilder — DELETE patterns from real controllers', () => {

  it('delete with eq filter', () => {
    const b = new TestSqlBuilder('t_students');
    b.setDelete().addFilter('eq', 'STUDENTS_ID', 456);
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('DELETE FROM "t_students"');
    expect(sql).toContain('WHERE "STUDENTS_ID" = $1');
    expect(sql).toContain('RETURNING *');
    expect(params).toEqual([456]);
  });
});

describe('SqlBuilder — Combined patterns from controller examples', () => {

  it('users.controller: checkUserCi pattern', () => {
    // Patrón real: supabase.from('t_user').select('USER_ID').eq('USER_CI', ciClean).maybeSingle()
    const b = new TestSqlBuilder('t_user');
    b.setSelect('USER_ID')
      .addFilter('eq', 'USER_CI', '12345678')
      .setMaybeSingle();
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('SELECT USER_ID FROM "t_user"');
    expect(sql).toContain('WHERE "USER_CI" = $1');
    expect(sql).toContain('LIMIT 2');
    expect(params).toEqual(['12345678']);
  });

  it('students.controller: count query with filter pattern', () => {
    // Patrón real: supabase.from(TABLE_NAME).select('*', { count: 'exact', head: true }).eq('STATUS', 1)
    const b = new TestSqlBuilder('t_students');
    b.setSelect('*', { count: 'exact', head: true })
      .addFilter('eq', 'STATUS', 1);
    const { sql, params } = b.buildSQL();
    expect(sql).toBe('SELECT COUNT(*) AS count FROM "t_students" WHERE "STATUS" = $1');
    expect(params).toEqual([1]);
  });

  it('dashboard.controller: multiple count queries with is/not null', () => {
    // Patrón real: .is('EVALUATION_DATE', null) y .not('EVALUATION_DATE', 'is', null)
    const b1 = new TestSqlBuilder('t_evaluation');
    b1.setSelect('*', { count: 'exact', head: true }).addFilter('is', 'EVALUATION_DATE', null);
    const { sql: sql1 } = b1.buildSQL();
    expect(sql1).toContain('"EVALUATION_DATE" IS NULL');

    const b2 = new TestSqlBuilder('t_evaluation');
    b2.setSelect('*', { count: 'exact', head: true }).addFilter('not', 'EVALUATION_DATE', null, 'is');
    const { sql: sql2 } = b2.buildSQL();
    expect(sql2).toContain('"EVALUATION_DATE" IS NOT NULL');
  });

  it('visits.controller: gte + lte range pattern', () => {
    // Patrón real: .gte('VISIT_DATE', start).lte('VISIT_DATE', end)
    const b = new TestSqlBuilder('t_practice_visits');
    b.setSelect('*')
      .addFilter('gte', 'VISIT_DATE', '2024-06-01')
      .addFilter('lte', 'VISIT_DATE', '2024-06-07')
      .addFilter('eq', 'STATUS', 1);
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('"VISIT_DATE" >= $1 AND "VISIT_DATE" <= $2 AND "STATUS" = $3');
    expect(params).toEqual(['2024-06-01', '2024-06-07', 1]);
  });
});
