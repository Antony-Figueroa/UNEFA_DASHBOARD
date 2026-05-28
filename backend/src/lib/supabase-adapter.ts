// ================================================================================
// SupabaseAdapter
// ================================================================================
// Wrapper around the real Supabase SDK that implements the DatabaseAdapter
// interface. This lets the rest of the code use a uniform interface regardless
// of whether it's connected to Supabase Cloud or PGlite local.
// ================================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseAdapter, QueryResponse, FilterQueryBuilder, InsertQueryBuilder, UpdateQueryBuilder } from './db-adapter.js';

class SupabaseFilterWrapper implements FilterQueryBuilder, InsertQueryBuilder, UpdateQueryBuilder {
  constructor(private builder: any) {}

  // ─── Select (para cadenas insert/update) ───
  select(columns?: string): this {
    if (columns) {
      this.builder = this.builder.select(columns);
    }
    return this;
  }

  eq(column: string, value: any) {
    this.builder = (this.builder as any).eq(column, value);
    return this;
  }

  neq(column: string, value: any) {
    this.builder = (this.builder as any).neq(column, value);
    return this;
  }

  in(column: string, values: any[]) {
    this.builder = (this.builder as any).in(column, values);
    return this;
  }

  is(column: string, value: any) {
    this.builder = (this.builder as any).is(column, value);
    return this;
  }

  not(column: string, operator: string, value: any) {
    this.builder = (this.builder as any).not(column, operator, value);
    return this;
  }

  gt(column: string, value: any) {
    this.builder = (this.builder as any).gt(column, value);
    return this;
  }

  gte(column: string, value: any) {
    this.builder = (this.builder as any).gte(column, value);
    return this;
  }

  lt(column: string, value: any) {
    this.builder = (this.builder as any).lt(column, value);
    return this;
  }

  lte(column: string, value: any) {
    this.builder = (this.builder as any).lte(column, value);
    return this;
  }

  like(column: string, pattern: string) {
    this.builder = (this.builder as any).like(column, pattern);
    return this;
  }

  ilike(column: string, pattern: string) {
    this.builder = (this.builder as any).ilike(column, pattern);
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string }) {
    this.builder = (this.builder as any).order(column, options);
    return this;
  }

  limit(count: number, options?: { foreignTable?: string }) {
    this.builder = (this.builder as any).limit(count, options);
    return this;
  }

  single() {
    this.builder = (this.builder as any).single();
    return this;
  }

  maybeSingle() {
    this.builder = (this.builder as any).maybeSingle();
    return this;
  }

  or(filters: string, options?: { foreignTable?: string }) {
    this.builder = (this.builder as any).or(filters, options);
    return this;
  }

  returns(type: 'minimal' | 'representation') {
    this.builder = (this.builder as any).returns(type);
    return this;
  }

  textSearch(column: string, query: string, options?: { type?: string; config?: string }) {
    this.builder = (this.builder as any).textSearch(column, query, options);
    return this;
  }

  then<TResult1 = QueryResponse, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return (this.builder as any).then(
      (result: any) => {
        const response: QueryResponse = {
          data: result.data ?? null,
          error: result.error ?? null,
          count: result.count ?? null,
          status: result.status,
          statusText: result.statusText,
        };
        return onfulfilled ? onfulfilled(response) : response as any;
      },
      onrejected
    );
  }
}

export class SupabaseAdapter implements DatabaseAdapter {
  constructor(private client: SupabaseClient) {}

  from(table: string) {
    const queryBuilder = this.client.from(table);

    return {
      select: (columns: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => {
        const builder = queryBuilder.select(columns, options as any);
        return new SupabaseFilterWrapper(builder as any);
      },
      insert: (values: any, options?: { defaultToNull?: boolean }) => {
        const builder = queryBuilder.insert(values, options as any);
        return new SupabaseFilterWrapper(builder as any);
      },
      update: (values: any, options?: { defaultToNull?: boolean }) => {
        const builder = queryBuilder.update(values, options as any);
        return new SupabaseFilterWrapper(builder as any);
      },
      delete: (options?: { returning?: 'minimal' | 'representation' }) => {
        const builder = queryBuilder.delete(options as any);
        return new SupabaseFilterWrapper(builder as any);
      },
      upsert: (values: any, options?: { onConflict?: string; ignoreDuplicates?: boolean; defaultToNull?: boolean }) => {
        const builder = queryBuilder.upsert(values, options as any);
        return new SupabaseFilterWrapper(builder as any);
      },
    };
  }

  async rpc(fn: string, params?: any): Promise<QueryResponse> {
    const { data, error } = await (this.client as any).rpc(fn, params);
    return { data, error };
  }

  get auth() { return this.client.auth; }
  get storage() { return this.client.storage; }
}
