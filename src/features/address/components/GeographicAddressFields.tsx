import { useState, useEffect, useMemo, useCallback } from 'react';
import CustomSelect from '../../../components/form/CustomSelect';
import Input from '../../../components/form/input/InputField';
import TextArea from '../../../components/form/input/TextArea';
import type { GeoOptionsItem } from '../types';

export interface GeographicAddressValue {
  parroquiaId: number | null;
  streetAddress: string;
  reference?: string;
  addressTypeId?: number;
  isPrimary?: boolean;
}

interface GeographicAddressFieldsProps {
  geoOptions: GeoOptionsItem[];
  addressTypes?: { value: string; label: string }[];
  value?: GeographicAddressValue;
  onChange?: (data: GeographicAddressValue) => void;
  disabled?: boolean;
  showTypeSelector?: boolean;
  showPrimaryCheckbox?: boolean;
  showReference?: boolean;
  estadoLabel?: React.ReactNode;
  municipioLabel?: React.ReactNode;
  parroquiaLabel?: React.ReactNode;
  streetLabel?: React.ReactNode;
}

export default function GeographicAddressFields({
  geoOptions,
  addressTypes,
  value,
  onChange,
  disabled = false,
  showTypeSelector = false,
  showPrimaryCheckbox = false,
  showReference = false,
  estadoLabel = <>Estado <span className="text-red-500">*</span></>,
  municipioLabel = <>Municipio <span className="text-red-500">*</span></>,
  parroquiaLabel = <>Parroquia <span className="text-red-500">*</span></>,
  streetLabel = <>Dirección <span className="text-red-500">*</span></>,
}: GeographicAddressFieldsProps) {
  const [selectedEstadoId, setSelectedEstadoId] = useState<number | null>(null);
  const [selectedMunicipioId, setSelectedMunicipioId] = useState<number | null>(null);
  const [selectedParroquiaId, setSelectedParroquiaId] = useState<number | null>(null);
  const [streetAddress, setStreetAddress] = useState('');
  const [reference, setReference] = useState('');
  const [addressTypeId, setAddressTypeId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const emitChange = useCallback((parroquiaId: number | null, street: string, ref: string, typeId: string, primary: boolean) => {
    onChange?.({
      parroquiaId,
      streetAddress: street.trim(),
      reference: ref.trim() || undefined,
      addressTypeId: typeId ? Number(typeId) : undefined,
      isPrimary: primary,
    });
  }, [onChange]);

  const setAndEmitAll = useCallback((estadoId: number | null, municipioId: number | null, parroquiaId: number | null, street: string, ref: string, typeId: string, primary: boolean) => {
    setSelectedEstadoId(estadoId);
    setSelectedMunicipioId(municipioId);
    setSelectedParroquiaId(parroquiaId);
    setStreetAddress(street);
    setReference(ref);
    setAddressTypeId(typeId);
    setIsPrimary(primary);
    emitChange(parroquiaId, street, ref, typeId, primary);
  }, [emitChange]);

  // Sync external value changes into internal state
  useEffect(() => {
    if (!value) return;
    setStreetAddress(value.streetAddress || '');
    setReference(value.reference || '');
    setIsPrimary(value.isPrimary || false);
    if (value.addressTypeId) setAddressTypeId(String(value.addressTypeId));
  }, [value?.streetAddress, value?.reference, value?.isPrimary, value?.addressTypeId]);

  // Resolve estado/municipio from parroquiaId
  useEffect(() => {
    if (!value?.parroquiaId || geoOptions.length === 0) return;
    for (const estado of geoOptions) {
      for (const municipio of estado.t_municipio) {
        const found = municipio.t_parroquia.find(p => p.parroquia_id === value.parroquiaId);
        if (found) {
          setSelectedEstadoId(estado.estado_id);
          setSelectedMunicipioId(municipio.municipio_id);
          setSelectedParroquiaId(value.parroquiaId);
          return;
        }
      }
    }
  }, [value?.parroquiaId, geoOptions]);

  const estadoOptions = useMemo(() =>
    geoOptions.map(e => ({ value: String(e.estado_id), label: e.name })),
    [geoOptions]
  );

  const municipioOptions = useMemo(() => {
    const estado = geoOptions.find(e => e.estado_id === selectedEstadoId);
    if (!estado) return [];
    return estado.t_municipio.map(m => ({ value: String(m.municipio_id), label: m.name }));
  }, [geoOptions, selectedEstadoId]);

  const parroquiaOptions = useMemo(() => {
    const estado = geoOptions.find(e => e.estado_id === selectedEstadoId);
    if (!estado) return [];
    const municipio = estado.t_municipio.find(m => m.municipio_id === selectedMunicipioId);
    if (!municipio) return [];
    
    // Ponytail: parche temporal hasta corregir la BD (Agua Blanca no pertenece a Araure)
    return municipio.t_parroquia
      .filter(p => !(municipio.name === 'Araure' && p.name === 'Agua Blanca'))
      .map(p => ({ value: String(p.parroquia_id), label: p.name }));
  }, [geoOptions, selectedEstadoId, selectedMunicipioId]);

  const handleStreetChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setStreetAddress(v);
    emitChange(selectedParroquiaId, v, reference, addressTypeId, isPrimary);
  };

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setReference(v);
    emitChange(selectedParroquiaId, streetAddress, v, addressTypeId, isPrimary);
  };

  const handleEstadoChange = (val: string) => {
    const id = val ? Number(val) : null;
    setSelectedEstadoId(id);
    setSelectedMunicipioId(null);
    setSelectedParroquiaId(null);
    emitChange(null, streetAddress, reference, addressTypeId, isPrimary);
  };

  const handleMunicipioChange = (val: string) => {
    const id = val ? Number(val) : null;
    setSelectedMunicipioId(id);
    setSelectedParroquiaId(null);
    emitChange(null, streetAddress, reference, addressTypeId, isPrimary);
  };

  const handleParroquiaChange = (val: string) => {
    const id = val ? Number(val) : null;
    setSelectedParroquiaId(id);
    emitChange(id, streetAddress, reference, addressTypeId, isPrimary);
  };

  const handleTypeChange = (val: string) => {
    setAddressTypeId(val);
    emitChange(selectedParroquiaId, streetAddress, reference, val, isPrimary);
  };

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.checked;
    setIsPrimary(v);
    emitChange(selectedParroquiaId, streetAddress, reference, addressTypeId, v);
  };

  return (
    <div className="space-y-4">
      {showTypeSelector && addressTypes && addressTypes.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Dirección</label>
          <CustomSelect
            options={addressTypes}
            value={addressTypeId}
            onChange={handleTypeChange}
            placeholder="Seleccione tipo"
            disabled={disabled}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{estadoLabel}</label>
          <CustomSelect
            options={estadoOptions}
            value={selectedEstadoId ? String(selectedEstadoId) : ''}
            onChange={handleEstadoChange}
            placeholder="Seleccione Estado"
            disabled={disabled}
            searchable
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{municipioLabel}</label>
          <CustomSelect
            options={municipioOptions}
            value={selectedMunicipioId ? String(selectedMunicipioId) : ''}
            onChange={handleMunicipioChange}
            placeholder="Seleccione Municipio"
            disabled={disabled || !selectedEstadoId}
            searchable
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{parroquiaLabel}</label>
          <CustomSelect
            key={`parroquia-select-${selectedMunicipioId}`}
            options={parroquiaOptions}
            value={selectedParroquiaId ? String(selectedParroquiaId) : ''}
            onChange={handleParroquiaChange}
            placeholder="Seleccione Parroquia"
            disabled={disabled || !selectedMunicipioId}
            searchable
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{streetLabel}</label>
        <TextArea
          placeholder="Calle, número, sector, urbanización..."
          value={streetAddress}
          onChange={handleStreetChange}
          rows={3}
          disabled={disabled}
        />
      </div>

      {showReference && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Referencia</label>
          <Input
            placeholder="Punto de referencia (opcional)"
            value={reference}
            onChange={handleReferenceChange}
            disabled={disabled}
          />
        </div>
      )}

      {showPrimaryCheckbox && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={handlePrimaryChange}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Dirección principal</span>
        </label>
      )}
    </div>
  );
}
