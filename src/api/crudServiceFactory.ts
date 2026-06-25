/**
 * @file crudServiceFactory.ts
 * @description Fábrica para la creación de servicios CRUD estandarizados.
 * Reduce la duplicación de código al proporcionar implementaciones base para
 * las operaciones comunes de la API.
 * 
 * @module api/crudServiceFactory
 */

import apiClient from "./apiClient";
import { dedupeRequest, invalidateCache } from "./requestCache";

/** Prefijo usado para invalidar cache por endpoint */
const crudCachePrefix = (endpoint: string) => `crud:${endpoint}:`;

/**
 * Configuración para la creación de un servicio CRUD.
 */
export interface CrudServiceConfig<TItem, TCreatePayload, TUpdatePayload, TApiDTO> {
  /** Endpoint base para el recurso (ej: '/careers') */
  endpoint: string;
  /** Campo que actúa como ID en el payload de actualización (opcional) */
  idField?: string;
  /** Función para mapear el DTO de la API a la entidad de dominio */
  mapFromApi: (dto: TApiDTO) => TItem;
  /** Función para mapear la entidad o el payload al DTO de la API (opcional) */
  mapToApi?: (item: Partial<TItem> | TCreatePayload | TUpdatePayload) => TApiDTO;
}

/**
 * Parámetros opcionales para getAll con paginación server-side.
 */
export interface GetAllParams {
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

/**
 * Respuesta paginada de getAll cuando se pasan params.
 */
export interface PaginatedResponse<TItem> {
  data: TItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Normaliza un resultado que puede ser PaginatedResponse o array plano,
 * devolviendo siempre un array plano.
 */
export function unwrapData<T>(result: T[] | PaginatedResponse<T>): T[] {
  if (result && typeof result === 'object' && 'data' in result && Array.isArray((result as PaginatedResponse<T>).data)) {
    return (result as PaginatedResponse<T>).data;
  }
  return result as T[];
}

/**
 * Interfaz resultante de un servicio CRUD generado.
 */
export interface CrudService<TItem, TCreatePayload, TUpdatePayload> {
  getAll: (params?: GetAllParams) => Promise<TItem[] | PaginatedResponse<TItem>>;
  getById: (id: string | number) => Promise<TItem>;
  create: (data: TCreatePayload) => Promise<TItem>;
  update: (data: TUpdatePayload) => Promise<TItem>;
  delete: (id: string | number) => Promise<void>;
  toggleStatus: (id: string | number, status: boolean) => Promise<void>;
  bulkDelete: (ids: (string | number)[]) => Promise<void>;
  bulkRestore: (ids: (string | number)[]) => Promise<void>;
}

/**
 * Crea un conjunto de funciones de servicio CRUD basadas en la configuración proporcionada.
 * 
 * @param config - Configuración del servicio.
 * @returns Objeto con las funciones CRUD estándar.
 */
export function createCrudService<TItem, TCreatePayload, TUpdatePayload, TApiDTO>(
  config: CrudServiceConfig<TItem, TCreatePayload, TUpdatePayload, TApiDTO>
): CrudService<TItem, TCreatePayload, TUpdatePayload> {
  const { endpoint, idField, mapFromApi } = config;

  return {
    getAll: async (params?: GetAllParams) => {
      const cacheKey = `${crudCachePrefix(endpoint)}list:${JSON.stringify(params || {})}`;
      return dedupeRequest(cacheKey, async () => {
        const response = await apiClient.get<unknown>(endpoint, { params });
        const body = response.data as Record<string, unknown>;

        // Backward compatibility: si no hay params, mantener comportamiento anterior
        if (!params) {
          if (Array.isArray(body)) {
            return (body as TApiDTO[]).map(mapFromApi);
          }
          const data = (body.data as TApiDTO[]) ?? (body as unknown as TItem[]);
          return Array.isArray(data) ? data.map(mapFromApi) : (data as TItem[]);
        }

        // Respuesta paginada: { data: [], total, limit, offset }
        const rawData = (body.data as TApiDTO[]) ?? (body as unknown as TApiDTO[]) ?? [];
        const items = Array.isArray(rawData) ? rawData.map(mapFromApi) : [];
        return {
          data: items,
          total: (body.total as number) ?? items.length,
          limit: (body.limit as number) ?? params.limit ?? 20,
          offset: (body.offset as number) ?? params.offset ?? 0,
        };
      });
    },

    getById: async (id: string | number) => {
      const response = await apiClient.get<TApiDTO>(`${endpoint}/${id}`);
      return mapFromApi(response.data);
    },

    create: async (data: TCreatePayload) => {
      const payload = config.mapToApi ? config.mapToApi(data) : data;
      const response = await apiClient.post<TApiDTO>(endpoint, payload);
      invalidateCache(crudCachePrefix(endpoint));
      return mapFromApi(response.data);
    },

    update: async (data: TUpdatePayload) => {
      // Se asume que el ID está presente en el payload o se maneja externamente
      // En esta implementación genérica, intentamos obtener el ID de campos comunes
      const possibleIdField = idField || `${endpoint.replace(/^\//, '')}Id`;
      const record = data as Record<string, unknown>;
      const id = (record.id as string | number) ?? 
                 (record.ID as string | number) ?? 
                 (record[possibleIdField] as string | number) ?? 
                 (record[possibleIdField.replace(/sId$/, 'Id')] as string | number) ?? '';
      
      const payload = config.mapToApi ? config.mapToApi(data) : data;
      const response = await apiClient.put<TApiDTO>(`${endpoint}/${id}`, payload);
      invalidateCache(crudCachePrefix(endpoint));
      return mapFromApi(response.data);
    },

    delete: async (id: string | number) => {
      await apiClient.delete(`${endpoint}/${id}`);
      invalidateCache(crudCachePrefix(endpoint));
    },

    toggleStatus: async (id: string | number, status: boolean) => {
      await apiClient.patch(`${endpoint}/${id}/status`, { status });
      invalidateCache(crudCachePrefix(endpoint));
    },
    
    bulkDelete: async (ids: (string | number)[]) => {
      await apiClient.post(`${endpoint}/bulk-delete`, { ids });
      invalidateCache(crudCachePrefix(endpoint));
    },
    
    bulkRestore: async (ids: (string | number)[]) => {
      await apiClient.post(`${endpoint}/bulk-restore`, { ids });
      invalidateCache(crudCachePrefix(endpoint));
    }
  };
}
