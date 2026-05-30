/**
 * Integration tests: PGliteAdapter ejecutando contra PGlite real
 *
 * Verifica que el SQL generado por SqlBuilder se ejecute correctamente
 * contra PostgreSQL in-memory (PGlite WASM).
 *
 * Crea tablas reales con datos y ejecuta queries completas.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { PGliteAdapter } from '../../src/lib/pglite-adapter.js';

type PGliteInstance = InstanceType<typeof PGlite>;

describe('PGliteAdapter — Integration with real PGlite', () => {
  let db: PGliteInstance;
  let adapter: PGliteAdapter;

  beforeAll(async () => {
    db = new PGlite();

    // Crear tablas con columnas quoted (estilo del schema real de Supabase)
    // para que coincidan con el quoting que genera el SQL Builder
    await db.query(`
      CREATE TABLE "t_persons" (
        "PERSON_ID" SERIAL PRIMARY KEY,
        "ci" VARCHAR(20) NOT NULL,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(200)
      )
    `);
    await db.query(`
      CREATE TABLE "t_career" (
        "CAREER_ID" SERIAL PRIMARY KEY,
        "CAREER_NAME" VARCHAR(200) NOT NULL,
        "STATUS" SMALLINT DEFAULT 1
      )
    `);
    await db.query(`
      CREATE TABLE "t_students" (
        "STUDENTS_ID" SERIAL PRIMARY KEY,
        "person_id" INT NOT NULL REFERENCES "t_persons"("PERSON_ID"),
        "CAREER_ID" INT REFERENCES "t_career"("CAREER_ID"),
        "STATUS" SMALLINT DEFAULT 1
      )
    `);
    await db.query(`
      CREATE TABLE "t_enrollment" (
        "ENROLLMENT_ID" SERIAL PRIMARY KEY,
        "STUDENT_ID" INT NOT NULL REFERENCES "t_students"("STUDENTS_ID"),
        "PERIOD_ID" INT,
        "CAREER_ID" INT REFERENCES "t_career"("CAREER_ID")
      )
    `);
    await db.query(`
      CREATE TABLE "t_institution" (
        "INSTITUTION_ID" SERIAL PRIMARY KEY,
        "INSTITUTION_NAME" VARCHAR(200) NOT NULL
      )
    `);
    await db.query(`
      CREATE TABLE "t_professional_practices" (
        "PROFESSIONAL_PRACTICES_ID" SERIAL PRIMARY KEY,
        "STUDENTS_ID" INT NOT NULL REFERENCES "t_students"("STUDENTS_ID"),
        "INSTITUTION_ID" INT REFERENCES "t_institution"("INSTITUTION_ID"),
        "CAREER_ID" INT REFERENCES "t_career"("CAREER_ID"),
        "INTERNSHIP_STATUS" INT DEFAULT 0
      )
    `);

    // Insertar datos de prueba usando columnas quoted
    await db.query(`INSERT INTO "t_persons" ("ci", "first_name", "last_name", "email") VALUES ('12345678', 'Juan', 'Pérez', 'juan@test.com')`);
    await db.query(`INSERT INTO "t_persons" ("ci", "first_name", "last_name", "email") VALUES ('87654321', 'María', 'González', 'maria@test.com')`);
    await db.query(`INSERT INTO "t_career" ("CAREER_NAME") VALUES ('Ingeniería Informática')`);
    await db.query(`INSERT INTO "t_career" ("CAREER_NAME") VALUES ('Administración')`);
    await db.query(`INSERT INTO "t_students" ("person_id", "CAREER_ID", "STATUS") VALUES (1, 1, 1)`);
    await db.query(`INSERT INTO "t_students" ("person_id", "CAREER_ID", "STATUS") VALUES (2, 2, 1)`);
    await db.query(`INSERT INTO "t_enrollment" ("STUDENT_ID", "PERIOD_ID", "CAREER_ID") VALUES (1, 1, 1)`);
    await db.query(`INSERT INTO "t_institution" ("INSTITUTION_NAME") VALUES ('Empresa XYZ')`);
    await db.query(`INSERT INTO "t_professional_practices" ("STUDENTS_ID", "INSTITUTION_ID", "CAREER_ID", "INTERNSHIP_STATUS") VALUES (1, 1, 1, 1)`);

    adapter = new PGliteAdapter(db);
  });

  afterAll(async () => {
    await db.close();
  });

  // ─── SELECT básicos ───

  it('SELECT * FROM t_persons', async () => {
    const result = await adapter.from('t_persons').select('*');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data![0]).toHaveProperty('ci');
  });

  it('SELECT with eq filter', async () => {
    const result = await adapter.from('t_students').select('*').eq('STUDENTS_ID', 1);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].STUDENTS_ID).toBe(1);
  });

  it('SELECT with multiple eq filters', async () => {
    const result = await adapter.from('t_students').select('*').eq('STATUS', 1).eq('STUDENTS_ID', 1);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it('SELECT with limit', async () => {
    const result = await adapter.from('t_persons').select('*').limit(1);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it('SELECT with order', async () => {
    const result = await adapter.from('t_persons').select('*').order('PERSON_ID', { ascending: false });
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data![0].PERSON_ID).toBe(2);
    expect(result.data![1].PERSON_ID).toBe(1);
  });

  // ─── .single() / .maybeSingle() ───

  it('.single() returns single object', async () => {
    const result = await adapter.from('t_students').select('*').eq('STUDENTS_ID', 1).single();
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.STUDENTS_ID).toBe(1);
  });

  it('.single() returns null when not found', async () => {
    const result = await adapter.from('t_students').select('*').eq('STUDENTS_ID', 999).single();
    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it('.single() returns error on multiple rows', async () => {
    const result = await adapter.from('t_persons').select('*').single();
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.status).toBe(406);
  });

  it('.maybeSingle() returns single object', async () => {
    const result = await adapter.from('t_students').select('*').eq('STUDENTS_ID', 1).maybeSingle();
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.STUDENTS_ID).toBe(1);
  });

  it('.maybeSingle() returns null when not found', async () => {
    const result = await adapter.from('t_students').select('*').eq('STUDENTS_ID', 999).maybeSingle();
    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  // ─── COUNT queries ───

  it('COUNT query with head:true, count:exact', async () => {
    const result = await adapter.from('t_students').select('*', { count: 'exact', head: true });
    expect(result.error).toBeNull();
    expect(result.count).toBe(2);
    expect(result.data).toBeNull();
  });

  it('COUNT query with filter', async () => {
    const result = await adapter.from('t_students').select('*', { count: 'exact', head: true }).eq('STATUS', 1);
    expect(result.error).toBeNull();
    expect(result.count).toBe(2);
  });

  // ─── JOINs ───

  it('LEFT JOIN t_persons from t_students', async () => {
    const result = await adapter.from('t_students').select('*, t_persons(ci, first_name, last_name)');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);

    // Verificar que las columnas del join lleguen con alias
    const row = result.data![0];
    expect(row).toHaveProperty('STUDENTS_ID');
    expect(row).toHaveProperty('t_persons_ci', '12345678');
    expect(row).toHaveProperty('t_persons_first_name', 'Juan');
    expect(row).toHaveProperty('t_persons_last_name', 'Pérez');
  });

  it('INNER JOIN t_persons!inner from t_students', async () => {
    const result = await adapter.from('t_students').select('*, t_persons!inner(ci, first_name)');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data![0]).toHaveProperty('t_persons_ci');
  });

  it('multiple joins: t_career + t_persons from t_students', async () => {
    const result = await adapter.from('t_students').select('STUDENTS_ID, t_career(CAREER_NAME), t_persons!inner(ci, first_name)');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);

    const row = result.data![0];
    expect(row.STUDENTS_ID).toBe(1);
    expect(row).toHaveProperty('t_career_CAREER_NAME', 'Ingeniería Informática');
    expect(row).toHaveProperty('t_persons_first_name', 'Juan');
  });

  it('enrollment with nested joins', async () => {
    const result = await adapter.from('t_enrollment').select('*, t_career(CAREER_NAME)');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0]).toHaveProperty('t_career_CAREER_NAME', 'Ingeniería Informática');
  });

  it('professional_practices with institution join via alias', async () => {
    const result = await adapter.from('t_professional_practices').select('*, institution:INSTITUTION_ID(INSTITUTION_NAME)');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0]).toHaveProperty('institution_INSTITUTION_NAME', 'Empresa XYZ');
  });

  // ─── .or() filter ───

  it('.or() with two conditions', async () => {
    // Filtrar personas cuyo nombre sea Juan o María
    const result = await adapter.from('t_persons').select('*').or("first_name.eq.Juan,first_name.eq.María");
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
  });

  it('.or() combined with .eq()', async () => {
    // STUDENTS_ID=1 AND (STATUS=1 OR STATUS=0)
    const result = await adapter.from('t_students').select('*').eq('STUDENTS_ID', 1).or('STATUS.eq.1,STATUS.eq.0');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  // ─── INSERT ───

  it('INSERT with RETURNING', async () => {
    const result = await adapter.from('t_persons').insert({
      ci: '11111111',
      first_name: 'Nuevo',
      last_name: 'Usuario',
      email: 'nuevo@test.com',
    }).select('*');
    // Supabase: insert().select() devuelve array con una fila
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(1);
    const row = result.data![0];
    expect(row.ci).toBe('11111111');

    // Cleanup
    if (row?.PERSON_ID != null) {
      await db.query(`DELETE FROM "t_persons" WHERE "PERSON_ID" = ${row.PERSON_ID}`);
    }
  });

  it('INSERT via array wrapper [data]', async () => {
    const result = await adapter.from('t_career').insert([{
      CAREER_NAME: 'Nueva Carrera Test',
    }]).select('*');
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data![0].CAREER_NAME).toBe('Nueva Carrera Test');

    // Cleanup
    const pk = result.data![0].CAREER_ID;
    await db.query(`DELETE FROM "t_career" WHERE "CAREER_ID" = ${pk}`);
  });

  // ─── UPDATE ───

  it('UPDATE with eq filter', async () => {
    // Insert a row to update (usar quoting para que coincida con el schema)
    const insertResult = await db.query(`INSERT INTO "t_career" ("CAREER_NAME") VALUES ('Carrera Update Test') RETURNING "CAREER_ID"`);
    const insertPk = insertResult.rows[0]?.CAREER_ID;

    const result = await adapter.from('t_career').update({ CAREER_NAME: 'Carrera Actualizada' }).eq('CAREER_NAME', 'Carrera Update Test').select('*');
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data![0].CAREER_NAME).toBe('Carrera Actualizada');

    // Cleanup
    if (insertPk) await db.query(`DELETE FROM "t_career" WHERE "CAREER_ID" = ${insertPk}`);
  });

  // ─── DELETE ───

  it('DELETE with eq filter', async () => {
    // Insert a row to delete (usar quoting)
    const insertResult = await db.query(`INSERT INTO "t_career" ("CAREER_NAME") VALUES ('Carrera Delete Test') RETURNING "CAREER_ID"`);
    const insertPk = insertResult.rows[0]?.CAREER_ID;

    const result = await adapter.from('t_career').delete().eq('CAREER_NAME', 'Carrera Delete Test').select('*');
    expect(result.error).toBeNull();

    // Verify it's gone
    if (insertPk) {
      const check = await db.query(`SELECT * FROM "t_career" WHERE "CAREER_ID" = ${insertPk}`);
      expect(check.rows).toHaveLength(0);
    }
  });

  // ─── is null / not null ───

  it('IS NULL filter', async () => {
    // Insert one with null (usar quoting)
    await db.query(`INSERT INTO "t_enrollment" ("STUDENT_ID", "PERIOD_ID", "CAREER_ID") VALUES (2, NULL, 2)`);

    const result = await adapter.from('t_enrollment').select('*').is('PERIOD_ID', null);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].STUDENT_ID).toBe(2);

    // Cleanup
    await db.query(`DELETE FROM "t_enrollment" WHERE "STUDENT_ID" = 2 AND "PERIOD_ID" IS NULL`);
  });

  it('IS NOT NULL filter via .not(column, is, null)', async () => {
    const result = await adapter.from('t_enrollment').select('*').not('PERIOD_ID', 'is', null);
    expect(result.error).toBeNull();
    // The original enrollment has PERIOD_ID=1
    expect(result.data!.length).toBeGreaterThanOrEqual(1);
    for (const row of result.data!) {
      expect(row.PERIOD_ID).not.toBeNull();
    }
  });

  // ─── .neq() filter ───

  it('.neq() returns rows not matching value', async () => {
    const result = await adapter.from('t_career').select('*').neq('CAREER_NAME', 'Ingeniería Informática');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].CAREER_NAME).toBe('Administración');
  });

  it('.neq() combined with .eq()', async () => {
    // El test de visitas (visits.controller.ts:277) hace
    // .eq('PROFESSIONAL_PRACTICE_ID', practiceId).eq('STATUS', 1).neq('VISIT_ID', excludeVisitId)
    const result = await adapter.from('t_students').select('*').eq('STATUS', 1).neq('STUDENTS_ID', 1);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].STUDENTS_ID).toBe(2);
  });

  // ─── .gte(), .lte() filters ───

  it('.gte() filter returns rows >= value', async () => {
    const result = await adapter.from('t_persons').select('*').gte('PERSON_ID', 2);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].PERSON_ID).toBe(2);
  });

  it('.lte() filter returns rows <= value', async () => {
    const result = await adapter.from('t_persons').select('*').lte('PERSON_ID', 1);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].PERSON_ID).toBe(1);
  });

  it('.gte() + .lte() range filter (like dashboard.controller)', async () => {
    const result = await adapter.from('t_persons').select('*').gte('PERSON_ID', 1).lte('PERSON_ID', 2);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
  });

  // ─── .range() pagination ───

  it('.range(0, 0) returns first row (offset=0, limit=1)', async () => {
    const result = await adapter.from('t_persons').select('*').range(0, 0).order('PERSON_ID', { ascending: true });
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].PERSON_ID).toBe(1);
  });

  it('.range(1, 1) returns second row (offset=1, limit=1)', async () => {
    const result = await adapter.from('t_persons').select('*').range(1, 1).order('PERSON_ID', { ascending: true });
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].PERSON_ID).toBe(2);
  });

  it('.range() combined with .eq() filter (like students.controller pattern)', async () => {
    const result = await adapter.from('t_students').select('*').eq('STATUS', 1).range(0, 0).order('STUDENTS_ID', { ascending: true });
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].STUDENTS_ID).toBe(1);
  });

  it('.range() returns full range', async () => {
    const result = await adapter.from('t_persons').select('*').range(0, 1).order('PERSON_ID', { ascending: true });
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
  });

  // ─── Complexity: Alias joins (tracking.controller pattern) ───

  it('alias join: t_career:CAREER_ID(*)', async () => {
    // Este es el patrón exacto de tracking.controller.ts:
    // t_career:CAREER_ID(CAREER_ID, CAREER_NAME)
    const result = await adapter.from('t_students').select('*, career:CAREER_ID(CAREER_NAME)');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data![0]).toHaveProperty('career_CAREER_NAME', 'Ingeniería Informática');
    expect(result.data![1]).toHaveProperty('career_CAREER_NAME', 'Administración');
  });

  it('alias join + INNER join combined (like tracking.controller pattern)', async () => {
    // Patrón similar a tracking.controller.ts:362-397 pero con t_students
    // que SÍ tiene FK directa a t_persons
    // t_persons!inner + t_career:CAREER_ID
    const result = await adapter.from('t_students').select(`
      STUDENTS_ID, STATUS,
      t_persons!inner(ci, first_name, last_name),
      career:CAREER_ID(CAREER_NAME)
    `).eq('STUDENTS_ID', 1).single();

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data).toHaveProperty('t_persons_ci', '12345678');
    expect(result.data).toHaveProperty('t_persons_first_name', 'Juan');
    expect(result.data).toHaveProperty('t_persons_last_name', 'Pérez');
    expect(result.data).toHaveProperty('career_CAREER_NAME', 'Ingeniería Informática');
    expect(result.data.STUDENTS_ID).toBe(1);
  });

  // ─── .not(, 'in', ...) filter ───

  it('.not(column, in, values) excludes rows (students.controller pattern)', async () => {
    // students.controller.ts:238-240: .not('STUDENTS_ID', 'in', '(1)')
    const result = await adapter.from('t_students').select('*').not('STUDENTS_ID', 'in', '(1)');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].STUDENTS_ID).toBe(2);
  });

  it('.not(in) with multiple values', async () => {
    const result = await adapter.from('t_students').select('*').not('STUDENTS_ID', 'in', '(1,2)');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(0);
  });
});
