import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';
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
  const { addToast } = useToast();
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [geoOptions, setGeoOptions] = useState<GeoOptionsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const fetchIdRef = useRef(0);

  const fetchAddresses = useCallback(async () => {
    if (!entityId) return;
    const id = ++fetchIdRef.current;
    setLoading(true);
    try {
      const endpoint = entityType === 'institution'
        ? addressService.getInstitutionAddresses(entityId)
        : addressService.getPersonAddresses(entityId);
      const response = await endpoint;
      if (id !== fetchIdRef.current) return; // ponytail: stale fetch guard
      const raw = response.data;
      if (!Array.isArray(raw)) { setAddresses([]); return; }
      const camelized = camelizeKeys<any[]>(raw);
      const flattened = camelized.map(flattenAddress);
      setAddresses(flattened);
    } catch (error: any) {
      addToast(TOAST.loadError());
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
      addToast(TOAST.loadError());
      console.error('[useAddresses] geo error:', error);
    } finally {
      setGeoLoading(false);
    }
  }, []);

  const addAddress = async (payload: CreateAddressPayload) => {
    try {
      await addressService.createAddress(payload);
      addToast({ variant: "success", title: "Dirección agregada", message: "Dirección agregada exitosamente" });
      await fetchAddresses();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al agregar dirección';
      addToast({ variant: "error", title: "Error", message });
      console.error('[useAddresses] add error:', error);
      throw error;
    }
  };

  const updateAddress = async (id: number, payload: UpdateAddressPayload) => {
    try {
      await addressService.updateAddress(id, payload);
      addToast({ variant: "success", title: "Dirección actualizada", message: "Dirección actualizada exitosamente" });
      await fetchAddresses();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al actualizar dirección';
      addToast({ variant: "error", title: "Error al actualizar", message });
      console.error('[useAddresses] update error:', error);
      throw error;
    }
  };

  const deleteAddress = async (id: number) => {
    if (!entityId) return;
    try {
      await addressService.deleteAddress(id, entityType, entityId);
      addToast({ variant: "success", title: "Dirección eliminada", message: "Dirección eliminada" });
      await fetchAddresses();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al eliminar dirección';
      addToast({ variant: "error", title: "Error al eliminar", message });
      console.error('[useAddresses] delete error:', error);
      throw error;
    }
  };

  const setPrimary = async (id: number, addressTypeId?: number) => {
    if (!entityId || !addressTypeId) return;
    try {
      await addressService.setPrimaryAddress(id, { entityType, entityId, addressTypeId });
      addToast({ variant: "success", title: "Dirección principal", message: "Dirección principal actualizada" });
      await fetchAddresses();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al establecer dirección principal';
      addToast({ variant: "error", title: "Error", message });
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
