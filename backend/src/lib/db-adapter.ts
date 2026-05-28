// ================================================================================
// DatabaseAdapter Interface
// ================================================================================
// Interfaz abstracta que imita los métodos de Supabase SDK que realmente se usan
// en los controllers. Permite intercambiar entre Supabase Cloud y PGlite local
// sin modificar los controllers.
// ================================================================================

export interface QueryResponse<T = any> {
  data: T | null;
  error: any | null;
  count?: number | null;
  status?: number;
  statusText?: string;
}

export interface FilterQueryBuilder {
  eq(column: string, value: any): this;
  neq(column: string, value: any): this;
  in(column: string, values: any[]): this;
  is(column: string, value: any): this;
  not(column: string, operator: string, value: any): this;
  gt(column: string, value: any): this;
  gte(column: string, value: any): this;
  lt(column: string, value: any): this;
  lte(column: string, value: any): this;
  like(column: string, pattern: string): this;
  ilike(column: string, pattern: string): this;
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string }): this;
  limit(count: number, options?: { foreignTable?: string }): this;
  single(): this;
  maybeSingle(): this;
  or(filters: string, options?: { foreignTable?: string }): this;
  returns(type: 'minimal' | 'representation'): this;
  textSearch(column: string, query: string, options?: { type?: string; config?: string }): this;
  then<TResult1 = QueryResponse, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
}

export interface InsertQueryBuilder {
  select(columns?: string): this;
  single(): this;
  returns(type: 'minimal' | 'representation'): this;
  then<TResult1 = QueryResponse, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
}

export interface UpdateQueryBuilder {
  eq(column: string, value: any): this;
  in(column: string, values: any[]): this;
  select(columns?: string): this;
  single(): this;
  returns(type: 'minimal' | 'representation'): this;
  then<TResult1 = QueryResponse, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
}

export interface DatabaseAdapter {
  from(table: string): {
    select(columns: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): FilterQueryBuilder;
    insert(values: any, options?: { defaultToNull?: boolean }): InsertQueryBuilder;
    update(values: any, options?: { defaultToNull?: boolean }): UpdateQueryBuilder;
    delete(options?: { returning?: 'minimal' | 'representation' }): FilterQueryBuilder;
    upsert(values: any, options?: { onConflict?: string; ignoreDuplicates?: boolean; defaultToNull?: boolean }): InsertQueryBuilder;
  };
  rpc(fn: string, params?: any): Promise<QueryResponse>;
  auth?: any;
  storage?: any;
}

/**
 * Tipo unificado que representa cualquier conexión a base de datos.
 * Los controllers solo usan .from() y .rpc(), así que este tipo
 * cubre tanto SupabaseClient como DatabaseAdapter.
 */
export type DbConnection = Pick<DatabaseAdapter, 'from' | 'rpc'> & {
  auth?: any;
  storage?: any;
  // Métodos adicionales de SupabaseClient que algunos controllers podrían usar
  channel?: any;
  realtime?: any;
};
