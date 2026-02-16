import { supabase } from '../lib/supabase.js';
import { cacheManager } from '../lib/cache-manager.js';
import { z } from 'zod';

// Define allowed entities and fields to prevent unauthorized access to sensitive tables
const ALLOWED_ENTITIES = {
  students: 't_students',
  careers: 't_career',
  periods: 't_internships_period',
  institutions: 't_institution',
  tutors: 't_tutors',
  managers: 't_institution_manager',
  internships: 't_professional_practices',
  users: 't_user'
};

// Schema for the query request
export const AIQuerySchema = z.object({
  entity: z.enum(Object.keys(ALLOWED_ENTITIES) as [string, ...string[]]),
  select: z.array(z.string()).optional().default(['*']),
  filters: z.record(z.string(), z.any()).optional(),
  limit: z.number().min(1).max(100).optional().default(10),
  page: z.number().min(1).optional().default(1),
  orderBy: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']).default('asc')
  }).optional()
});

export type AIQuery = z.infer<typeof AIQuerySchema>;

// Define the structure for the query result
export interface QueryResult<T> {
  data: T[] | null;
  meta: {
    total: number | null;
    page: number;
    limit: number;
  };
}

// Internal audit function
const logAudit = (requesterId: string | number, query: AIQuery, status: string, details?: string) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    requesterId,
    entity: query.entity,
    query: JSON.stringify(query),
    status,
    details
  };
  
  // In a real production system, this would go to a dedicated 'audit_logs' table or a logging service (ELK, Datadog)
  console.log(`[AI_AUDIT] ${JSON.stringify(logEntry)}`);
};

// Main execution function
const executeQuery = async <T>(query: AIQuery, requesterId: string | number): Promise<QueryResult<T>> => {
  const cacheKey = `ai_query:${JSON.stringify(query)}`;
  const cachedResult = cacheManager.get(cacheKey) as QueryResult<T> | undefined;

  if (cachedResult) {
    logAudit(requesterId, query, 'CACHE_HIT');
    return cachedResult;
  }

  const tableName = ALLOWED_ENTITIES[query.entity as keyof typeof ALLOWED_ENTITIES];
  
  // Build the query
  let dbQuery = supabase
    .from(tableName)
    .select(query.select.join(','), { count: 'exact' });

  // Apply filters
  if (query.filters) {
    Object.entries(query.filters).forEach(([key, value]) => {
      // Basic equality filter for now, can be extended for other operators
      if (typeof value === 'object' && value !== null && 'operator' in value) {
          const { operator, val } = value as { operator: string, val: any };
          switch (operator) {
              case 'eq': dbQuery = dbQuery.eq(key, val); break;
              case 'neq': dbQuery = dbQuery.neq(key, val); break;
              case 'gt': dbQuery = dbQuery.gt(key, val); break;
              case 'gte': dbQuery = dbQuery.gte(key, val); break;
              case 'lt': dbQuery = dbQuery.lt(key, val); break;
              case 'lte': dbQuery = dbQuery.lte(key, val); break;
              case 'like': dbQuery = dbQuery.like(key, val); break;
              case 'ilike': dbQuery = dbQuery.ilike(key, val); break;
              case 'in': dbQuery = dbQuery.in(key, val); break;
              default: dbQuery = dbQuery.eq(key, val); // Fallback
          }
      } else {
          dbQuery = dbQuery.eq(key, value);
      }
    });
  }

  // Apply pagination
  const from = (query.page - 1) * query.limit;
  const to = from + query.limit - 1;
  dbQuery = dbQuery.range(from, to);

  // Apply ordering
  if (query.orderBy) {
    dbQuery = dbQuery.order(query.orderBy.field, { ascending: query.orderBy.direction === 'asc' });
  }

  // Execute
  const { data, error, count } = await dbQuery;

  if (error) {
    logAudit(requesterId, query, 'ERROR', error.message);
    throw new Error(`Database error: ${error.message}`);
  }

  const result: QueryResult<T> = { data: data as T[] | null, meta: { total: count, page: query.page, limit: query.limit } };

  // Cache the result (TTL 5 minutes for AI queries)
  cacheManager.set(cacheKey, result, 5 * 60 * 1000);
  
  logAudit(requesterId, query, 'SUCCESS');
  
  return result;
};

// Export as a simple object to maintain compatibility with existing imports
export const aiService = {
  executeQuery
};
