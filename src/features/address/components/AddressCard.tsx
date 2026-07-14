import { Pencil, Trash2, Star } from 'lucide-react';
import AddressBadge from './AddressBadge';
import type { InstitutionAddress, PersonAddress } from '../types';

type AddressRow = InstitutionAddress | PersonAddress;

interface AddressCardProps {
  address: AddressRow;
  onEdit: () => void;
  onDelete: () => void;
  onSetPrimary: () => void;
}

export default function AddressCard({ address, onEdit, onDelete, onSetPrimary }: AddressCardProps) {
  const { address: addr, addressType, isPrimary } = address;

  return (
    <div className={`relative rounded-lg border p-4 transition-all ${
      isPrimary ? 'border-warning-400 bg-warning-50/50' : 'border-border-light bg-bg-main'
    } dark:border-border-dark dark:bg-bg-dark`}>
      {isPrimary && (
        <span className="absolute -top-2 -right-2 flex h-6 items-center gap-1 rounded-full bg-warning-400 px-2 text-xs font-semibold text-warning-900 shadow-sm">
          <Star className="h-3 w-3" /> Principal
        </span>
      )}

      {addressType?.code?.toUpperCase() !== 'FISCAL' && (
        <div className="mb-2">
          <AddressBadge addressType={addressType} />
        </div>
      )}

      <p className="text-sm font-medium text-text-primary">{addr.streetAddress}</p>
      <p className="text-sm text-text-secondary">
        {addr.parroquia}, {addr.municipio} &mdash; {addr.estado}
      </p>
      {addr.reference && (
        <p className="mt-1 text-xs text-text-tertiary">Ref: {addr.reference}</p>
      )}

      <div className="mt-3 flex gap-2">
        {!isPrimary && (
          <button
            type="button"
            onClick={onSetPrimary}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-warning-600 hover:bg-warning-50 transition-colors"
            title="Establecer como principal"
          >
            <Star className="h-3.5 w-3.5" /> Principal
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-error-600 hover:bg-error-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" /> Eliminar
        </button>
      </div>
    </div>
  );
}
