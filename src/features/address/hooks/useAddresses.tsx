import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { addressService } from '../services/addressService';
import type {
  InstitutionAddress,
  PersonAddress,
  CreateAddressPayload,
  UpdateAddressPayload,
  GeoOptionsItem,
} from '../types';

type AddressRow = InstitutionAddress | PersonAddress;

function camelize(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelizeKeys<T>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map(camelizeKeys) as T;
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[camelize(key)] = camelizeKeys(val);
    }
    return result as T;
  }
  return obj as T;
}

function flattenAddress(item: Record<string, unknown>): AddressRow {
  const addr = item.address as Record<string, unknown> | undefined;
  if (!addr || !addr.parroquia) return item as unknown as AddressRow;

  const p = addr.parroquia as Record<string, unknown>;
  const m = p.municipio as Record<string, unknown> | undefined;
  const e = m?.estado as Record<string, unknown> | undefined;

  return {
    ...item,
    address: {
      addressId: addr.addressId as number,
      streetAddress: addr.streetAddress as string,
      reference: (addr.reference as string) ?? undefined,
      createdAt: addr.createdAt as string,
      parroquiaId: p.parroquiaId as number,
      parroquia: p.name as string,
      municipioId: (m?.municipioId as number) ?? 0,
      municipio: (m?.name as string) ?? '',
      estadoId: (e?.estadoId as number) ?? 0,
      estado: (e?.name as string) ?? '',
      fullAddress: `${p.name ?? ''}, ${m?.name ?? ''}, ${e?.name ?? ''}`,
    },
  } as AddressRow;
}

interface UseAddressesOptions {
  entityType: 'person' | 'institution';
  entityId: number | null;
}

export const useAddresses = ({ entityType, entityId }: UseAddressesOptions) => {
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [geoOptions, setGeoOptions] = useState<GeoOptionsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const endpoint = entityType === 'institution'
        ? addressService.getInstitutionAddresses(entityId)
        : addressService.getPersonAddresses(entityId);
      const response = await endpoint;
      const camelized = camelizeKeys<any[]>(response.data);
      const flattened = camelized.map(flattenAddress);
      setAddresses(flattened);
    } catch (error: any) {
      toast.error('Error al cargar direcciones');
      console.error('[useAddresses] fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  const fetchGeoOptions = useCallback(async () => {
    setGeoLoading(true);
    try {
      const response = await addressService.getGeoOptions();
      setGeoOptions(response.data);
    } catch (error: any) {
      toast.error('Error al cargar datos geográficos');
      console.error('[useAddresses] geo error:', error);
    } finally {
      setGeoLoading(false);
    }
  }, []);

  const addAddress = async (payload: CreateAddressPayload) => {
    try {
      await addressService.createAddress(payload);
      toast.success('Dirección agregada exitosamente');
      await fetchAddresses();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al agregar dirección';
      toast.error(message);
      console.error('[useAddresses] add error:', error);
      throw error;
    }
  };

  const updateAddress = async (id: number, payload: UpdateAddressPayload) => {
    try {
      await addressService.updateAddress(id, payload);
      toast.success('Dirección actualizada exitosamente');
      await fetchAddresses();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al actualizar dirección';
      toast.error(message);
      console.error('[useAddresses] update error:', error);
      throw error;
    }
  };

  const deleteAddress = async (id: number) => {
    if (!entityId) return;
    try {
      await addressService.deleteAddress(id, entityType, entityId);
      toast.success('Dirección eliminada');
      await fetchAddresses();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al eliminar dirección';
      toast.error(message);
      console.error('[useAddresses] delete error:', error);
      throw error;
    }
  };

  const setPrimary = async (id: number, addressTypeId?: number) => {
    if (!entityId || !addressTypeId) return;
    try {
      await addressService.setPrimaryAddress(id, { entityType, entityId, addressTypeId });
      toast.success('Dirección principal actualizada');
      await fetchAddresses();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al establecer dirección principal';
      toast.error(message);
      console.error('[useAddresses] setPrimary error:', error);
      throw error;
    }
  };

  return {
    addresses,
    geoOptions,
    loading,
    geoLoading,
    fetchAddresses,
    fetchGeoOptions,
    addAddress,
    updateAddress,
    deleteAddress,
    setPrimary,
  };
};
