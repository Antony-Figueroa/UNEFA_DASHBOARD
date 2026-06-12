import apiClient from "../../../api/apiClient";
import type {
  PersonAddress,
  InstitutionAddress,
  CreateAddressPayload,
  UpdateAddressPayload,
  AddressCoincidence,
  AddressSuggestion,
} from "../types";

const API_URL = "/address";

export const addressService = {
  getPersonAddresses: (personId: number | string) =>
    apiClient.get<PersonAddress[]>(`${API_URL}/person/${personId}`),

  getInstitutionAddresses: (institutionId: number | string) =>
    apiClient.get<InstitutionAddress[]>(`${API_URL}/institution/${institutionId}`),

  createAddress: (data: CreateAddressPayload) =>
    apiClient.post(`${API_URL}`, data),

  updateAddress: (id: number | string, data: UpdateAddressPayload) =>
    apiClient.put(`${API_URL}/${id}`, data),

  deleteAddress: (id: number | string, entityType: "person" | "institution", entityId: number) =>
    apiClient.delete(`${API_URL}/${id}?entity_type=${entityType}&entity_id=${entityId}`),

  setPrimaryAddress: (id: number | string, data: { entityType: string; entityId: number; addressTypeId: number }) =>
    apiClient.patch(`${API_URL}/${id}/primary`, data),

  getCoincidence: (personId: number | string, institutionId: number | string) =>
    apiClient.get<AddressCoincidence>(`${API_URL}/coincidence`, {
      params: { person_id: personId, institution_id: institutionId },
    }),

  getStats: () => apiClient.get(`${API_URL}/stats`),

  getSuggestions: (personId: number | string, careerId: number | string, internshipTypeId?: number | string) =>
    apiClient.get<AddressSuggestion[]>(`${API_URL}/suggestions`, {
      params: { person_id: personId, career_id: careerId, internship_type_id: internshipTypeId },
    }),
};
