/**
 * Tests unitarios del SQL Builder (PGliteAdapter)
 *
 * Verifica que las cadenas estilo Supabase SDK se traduzcan
 * correctamente a SQL parametrizado. No requiere base de datos.
 *
 * Los patrones de consulta se extrajeron de los 39 controllers reales.
 */

import { describe, it, expect } from 'vitest';
import { SqlBuilder } from '../../src/lib/pglite-adapter.js';

// ============================================================================
// TESTS
// ============================================================================

describe('SqlBuilder — SELECT patterns from real controllers', () => {

  it('simple select all', () => {
    const b = new SqlBuilder('t_institution');
    b.setSelect('*');
    const { sql, params } = b.buildSQL();
    expect(sql).toBe('SELECT * FROM "t_institution"');
    expect(params).toEqual([]);
  });

  it('select with specific columns', () => {
    const b = new SqlBuilder('t_user');
    b.setSelect('USER_ID');
    const { sql } = b.buildSQL();
    expect(sql).toContain('SELECT "USER_ID" FROM "t_user"');
  });

  it('select with eq filter', () => {
    const b = new SqlBuilder('t_students');
    b.setSelect('*').addFilter('eq', 'STUDENTS_ID', 123);
    const { sql, params } = b.buildSQL();
    expect(sql).toBe('SELECT * FROM "t_students" WHERE "STUDENTS_ID" = $1');
    expect(params).toEqual([123]);
  });

  it('select with multiple eq filters', () => {
    const b = new SqlBuilder('t_professional_practices');
    b.setSelect('*')
      .addFilter('eq', 'INTERNSHIP_STATUS', 2)
      .addFilter('eq', 'PRACTICES_STATUS', 3);
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('WHERE "INTERNSHIP_STATUS" = $1 AND "PRACTICES_STATUS" = $2');
    expect(params).toEqual([2, 3]);
  });

  it('select with eq + order single', () => {
    const b = new SqlBuilder('tutors');
    b.setSelect('*')
      .addFilter('eq', 'TUTOR_ID', 42)
      .setSingle();
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('WHERE "TUTOR_ID" = $1');
    expect(sql).toContain('LIMIT 2');
    expect(params).toEqual([42]);
  });

  it('select with in filter', () => {
    const b = new SqlBuilder('t_career');
    b.setSelect('*').addFilter('in', 'CAREER_ID', [1, 2, 3]);
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('"CAREER_ID" IN ($1, $2, $3)');
    expect(params).toEqual([1, 2, 3]);
  });

  it('select with order ascending', () => {
    const b = new SqlBuilder('t_practice_visits');
    b.setSelect('*').addOrder('VISIT_DATE', false);
    const { sql } = b.buildSQL();
    expect(sql).toContain('ORDER BY "VISIT_DATE" DESC');
  });

  it('select with order on foreign table', () => {
    const b = new SqlBuilder('t_tutors');
    b.setSelect('*').addOrder('first_name', true, 't_persons');
    const { sql } = b.buildSQL();
    expect(sql).toContain('ORDER BY "t_persons"."first_name" ASC');
  });

  it('select with order + limit', () => {
    const b = new SqlBuilder('t_professional_practices');
    b.setSelect('*')
      .addOrder('CREATION_DATE', true)
      .addLimit(1000);
    const { sql } = b.buildSQL();
    expect(sql).toContain('ORDER BY "CREATION_DATE" ASC');
    expect(sql).toContain('LIMIT 1000');
  });

  it('count query (head: true, count: exact)', () => {
    const b = new SqlBuilder('t_students');
    b.setSelect('*', { count: 'exact', head: true }).addFilter('eq', 'STATUS', 1);
    const { sql, params } = b.buildSQL();
    expect(sql).toBe('SELECT COUNT(*) AS count FROM "t_students" WHERE "STATUS" = $1');
    expect(params).toEqual([1]);
  });

  it('like filter', () => {
    const b = new SqlBuilder('t_institution');
    b.setSelect('*').addFilter('like', 'INSTITUTION_CODE', 'J%');
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('"INSTITUTION_CODE" LIKE $1');
    expect(params).toEqual(['J%']);
  });

  it('gte date filter', () => {
    const b = new SqlBuilder('t_professional_practices');
    const date = '2024-01-01T00:00:00.000Z';
    b.setSelect('*').addFilter('gte', 'CREATION_DATE', date);
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('"CREATION_DATE" >= $1');
    expect(params).toEqual([date]);
  });

  it('is null filter', () => {
    const b = new SqlBuilder('t_evaluation');
    b.setSelect('*').addFilter('is', 'EVALUATION_DATE', null);
    const { sql } = b.buildSQL();
    expect(sql).toContain('"EVALUATION_DATE" IS NULL');
  });

  it('not is null filter', () => {
    const b = new SqlBuilder('t_evaluation');
    b.setSelect('*').addFilter('not', 'EVALUATION_DATE', null, 'is');
    const { sql } = b.buildSQL();
    expect(sql).toContain('"EVALUATION_DATE" IS NOT NULL');
  });

  it('not in filter', () => {
    const b = new SqlBuilder('t_students');
    // Simula: .not('STUDENTS_ID', 'in', '(1,2,3)')
    b.setSelect('*').addFilter('not', 'STUDENTS_ID', '(1,2,3)', 'in');
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('"STUDENTS_ID" NOT IN ($1, $2, $3)');
    expect(params).toEqual([1, 2, 3]);
  });

  it('lt + gte range query', () => {
    const b = new SqlBuilder('t_practice_visits');
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
    const b = new SqlBuilder('t_auth_log');
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
    const b = new SqlBuilder('t_career');
    b.setInsert([data]); // Array wrapper
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('INSERT INTO "t_career"');
    expect(sql).toContain('"NAME", "STATUS"');
    expect(params).toEqual(['Test', 1]);
  });
});

describe('SqlBuilder — UPDATE patterns from real controllers', () => {

  it('update with eq filter', () => {
    const b = new SqlBuilder('t_students');
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
    const b = new SqlBuilder('t_students');
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
    const b = new SqlBuilder('t_user');
    b.setSelect('USER_ID')
      .addFilter('eq', 'USER_CI', '12345678')
      .setMaybeSingle();
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('SELECT "USER_ID" FROM "t_user"');
    expect(sql).toContain('WHERE "USER_CI" = $1');
    expect(sql).toContain('LIMIT 2');
    expect(params).toEqual(['12345678']);
  });

  it('students.controller: count query with filter pattern', () => {
    // Patrón real: supabase.from(TABLE_NAME).select('*', { count: 'exact', head: true }).eq('STATUS', 1)
    const b = new SqlBuilder('t_students');
    b.setSelect('*', { count: 'exact', head: true })
      .addFilter('eq', 'STATUS', 1);
    const { sql, params } = b.buildSQL();
    expect(sql).toBe('SELECT COUNT(*) AS count FROM "t_students" WHERE "STATUS" = $1');
    expect(params).toEqual([1]);
  });

  it('dashboard.controller: multiple count queries with is/not null', () => {
    // Patrón real: .is('EVALUATION_DATE', null) y .not('EVALUATION_DATE', 'is', null)
    const b1 = new SqlBuilder('t_evaluation');
    b1.setSelect('*', { count: 'exact', head: true }).addFilter('is', 'EVALUATION_DATE', null);
    const { sql: sql1 } = b1.buildSQL();
    expect(sql1).toContain('"EVALUATION_DATE" IS NULL');

    const b2 = new SqlBuilder('t_evaluation');
    b2.setSelect('*', { count: 'exact', head: true }).addFilter('not', 'EVALUATION_DATE', null, 'is');
    const { sql: sql2 } = b2.buildSQL();
    expect(sql2).toContain('"EVALUATION_DATE" IS NOT NULL');
  });

  it('visits.controller: gte + lte range pattern', () => {
    // Patrón real: .gte('VISIT_DATE', start).lte('VISIT_DATE', end)
    const b = new SqlBuilder('t_practice_visits');
    b.setSelect('*')
      .addFilter('gte', 'VISIT_DATE', '2024-06-01')
      .addFilter('lte', 'VISIT_DATE', '2024-06-07')
      .addFilter('eq', 'STATUS', 1);
    const { sql, params } = b.buildSQL();
    expect(sql).toContain('"VISIT_DATE" >= $1 AND "VISIT_DATE" <= $2 AND "STATUS" = $3');
    expect(params).toEqual(['2024-06-01', '2024-06-07', 1]);
  });
});

describe('SqlBuilder — JOIN patterns', () => {

  it('simple LEFT JOIN: t_persons(columns)', () => {
    // select(`*, t_persons(ci, first_name)`)
    const b = new SqlBuilder('t_students');
    b.setSelect('*, t_persons(ci, first_name)');
    const { sql } = b.buildSQL();

    expect(sql).toContain('SELECT');
    expect(sql).toContain('FROM "t_students"');
    expect(sql).toContain('LEFT JOIN');
    expect(sql).toContain('"t_persons" AS "t_persons"');
    // El quoting: tabla sin comillas externas, columna quoted
    expect(sql).toContain('t_students."person_id" = "t_persons"."PERSON_ID"');
    // Las columnas del join aparecen en SELECT con alias
    expect(sql).toContain('t_persons."ci" AS "t_persons_ci"');
    expect(sql).toContain('t_persons."first_name" AS "t_persons_first_name"');
  });

  it('INNER JOIN: t_persons!inner(columns)', () => {
    // select(`*, t_persons!inner(ci, email)`)
    const b = new SqlBuilder('t_students');
    b.setSelect('*, t_persons!inner(ci, email)');
    const { sql } = b.buildSQL();

    expect(sql).toContain('INNER JOIN');
    expect(sql).toContain('"t_persons" AS "t_persons"');
    expect(sql).toContain('t_students."person_id" = "t_persons"."PERSON_ID"');
    expect(sql).not.toContain('LEFT JOIN');
  });

  it('join with alias: alias:TABLE(columns)', () => {
    // select(`*, institution:INSTITUTION_ID(*)`)
    const b = new SqlBuilder('t_professional_practices');
    b.setSelect('*, institution:INSTITUTION_ID(*)');
    const { sql } = b.buildSQL();

    expect(sql).toContain('LEFT JOIN');
    // INSTITUTION_ID en FK_COLUMN_MAP → t_institution
    expect(sql).toContain('"t_institution" AS "institution"');
    expect(sql).toContain('t_professional_practices."INSTITUTION_ID" = "institution"."INSTITUTION_ID"');
  });

  it('multiple joins', () => {
    // select(`*, t_career(CAREER_NAME), t_persons!inner(ci, email)`)
    const b = new SqlBuilder('t_enrollment');
    b.setSelect('*, t_career(CAREER_NAME), t_persons!inner(ci, email)');
    const { sql } = b.buildSQL();

    expect(sql).toContain('LEFT JOIN "t_career" AS "t_career"');
    expect(sql).toContain('t_enrollment."CAREER_ID" = "t_career"."CAREER_ID"');
    expect(sql).toContain('INNER JOIN "t_persons" AS "t_persons"');
    expect(sql).toContain('JOIN'); // al menos 2 joins
  });

  it('nested join with children: tabla(hijos)', () => {
    // select(`*, t_career(t_career_internship_type(t_internship_type(NAME)))`)
    const b = new SqlBuilder('t_enrollment');
    b.setSelect('*, t_career(CAREER_ID, t_career_internship_type(t_internship_type(NAME)))');
    const { sql } = b.buildSQL();

    expect(sql).toContain('LEFT JOIN "t_career" AS "t_career"');
    expect(sql).toContain('LEFT JOIN "t_career_internship_type" AS "t_career_internship_type"');
    expect(sql).toContain('LEFT JOIN "t_internship_type" AS "t_internship_type"');
  });

  it('join with specific main columns + joined columns', () => {
    // select(`STUDENTS_ID, t_career(CAREER_NAME)`)
    // Con joins, las columnas principales se califican con la tabla base para evitar ambigüedad
    const b = new SqlBuilder('t_students');
    b.setSelect('STUDENTS_ID, t_career(CAREER_NAME)');
    const { sql } = b.buildSQL();

    expect(sql).toContain('SELECT "t_students"."STUDENTS_ID"');
    expect(sql).toContain('t_career."CAREER_NAME" AS "t_career_CAREER_NAME"');
    expect(sql).toContain('LEFT JOIN "t_career" AS "t_career"');
  });

  it('global-search: students with inner join persons + career join', () => {
    // select(`STUDENTS_ID, t_career(CAREER_NAME), SEMESTER, t_persons!inner(ci, first_name, last_name, email)`)
    // Con joins, las columnas principales se califican con la tabla base
    const b = new SqlBuilder('t_students');
    b.setSelect('STUDENTS_ID, t_career(CAREER_NAME), SEMESTER, t_persons!inner(ci, first_name, last_name, email)');
    const { sql } = b.buildSQL();

    expect(sql).toContain('SELECT "t_students"."STUDENTS_ID", "t_students"."SEMESTER"');
    expect(sql).toContain('INNER JOIN "t_persons" AS "t_persons"');
    expect(sql).toContain('t_students."person_id" = "t_persons"."PERSON_ID"');
    expect(sql).toContain('t_career."CAREER_NAME" AS "t_career_CAREER_NAME"');
    expect(sql).toContain('t_persons."ci" AS "t_persons_ci"');
    expect(sql).toContain('t_persons."email" AS "t_persons_email"');
  });
});

describe('SqlBuilder — .or() filter patterns', () => {

  it('or with two conditions', () => {
    // Simula .or('STATUS.eq.1,STATUS.eq.2')
    const b = new SqlBuilder('t_students');
    b.setSelect('*');
    b.addFilter('raw', '', '(STATUS = $1 OR STATUS = $2)');
    const { sql, params } = b.buildSQL();

    expect(sql).toContain('WHERE');
    expect(sql).toContain('(STATUS = $1 OR STATUS = $2)');
    expect(params).toEqual([]); // raw filters don't push params directly
  });

  it('or with .eq and .eq combined', () => {
    // Simula: .eq('STATUS', 1).or('INTERNSHIP_STATUS.eq.2,INTERNSHIP_STATUS.eq.3')
    const b = new SqlBuilder('t_professional_practices');
    b.setSelect('*')
      .addFilter('eq', 'STATUS', 1)
      .addFilter('raw', '', '("INTERNSHIP_STATUS" = $2 OR "INTERNSHIP_STATUS" = $3)');
    const { sql, params } = b.buildSQL();

    expect(sql).toContain('"STATUS" = $1');
    expect(sql).toContain('("INTERNSHIP_STATUS" = $2 OR "INTERNSHIP_STATUS" = $3)');
    expect(params).toEqual([1]);
  });

  it('or with ILIKE conditions from global-search', () => {
    // Simula .or("LOWER(t_persons.first_name) ILIKE '%term%',LOWER(t_persons.last_name) ILIKE '%term%'")
    const b = new SqlBuilder('t_students');
    b.setSelect('*, t_persons!inner(ci, first_name, last_name, email)');
    b.addFilter('eq', 'STATUS', true);
    b.addFilter('raw', '', '(LOWER(t_persons.first_name) ILIKE \'%term%\' OR LOWER(t_persons.last_name) ILIKE \'%term%\')');
    const { sql, params } = b.buildSQL();

    expect(sql).toContain('"STATUS" = $1');
    expect(sql).toContain('LOWER(t_persons.first_name) ILIKE');
    expect(sql).toContain('LOWER(t_persons.last_name) ILIKE');
    expect(params).toEqual([true]);
    expect(sql).toContain('INNER JOIN');
  });
});
