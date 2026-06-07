/**
 * Knowledge Base Service — CRUD + búsqueda semántica en t_knowledge_base
 *
 * Provee:
 * - CRUD completo de entries en la base de conocimiento
 * - Búsqueda semántica por embeddings (pgvector cosine similarity)
 * - Búsqueda textual como fallback
 * - Filtrado por rol de usuario y categoría
 */

import { supabase } from '../lib/supabase.js';
import { generateEmbedding, getEmbeddingDimension } from './embedding.service.js';

// ============================================
// Types
// ============================================

export interface KBEntry {
  id: string;
  title: string;
  category: 'regulation' | 'curriculum' | 'process' | 'faq' | 'general';
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  roles: number[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateKBEntry {
  title: string;
  category: KBEntry['category'];
  content: string;
  metadata?: Record<string, any>;
  roles?: number[] | null;
}

export interface UpdateKBEntry {
  title?: string;
  category?: KBEntry['category'];
  content?: string;
  metadata?: Record<string, any>;
  roles?: number[] | null;
}

export interface KBFilter {
  category?: string;
  search?: string;
  roles?: number[] | null;
  page?: number;
  limit?: number;
  active_only?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  category: KBEntry['category'];
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// Constants
// ============================================

const SEARCH_THRESHOLD = 0.7; // Similitud mínima para considerar un resultado relevante
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const VALID_CATEGORIES = ['regulation', 'curriculum', 'process', 'faq', 'general'];

// ============================================
// Helper Functions
// ============================================

function validateCategory(category: string): category is KBEntry['category'] {
  return VALID_CATEGORIES.includes(category);
}

function mapKBEntry(data: any): KBEntry {
  return {
    id: data.id,
    title: data.title,
    category: data.category,
    content: data.content,
    embedding: data.embedding,
    metadata: data.metadata || {},
    roles: data.roles || null,
    is_active: data.is_active ?? true,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Crea una nueva entrada en la base de conocimiento.
 * Genera embedding automáticamente si hay API key configurada.
 */
export async function create(entry: CreateKBEntry): Promise<KBEntry> {
  // Generar embedding
  const embedResult = await generateEmbedding(entry.content);
  const embedding = embedResult.success ? embedResult.embedding : null;

  const { data, error } = await supabase
    .from('t_knowledge_base')
    .insert({
      title: entry.title,
      category: entry.category,
      content: entry.content,
      embedding: embedding ? `[${embedding.join(',')}]` : null,
      metadata: entry.metadata || {},
      roles: entry.roles || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[KB Service] Error creating entry:', error.message);
    throw new Error(`Error al crear entry en KB: ${error.message}`);
  }

  console.log(`[KB Service] Created entry: ${data.id} — ${entry.title}`);
  return mapKBEntry(data);
}

/**
 * Actualiza una entrada existente.
 * Regenera embedding si cambió el contenido.
 */
export async function update(id: string, entry: UpdateKBEntry): Promise<KBEntry> {
  const updateData: Record<string, any> = {};

  if (entry.title !== undefined) updateData.title = entry.title;
  if (entry.category !== undefined) updateData.category = entry.category;
  if (entry.metadata !== undefined) updateData.metadata = entry.metadata;
  if (entry.roles !== undefined) updateData.roles = entry.roles;

  // Si cambió el contenido, regenerar embedding
  if (entry.content !== undefined) {
    updateData.content = entry.content;
    const embedResult = await generateEmbedding(entry.content);
    if (embedResult.success) {
      updateData.embedding = `[${embedResult.embedding.join(',')}]`;
    }
  }

  const { data, error } = await supabase
    .from('t_knowledge_base')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[KB Service] Error updating entry:', error.message);
    throw new Error(`Error al actualizar entry en KB: ${error.message}`);
  }

  console.log(`[KB Service] Updated entry: ${id}`);
  return mapKBEntry(data);
}

/**
 * Desactiva una entrada (soft delete).
 */
export async function softDelete(id: string): Promise<void> {
  const { error } = await supabase
    .from('t_knowledge_base')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('[KB Service] Error deleting entry:', error.message);
    throw new Error(`Error al eliminar entry en KB: ${error.message}`);
  }

  console.log(`[KB Service] Soft-deleted entry: ${id}`);
}

/**
 * Obtiene una entrada por ID.
 */
export async function getById(id: string): Promise<KBEntry | null> {
  const { data, error } = await supabase
    .from('t_knowledge_base')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[KB Service] Error getting entry:', error.message);
    throw new Error(`Error al obtener entry de KB: ${error.message}`);
  }

  return mapKBEntry(data);
}

/**
 * Lista entries con filtros.
 */
export async function list(filters: KBFilter = {}): Promise<PaginatedResult<KBEntry>> {
  const {
    category,
    search,
    roles,
    page = 1,
    limit = DEFAULT_LIMIT,
    active_only = true,
  } = filters;

  const safeLimit = Math.min(limit, MAX_LIMIT);
  const offset = (page - 1) * safeLimit;

  let query = supabase.from('t_knowledge_base').select('*', { count: 'exact' });

  // Filtros
  if (active_only) {
    query = query.eq('is_active', true);
  }

  if (category && validateCategory(category)) {
    query = query.eq('category', category);
  }

  // Filtro por rol: si el usuario tiene roles específicos
  if (roles && roles.length > 0) {
    query = query.or(`roles.is.null,roles.cs.{${roles.join(',')}}`);
  }

  // Búsqueda textual
  if (search) {
    query = query.ilike('content', `%${search}%`);
  }

  // Ordenar y paginar
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + safeLimit - 1);

  if (error) {
    console.error('[KB Service] Error listing entries:', error.message);
    throw new Error(`Error al listar entries de KB: ${error.message}`);
  }

  return {
    items: (data || []).map(mapKBEntry),
    total: count || 0,
    page,
    limit: safeLimit,
  };
}

// ============================================
// Semantic Search
// ============================================

/**
 * Búsqueda semántica por similitud coseno.
 * Genera embedding de la query y busca los chunks más similares en la BD.
 *
 * Usa el operador <=> (cosine distance) de pgvector.
 * La similitud = 1 - cosine_distance.
 */
export async function searchSemantic(params: {
  query: string;
  userRoles?: number[] | null;
  category?: string;
  limit?: number;
  threshold?: number;
}): Promise<SearchResult[]> {
  const {
    query,
    userRoles,
    category,
    limit = 5,
    threshold = SEARCH_THRESHOLD,
  } = params;

  // Generar embedding de la query
  const embedResult = await generateEmbedding(query);

  if (!embedResult.success) {
    console.warn('[KB Service] Embedding failed, falling back to text search');
    return searchText({ query, userRoles, category, limit });
  }

  const queryEmbedding = embedResult.embedding;

  // Construir consulta de similitud coseno
  // pgvector no puede recibir embedding como parámetro directo en Supabase JS
  // Usamos raw SQL para la búsqueda semántica
  const { data, error } = await supabase.rpc('search_knowledge_base', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_threshold: threshold,
    match_limit: limit,
    filter_category: category || null,
    filter_roles: userRoles || null,
  });

  if (error) {
    console.error('[KB Service] Semantic search error:', error.message);

    // Fallback a búsqueda textual
    console.warn('[KB Service] Falling back to text search');
    return searchText({ query, userRoles, category, limit });
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    metadata: row.metadata || {},
    similarity: row.similarity || 0,
  }));
}

/**
 * Búsqueda textual como fallback (ILIKE).
 */
export async function searchText(params: {
  query: string;
  userRoles?: number[] | null;
  category?: string;
  limit?: number;
}): Promise<SearchResult[]> {
  const { query, userRoles, category, limit = 5 } = params;

  let dbQuery = supabase
    .from('t_knowledge_base')
    .select('*')
    .eq('is_active', true)
    .ilike('content', `%${query}%`);

  if (category && validateCategory(category)) {
    dbQuery = dbQuery.eq('category', category);
  }

  if (userRoles && userRoles.length > 0) {
    dbQuery = dbQuery.or(`roles.is.null,roles.cs.{${userRoles.join(',')}}`);
  }

  const { data, error } = await dbQuery.limit(limit);

  if (error) {
    console.error('[KB Service] Text search error:', error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    metadata: row.metadata || {},
    similarity: 1.0,
  }));
}

/**
 * Formatea chunks de KB como contexto para inyectar en el system prompt.
 */
export function formatKBContext(chunks: SearchResult[]): string {
  if (chunks.length === 0) return '';

  const parts = chunks.map(
    (chunk, i) =>
      `[${i + 1}] ${chunk.title} (${chunk.category}, relevancia: ${(chunk.similarity * 100).toFixed(0)}%)\n${chunk.content.substring(0, 1000)}`
  );

  return `\n### INFORMACIÓN DE LA BASE DE CONOCIMIENTO:\n${parts.join('\n\n')}\n`;
}

export default {
  create,
  update,
  softDelete,
  getById,
  list,
  searchSemantic,
  searchText,
  formatKBContext,
};
