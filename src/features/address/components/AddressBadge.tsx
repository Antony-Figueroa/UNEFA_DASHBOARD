import type { AddressType } from '../types';

interface AddressBadgeProps {
  addressType: AddressType | null | undefined;
}

const TYPE_COLORS: Record<string, string> = {
  PRINCIPAL: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  DOMICILIO: 'bg-blue-100 text-blue-700 border-blue-300',
  RESIDENCIA_ACTUAL: 'bg-purple-100 text-purple-700 border-purple-300',
  SEDE_PRACTICAS: 'bg-green-100 text-green-700 border-green-300',
};

const DEFAULT_COLOR = 'bg-gray-100 text-gray-600 border-gray-300';

export default function AddressBadge({ addressType }: AddressBadgeProps) {
  const code = addressType?.code?.toUpperCase() ?? '';
  const colorClass = TYPE_COLORS[code] || DEFAULT_COLOR;

  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {addressType?.name ?? 'Sin tipo'}
    </span>
  );
}
