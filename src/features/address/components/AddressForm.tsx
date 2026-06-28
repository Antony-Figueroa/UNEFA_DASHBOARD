import { useState, useEffect, useMemo } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';

import CustomSelect from '../../../components/form/CustomSelect';
import Input from '../../../components/form/input/InputField';
import TextArea from '../../../components/form/input/TextArea';
import type { GeoOptionsItem } from '../types';

interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    addressTypeId: number;
    parroquiaId: number;
    streetAddress: string;
    reference?: string;
    isPrimary?: boolean;
  }) => Promise<void>;
  geoOptions: GeoOptionsItem[];
  addressTypes: { value: string; label: string }[];
  initialData?: {
    parroquiaId?: number;
    streetAddress?: string;
    reference?: string;
    isPrimary?: boolean;
    addressTypeId?: number;
  };
}

export default function AddressForm({
  isOpen,
  onClose,
  onSubmit,
  geoOptions,
  addressTypes,
  initialData,
}: AddressFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const [selectedEstadoId, setSelectedEstadoId] = useState<number | null>(null);
  const [selectedMunicipioId, setSelectedMunicipioId] = useState<number | null>(null);
  const [selectedParroquiaId, setSelectedParroquiaId] = useState<number | null>(null);
  const [addressTypeId, setAddressTypeId] = useState<string>('');
  const [streetAddress, setStreetAddress] = useState('');
  const [reference, setReference] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

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
    return municipio.t_parroquia.map(p => ({ value: String(p.parroquia_id), label: p.name }));
  }, [geoOptions, selectedEstadoId, selectedMunicipioId]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedEstadoId(null);
      setSelectedMunicipioId(null);
      setSelectedParroquiaId(null);
      setAddressTypeId('');
      setStreetAddress('');
      setReference('');
      setIsPrimary(false);
    } else if (initialData) {
      setStreetAddress(initialData.streetAddress || '');
      setReference(initialData.reference || '');
      setIsPrimary(initialData.isPrimary || false);
      if (initialData.addressTypeId) {
        setAddressTypeId(String(initialData.addressTypeId));
      }
    }
  }, [isOpen, initialData]);

  const findIdsFromParroquia = (parroquiaId: number) => {
    for (const estado of geoOptions) {
      for (const municipio of estado.t_municipio) {
        const found = municipio.t_parroquia.find(p => p.parroquia_id === parroquiaId);
        if (found) {
          return { estadoId: estado.estado_id, municipioId: municipio.municipio_id };
        }
      }
    }
    return null;
  };

  useEffect(() => {
    const pid = initialData?.parroquiaId;
    if (pid && geoOptions.length > 0) {
      const result = findIdsFromParroquia(pid);
      if (result) {
        setSelectedEstadoId(result.estadoId);
        setTimeout(() => setSelectedMunicipioId(result.municipioId), 50);
        setTimeout(() => setSelectedParroquiaId(pid), 100);
      }
    }
  }, [initialData, geoOptions]);

  const canSubmit = addressTypeId && selectedParroquiaId && streetAddress.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        addressTypeId: Number(addressTypeId),
        parroquiaId: selectedParroquiaId!,
        streetAddress: streetAddress.trim(),
        reference: reference.trim() || undefined,
        isPrimary,
      });
      onClose();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        {initialData ? 'Editar Dirección' : 'Agregar Dirección'}
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Tipo de Dirección <span className="text-red-500">*</span></label>
            <CustomSelect
              options={addressTypes}
              value={addressTypeId}
              onChange={setAddressTypeId}
              placeholder="Seleccione tipo"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Estado <span className="text-red-500">*</span></label>
            <CustomSelect
              options={estadoOptions}
              value={selectedEstadoId ? String(selectedEstadoId) : ''}
              onChange={(val) => {
                setSelectedEstadoId(Number(val));
                setSelectedMunicipioId(null);
                setSelectedParroquiaId(null);
              }}
              placeholder="Seleccione Estado"
              searchable
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Municipio <span className="text-red-500">*</span></label>
            <CustomSelect
              options={municipioOptions}
              value={selectedMunicipioId ? String(selectedMunicipioId) : ''}
              onChange={(val) => {
                setSelectedMunicipioId(Number(val));
                setSelectedParroquiaId(null);
              }}
              placeholder="Seleccione Municipio"
              disabled={!selectedEstadoId}
              searchable
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Parroquia <span className="text-red-500">*</span></label>
            <CustomSelect
              options={parroquiaOptions}
              value={selectedParroquiaId ? String(selectedParroquiaId) : ''}
              onChange={(val) => setSelectedParroquiaId(Number(val))}
              placeholder="Seleccione Parroquia"
              disabled={!selectedMunicipioId}
              searchable
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Dirección <span className="text-red-500">*</span></label>
            <TextArea
              placeholder="Calle, número, sector, urbanización..."
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Referencia</label>
            <Input
              placeholder="Punto de referencia (opcional)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Establecer como dirección principal</span>
          </label>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} loading={submitting} disabled={!canSubmit} loadingText="Guardando...">
          {initialData ? 'Actualizar' : 'Agregar'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
