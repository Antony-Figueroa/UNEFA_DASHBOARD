// ===============================================================================
// Sync Service — UNEFA Dashboard Desktop
// ===============================================================================
// Sincroniza datos desde Supabase Cloud → PGlite Local.
// Usa orden topológico basado en FOREIGN KEYs para respetar dependencias.
//
// USO:
//   const syncer = new SyncService(supabaseClient, pgliteInstance, schemaPath);
//   const result = await syncer.syncAll();
// ===============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

// Tablas locales que NO existen en Supabase
const TABLES_TO_SKIP = new Set(['_sync_log']);

export interface SyncTableResult {
  table: string;
  rows: number;
  status: 'synced' | 'empty' | 'skipped' | 'failed';
  error?: string;
}

export interface SyncResult {
  total: number;
  synced: number;
  empty: number;
  skipped: number;
  failed: SyncTableResult[];
  durationMs: number;
}

export class SyncService {
  private supabase: SupabaseClient;
  private pglite: PGlite;
  private schemaFile: string;

  constructor(supabase: SupabaseClient, pglite: PGlite, schemaFile: string) {
    this.supabase = supabase;
    this.pglite = pglite;
    this.schemaFile = schemaFile;
  }

  // ─── API Pública ───

  /**
   * Sincroniza TODAS las tablas desde Supabase → PGlite.
   * Respeta el orden de dependencias por FOREIGN KEYs.
   */
  async syncAll(): Promise<SyncResult> {
    const startTime = Date.now();
    const fullSql = fs.readFileSync(this.schemaFile, 'utf-8');
    const tableOrder = this.buildTableOrder(fullSql);

    console.log(`[Sync] 📋 Orden de sync: ${tableOrder.join(' → ')}`);

    const results: SyncTableResult[] = [];

    for (const tableName of tableOrder) {
      if (TABLES_TO_SKIP.has(tableName)) {
        results.push({ table: tableName, rows: 0, status: 'skipped' });
        continue;
      }

      try {
        const rows = await this.syncTable(tableName);
        if (rows > 0) {
          results.push({ table: tableName, rows, status: 'synced' });
          console.log(`[Sync] ✅ ${tableName}: ${rows} registros`);
        } else {
          results.push({ table: tableName, rows: 0, status: 'empty' });
          console.log(`[Sync] ➖ ${tableName}: vacía`);
        }
      } catch (err: any) {
        const msg = err.message || String(err);
        results.push({ table: tableName, rows: 0, status: 'failed', error: msg.slice(0, 200) });
        console.warn(`[Sync] ⚠️ ${tableName}: ${msg.slice(0, 120)}`);
      }
    }

    const duration = Date.now() - startTime;

    const final: SyncResult = {
      total: tableOrder.length,
      synced: results.filter(r => r.status === 'synced').length,
      empty: results.filter(r => r.status === 'empty').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      failed: results.filter(r => r.status === 'failed'),
      durationMs: duration,
    };

    console.log(`\n[Sync] ─── RESUMEN ───`);
    console.log(`[Sync] ✅ ${final.synced} tablas sincronizadas`);
    console.log(`[Sync] ➖ ${final.empty} tablas vacías`);
    console.log(`[Sync] ⏭️  ${final.skipped} tablas omitidas`);
    if (final.failed.length > 0) {
      console.warn(`[Sync] ❌ ${final.failed.length} tablas con errores:`);
      for (const f of final.failed) {
        console.warn(`[Sync]    • ${f.table}: ${f.error}`);
      }
    }
    console.log(`[Sync] ⏱️  ${duration}ms\n`);

    return final;
  }

  // ─── Orden topológico ───

  /**
   * Construye el orden de inserción respetando FKs.
   * Usa el algoritmo de Kahn (topological sort).
   * Las tablas sin dependencias van primero.
   */
  private buildTableOrder(sql: string): string[] {
    // 1. Extraer nombres de tabla
    const tablePattern = /CREATE TABLE IF NOT EXISTS "(\w+)"/g;
    const tables: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = tablePattern.exec(sql)) !== null) {
      tables.push(match[1]);
    }

    // 2. Construir grafo de dependencias: child → parent[]
    const deps = new Map<string, Set<string>>();
    for (const t of tables) deps.set(t, new Set());

    // 3. Parsear ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... REFERENCES ...
    const fkPattern = /ALTER TABLE "(\w+)".*?FOREIGN KEY.*?REFERENCES "(\w+)"/g;
    while ((match = fkPattern.exec(sql)) !== null) {
      const child = match[1];
      const parent = match[2];
      if (deps.has(child) && deps.has(parent)) {
        deps.get(child)!.add(parent);
      }
    }

    // 4. Kahn's algorithm
    const inDegree = new Map<string, number>();
    for (const t of tables) inDegree.set(t, 0);
    for (const [, parents] of deps) {
      for (const p of parents) {
        inDegree.set(p, (inDegree.get(p) || 0));
      }
    }
    for (const [child, parents] of deps) {
      inDegree.set(child, parents.size);
    }

    const queue: string[] = [];
    for (const t of tables) {
      if ((inDegree.get(t) || 0) === 0) queue.push(t);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      // Estable: mismo orden relativo del SQL para tablas del mismo nivel
      queue.sort((a, b) => tables.indexOf(a) - tables.indexOf(b));
      const node = queue.shift()!;
      sorted.push(node);

      for (const [child, parents] of deps) {
        if (parents.has(node)) {
          parents.delete(node);
          const newDeg = (inDegree.get(child) || 1) - 1;
          inDegree.set(child, newDeg);
          if (newDeg === 0) queue.push(child);
        }
      }
    }

    // 5. Detectar ciclos — agregar lo que falte al final
    if (sorted.length < tables.length) {
      const missing = tables.filter(t => !sorted.includes(t));
      console.warn(`[Sync] ⚠️ Ciclo detectado en: ${missing.join(', ')}. Se agregan al final.`);
      sorted.push(...missing);
    }

    return sorted;
  }

  // ─── Sincronizar una tabla ───

  /**
   * Sincroniza UNA tabla: SELECT * desde Supabase → INSERT en PGlite.
   * Usa paginación de a 1000 filas y batches de 100 INSERTs.
   */
  private async syncTable(tableName: string): Promise<number> {
    // 1. Obtener columnas desde Supabase
    const supabaseCols = await this.getColumns(tableName);

    if (supabaseCols.length === 0) {
      const { count, error } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    }

    // 2. Obtener columnas LOCALES de PGlite (para evitar sync de columnas que no existen localmente)
    const localCols = await this.getLocalColumns(tableName);

    // 3. Intersectar: solo columnas que existen AMBOS lados
    const localColSet = new Set(localCols.map(c => c.toLowerCase()));
    const columns = supabaseCols.filter(c => localColSet.has(c.toLowerCase()));

    if (columns.length === 0) {
      console.warn(`[Sync] ⚠️ ${tableName}: 0 columnas en común con schema local, saltando`);
      return 0;
    }

    const quotedColumns = columns.map((c: string) => `"${c}"`).join(', ');

    // 4. Limpiar datos locales antes de insertar (evita duplicados en re-sync)
    //    No usamos TRUNCATE porque puede fallar con FK constraints. DELETE respeta FKs.
    try {
      await this.pglite.query(`DELETE FROM "${tableName}"`);
    } catch {
      // Si falla el DELETE, continuamos de todas formas (tabla puede no existir aún)
    }

    // 5. Paginar desde Supabase
    const PAGE_SIZE = 1000;
    let offset = 0;
    let totalRows = 0;

    while (true) {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      // 5. Filtrar datos: solo columnas locales
      const filteredData = data.map(row => {
        const filtered: any = {};
        for (const col of columns) {
          filtered[col] = row[col] === undefined ? null : row[col];
        }
        return filtered;
      });

      // 6. Insertar en PGlite en batches
      await this.insertBatch(tableName, quotedColumns, columns, filteredData);

      totalRows += data.length;
      offset += data.length;

      if (data.length < PAGE_SIZE) break;
    }

    return totalRows;
  }

  /**
   * Obtiene las columnas de una tabla local en PGlite desde information_schema.
   */
  private async getLocalColumns(tableName: string): Promise<string[]> {
    try {
      const result = await this.pglite.query(
        'SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = \'public\' ORDER BY ordinal_position',
        [tableName]
      );
      return result.rows.map((r: any) => r.column_name);
    } catch {
      return [];
    }
  }

  /**
   * Obtiene los nombres de columnas de una tabla.
   * Primero intenta con un head request; si falla, usa la primera fila.
   */
  private async getColumns(tableName: string): Promise<string[]> {
    // Intentar con head=true para no traer datos
    const { data, error } = await this.supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) throw error;
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }

    return [];
  }

  /**
   * Inserta un lote de filas en PGlite usando parámetros $1, $2, ...
   */
  private async insertBatch(
    tableName: string,
    quotedColumns: string,
    columns: string[],
    rows: any[]
  ): Promise<void> {
    const BATCH_SIZE = 100;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const valuesList: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      for (const row of batch) {
        const placeholders = columns.map(() => `$${paramIdx++}`).join(', ');
        valuesList.push(`(${placeholders})`);
        for (const col of columns) {
          const val = row[col];
          params.push(val === undefined ? null : val);
        }
      }

      const sql = `INSERT INTO "${tableName}" (${quotedColumns}) VALUES ${valuesList.join(', ')}`;

      try {
        await this.pglite.query(sql, params);
      } catch (insertErr: any) {
        // Si falla un batch, reintentar fila por fila para aislar el problema
        console.warn(`[Sync] ⚠️ Batch insert falló en ${tableName}, reintentando fila por fila...`);
        for (const row of batch) {
          try {
            const singleParams = columns.map(col => row[col] ?? null);
            const singlePlaceholders = columns.map((_, j) => `$${j + 1}`).join(', ');
            await this.pglite.query(
              `INSERT INTO "${tableName}" (${quotedColumns}) VALUES (${singlePlaceholders})`,
              singleParams
            );
          } catch (singleErr: any) {
            // Loggear pero no detener — algunos duplicados pueden existir
            console.warn(`[Sync] ⚠️   Fila omitida en ${tableName}: ${singleErr.message?.slice(0, 100)}`);
          }
        }
      }
    }
  }
}
