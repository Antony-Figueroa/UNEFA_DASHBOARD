/**
 * @file crudServiceFactory.ts
 * @description Fábrica para la creación de servicios CRUD estandarizados.
 * Reduce la duplicación de código al proporcionar implementaciones base para
 * las operaciones comunes de la API.
 * 
 * @module api/crudServiceFactory
 */

import apiClient from "./apiClient";

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
  mapToApi?: (item: Partial<TItem> | TCreatePayload | TUpdatePayload) => any;
}

/**
 * Interfaz resultante de un servicio CRUD generado.
 */
export interface CrudService<TItem, TCreatePayload, TUpdatePayload> {
  getAll: () => Promise<TItem[]>;
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
    getAll: async () => {
      const response = await apiClient.get<TApiDTO[] | { data: TApiDTO[] }>(endpoint);
      const data = Array.isArray(response.data) ? response.data : response.data.data;
      return data.map(mapFromApi);
    },

    getById: async (id: string | number) => {
      const response = await apiClient.get<TApiDTO>(`${endpoint}/${id}`);
      return mapFromApi(response.data);
    },

    create: async (data: TCreatePayload) => {
      const payload = config.mapToApi ? config.mapToApi(data) : data;
      const response = await apiClient.post<TApiDTO>(endpoint, payload);
      return mapFromApi(response.data);
    },

    update: async (data: TUpdatePayload) => {
      // Se asume que el ID está presente en el payload o se maneja externamente
      // En esta implementación genérica, intentamos obtener el ID de campos comunes
      const possibleIdField = idField || `${endpoint.replace(/^\//, '')}Id`;
      const id = (data as any).id || 
                 (data as any).ID || 
                 (data as any)[possibleIdField] || 
                 (data as any)[possibleIdField.replace(/sId$/, 'Id')];
      
      const payload = config.mapToApi ? config.mapToApi(data) : data;
      const response = await apiClient.put<TApiDTO>(`${endpoint}/${id}`, payload);
      return mapFromApi(response.data);
    },

    delete: async (id: string | number) => {
      await apiClient.delete(`${endpoint}/${id}`);
    },

    toggleStatus: async (id: string | number, status: boolean) => {
      await apiClient.patch(`${endpoint}/${id}/status`, { status });
    },
    
    bulkDelete: async (ids: (string | number)[]) => {
      await apiClient.post(`${endpoint}/bulk-delete`, { ids });
    },
    
    bulkRestore: async (ids: (string | number)[]) => {
      await apiClient.post(`${endpoint}/bulk-restore`, { ids });
    }
  };
}
