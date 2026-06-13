import { useEffect, useState } from 'react';
import { Plus, MapPin, Loader2 } from 'lucide-react';
import { useAddresses } from '../hooks/useAddresses';
import AddressCard from './AddressCard';
import AddressForm from './AddressForm';
import Button from '../../../components/ui/button/Button';
import { addressService } from '../services/addressService';
import type { GeoOptionsItem, InstitutionAddress, PersonAddress, AddressType } from '../types';

type AddressRow = InstitutionAddress | PersonAddress;

const getAddrId = (addr: AddressRow, entityType: 'person' | 'institution'): number =>
  entityType === 'institution' ? (addr as InstitutionAddress).institutionAddressId : (addr as PersonAddress).personAddressId;

interface AddressListProps {
  entityType: 'person' | 'institution';
  entityId: number | null;
  geoOptions: GeoOptionsItem[];
  onAddressesChange?: () => void;
}

export default function AddressList({
  entityType,
  entityId,
  geoOptions,
  onAddressesChange,
}: AddressListProps) {
  const {
    addresses,
    loading,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setPrimary,
  } = useAddresses({ entityType, entityId });

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressRow | null>(null);
  const [addressTypes, setAddressTypes] = useState<AddressType[]>([]);

  useEffect(() => {
    if (entityId) {
      fetchAddresses();
    }
  }, [entityId, fetchAddresses]);

  useEffect(() => {
    addressService.getAddressTypes().then(res => setAddressTypes(res.data)).catch(() => {});
  }, []);

  const addressTypeOptions = addressTypes.map(t => ({
    value: String(t.addressTypeId),
    label: t.name,
  }));

  const handleAdd = async (data: {
    addressTypeId: number;
    parroquiaId: number;
    streetAddress: string;
    reference?: string;
    isPrimary?: boolean;
  }) => {
    if (!entityId) return;
    await addAddress({
      entityType,
      entityId,
      ...data,
    });
    onAddressesChange?.();
  };

  const handleEdit = async (data: {
    addressTypeId: number;
    parroquiaId: number;
    streetAddress: string;
    reference?: string;
    isPrimary?: boolean;
  }) => {
    if (!editingAddress) return;
    await updateAddress(getAddrId(editingAddress, entityType), {
      parroquiaId: data.parroquiaId,
      streetAddress: data.streetAddress,
      reference: data.reference,
      addressTypeId: data.addressTypeId,
    });
    setEditingAddress(null);
    onAddressesChange?.();
  };

  const handleDelete = async (id: number) => {
    await deleteAddress(id);
    onAddressesChange?.();
  };

  const handleSetPrimary = async (id: number, addressTypeId: number) => {
    await setPrimary(id, addressTypeId);
    onAddressesChange?.();
  };

  const openEditForm = (addr: AddressRow) => {
    setEditingAddress(addr);
    setShowForm(true);
  };

  const initialFormData = editingAddress
    ? {
        parroquiaId: editingAddress.address.parroquiaId,
        streetAddress: editingAddress.address.streetAddress,
        reference: editingAddress.address.reference || undefined,
        isPrimary: editingAddress.isPrimary,
        addressTypeId: editingAddress.addressType.addressTypeId,
      }
    : undefined;

  if (!entityId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <MapPin className="h-4 w-4" />
          Direcciones Registradas
          {addresses.length > 0 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {addresses.length}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingAddress(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4 text-sm text-gray-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cargando direcciones...
        </div>
      ) : addresses.length === 0 ? (
        <p className="py-2 text-center text-sm text-gray-400">
          No hay direcciones registradas. Agregue una dirección para mejorar la asignación de pasantías.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map(addr => {
            const addrId = getAddrId(addr, entityType);
            return (
            <AddressCard
              key={addrId}
              address={addr}
              onEdit={() => openEditForm(addr)}
              onDelete={() => handleDelete(addrId)}
              onSetPrimary={() => handleSetPrimary(addrId, addr.addressType.addressTypeId)}
            />);
          })}
        </div>
      )}

      <AddressForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingAddress(null);
        }}
        onSubmit={editingAddress ? handleEdit : handleAdd}
        geoOptions={geoOptions}
        addressTypes={addressTypeOptions}
        initialData={initialFormData}
      />
    </div>
  );
}
