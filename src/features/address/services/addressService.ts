import apiClient from "../../../api/apiClient";
import type {
  PersonAddress,
  InstitutionAddress,
  CreateAddressPayload,
  UpdateAddressPayload,
  AddressCoincidence,
  AddressSuggestion,
  GeoOptionsItem,
  AddressType,
} from "../types";

const API_URL = "/address";

function toSnake(str: string): string {
  return str.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

function snakeify<T>(obj: T): Record<string, unknown> {
  if (obj === null || typeof obj !== 'object') return obj as unknown as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    result[toSnake(key)] = val;
  }
  return result;
}

export const addressService = {
  getPersonAddresses: (personId: number | string) =>
    apiClient.get<PersonAddress[]>(`${API_URL}/person/${personId}`),

  getInstitutionAddresses: (institutionId: number | string) =>
    apiClient.get<InstitutionAddress[]>(`${API_URL}/institution/${institutionId}`),

  createAddress: (data: CreateAddressPayload) =>
    apiClient.post(`${API_URL}`, snakeify(data)),

  updateAddress: (id: number | string, data: UpdateAddressPayload) =>
    apiClient.put(`${API_URL}/${id}`, snakeify(data)),

  deleteAddress: (id: number | string, entityType: "person" | "institution", entityId: number) =>
    apiClient.delete(`${API_URL}/${id}?entity_type=${entityType}&entity_id=${entityId}`),

  setPrimaryAddress: (id: number | string, data: { entityType: string; entityId: number; addressTypeId: number }) =>
    apiClient.patch(`${API_URL}/${id}/primary`, snakeify(data)),

  getCoincidence: (personId: number | string, institutionId: number | string) =>
    apiClient.get<AddressCoincidence>(`${API_URL}/coincidence`, {
      params: { person_id: personId, institution_id: institutionId },
    }),

  getStats: () => apiClient.get(`${API_URL}/stats`),

  getSuggestions: (personId: number | string, careerId: number | string, internshipTypeId?: number | string) =>
    apiClient.get<AddressSuggestion[]>(`${API_URL}/suggestions`, {
      params: { person_id: personId, career_id: careerId, internship_type_id: internshipTypeId },
    }),

  getGeoOptions: () => apiClient.get<GeoOptionsItem[]>(`${API_URL}/geo-options`),

  getAddressTypes: () => apiClient.get<AddressType[]>(`${API_URL}/address-types`),
};
