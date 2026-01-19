/**
 * @file InstitutionModal.tsx
 * @description Modal con formulario para crear y editar instituciones.
 */

import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import Select from "../../../components/form/Select";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Institution } from "../types";
import Button from "../../../components/ui/button/Button";
import { useInternshipTypes } from "../../internship-types/hooks/useInternshipTypes";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useLists } from "../../lists/hooks/useLists";

interface InstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (inst: Omit<Institution, "institutionId" | "registrationDate">) => void;
  editingInst?: Institution | null;
  careerOptions: { value: string | number; label: string }[];
  isLoading?: boolean;
}

const instSchema = z.object({
  rif: z.string().min(1, "El RIF es obligatorio").regex(/^[VEJPG]-[0-9]{8,9}$/, "Formato inválido (Ej: J-12345678)"),
  name: z.string().min(1, "El nombre es obligatorio"),
  fiscalAddress: z.string().min(1, "La dirección fiscal es obligatoria"),
  phonePrefix: z.string().min(1, "Seleccione un prefijo"),
  phoneNumber: z.string()
    .min(1, "El número de teléfono es obligatorio")
    .regex(/^\d+$/, "Solo se admiten números")
    .min(7, "El número debe tener al menos 7 dígitos"),
  practiceType: z.string().min(1, "Seleccione un tipo de práctica"),
  careerId: z.union([z.string(), z.number()]).refine(val => String(val).length > 0, "Seleccione una carrera"),
  region: z.string().min(1, "Seleccione un región"),
  nucleus: z.string().min(1, "Seleccione un núcleo"),
  extension: z.string().min(1, "Seleccione una extensión"),
  institutionType: z.string().min(1, "Seleccione un tipo de institución"),
});

type InstFormData = z.infer<typeof instSchema>;

export default function InstitutionModal({
  isOpen,
  onClose,
  onSave,
  editingInst,
  careerOptions,
  isLoading = false,
}: InstitutionModalProps) {
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const { fetchMultipleLists } = useLists();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitted, isDirty },
  } = useForm<InstFormData>({
    resolver: zodResolver(instSchema),
    defaultValues: {
      rif: "",
      name: "",
      fiscalAddress: "",
      phonePrefix: "",
      phoneNumber: "",
      practiceType: "",
      careerId: "",
      region: "",
      nucleus: "",
      extension: "",
      institutionType: "",
    },
  });

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  const { options: practiceOptions, fetchByCareer } = useInternshipTypes();
  const watchedCareerId = useWatch({ control, name: "careerId" });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const listNames = [
          "CODIGOS_AREA",
          "Región",
          "Núcleo",
          "Extensión",
          "Tipo Institución"
        ];
        const data = await fetchMultipleLists(listNames);
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};
        
        Object.entries(data).forEach(([key, values]) => {
          mappedOptions[key] = values.map(v => ({
            value: v.name.toUpperCase(),
            label: v.name.toUpperCase()
          }));
        });
        
        setOptions(mappedOptions);
      } catch (error) {
        console.error("Error loading list options:", error);
      }
    };

    if (isOpen) {
      loadOptions();
    }
  }, [isOpen, fetchMultipleLists]);

  const VENEZUELA_PHONE_PREFIXES = options.CODIGOS_AREA || [
    { value: "0412", label: "0412" },
    { value: "0414", label: "0414" },
    { value: "0424", label: "0424" },
    { value: "0416", label: "0416" },
    { value: "0426", label: "0426" },
    { value: "0212", label: "0212" },
  ];

  const REGION_OPTIONS = options["Región"] || [
    { value: "LOS LLANOS", label: "LOS LLANOS" },
  ];

  const NUCLEUS_OPTIONS = options["Núcleo"] || [
    { value: "PORTUGUESA", label: "PORTUGUESA" },
  ];

  const EXTENSION_OPTIONS = options["Extensión"] || [
    { value: "ACARIGUA", label: "ACARIGUA" },
    { value: "TURÉN", label: "TURÉN" },
    { value: "GUANARE", label: "GUANARE" },
  ];

  const INSTITUTION_TYPE_OPTIONS = options["Tipo Institución"] || [
    { value: "PUB", label: "PÚBLICA" },
    { value: "PRI", label: "PRIVADA" },
  ];

  useEffect(() => {
    if (watchedCareerId) {
      fetchByCareer(watchedCareerId);
    }
  }, [watchedCareerId, fetchByCareer]);

  useEffect(() => {
    if (isOpen) {
      if (editingInst) {
        // Separar el prefijo del número (asumiendo formato 04XX1234567 o 02431234567)
        let prefix = "";
        let number = "";
        
        if (editingInst.phone) {
          if (editingInst.phone.startsWith("0")) {
            prefix = editingInst.phone.substring(0, 4);
            number = editingInst.phone.substring(4);
          } else {
            // Caso por si no tiene el formato esperado
            number = editingInst.phone;
          }
        }

        reset({
          rif: editingInst.rif,
          name: editingInst.name,
          fiscalAddress: editingInst.fiscalAddress,
          phonePrefix: prefix,
          phoneNumber: number,
          practiceType: editingInst.practiceType,
          careerId: editingInst.careerId,
          region: editingInst.region,
          nucleus: editingInst.nucleus,
          extension: editingInst.extension,
          institutionType: editingInst.institutionType,
        });
      } else {
        reset({
          rif: "",
          name: "",
          fiscalAddress: "",
          phonePrefix: "",
          phoneNumber: "",
          practiceType: "",
          careerId: "",
          region: "",
          nucleus: "",
          extension: "",
          institutionType: "",
        });
      }
    }
  }, [editingInst, isOpen, reset]);

  const onSubmit = (data: InstFormData) => {
    const { phonePrefix, phoneNumber, ...rest } = data;
    onSave({
      ...rest,
      phone: `${phonePrefix}${phoneNumber}`,
      status: editingInst?.status ?? true,
      careerId: String(data.careerId),
      careerName: careerOptions.find(c => String(c.value) === String(data.careerId))?.label,
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton className="max-w-[95%] sm:max-w-[85%] md:max-w-[70%] lg:max-w-4xl">
        <ModalHeader>
          <h5 className="text-xl font-semibold text-text-primary dark:text-white/90">
            {editingInst ? "Editar Institución" : "Registrar Institución"}
          </h5>
          <p className="text-sm text-text-secondary">Complete la información de la institución.</p>
        </ModalHeader>
      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50 max-h-[70vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">RIF *</label>
            <Input 
              placeholder="J-12345678" 
              {...register("rif")} 
              error={!!errors.rif} 
              hint={isSubmitted ? errors.rif?.message : undefined} 
            />
          </div>
          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Nombre *</label>
            <Input 
              placeholder="Nombre de la institución" 
              {...register("name")} 
              error={!!errors.name} 
              hint={isSubmitted ? errors.name?.message : undefined} 
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Dirección Fiscal *</label>
            <TextArea 
              placeholder="Dirección completa" 
              {...register("fiscalAddress")} 
              error={!!errors.fiscalAddress} 
              hint={isSubmitted ? errors.fiscalAddress?.message : undefined} 
              rows={2}
            />
          </div>
          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Teléfono *</label>
            <div className="flex gap-2">
              <div className="w-32">
                <Controller
                  name="phonePrefix"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={VENEZUELA_PHONE_PREFIXES}
                      onChange={field.onChange}
                      defaultValue={field.value}
                      placeholder="Prefijo"
                    />
                  )}
                />
              </div>
              <div className="flex-1">
                <Input 
                  placeholder="1234567" 
                  {...register("phoneNumber")} 
                  error={!!errors.phoneNumber} 
                />
              </div>
            </div>
            {isSubmitted && (errors.phonePrefix || errors.phoneNumber) && (
              <p className="mt-1 text-xs text-red-500">
                {errors.phonePrefix?.message || errors.phoneNumber?.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Carrera *</label>
            <Controller
              name="careerId"
              control={control}
              render={({ field }) => (
                <Select
                  options={careerOptions.map(opt => ({ ...opt, value: String(opt.value) }))}
                  onChange={field.onChange}
                  defaultValue={String(field.value)}
                  disabled={isLoading}
                />
              )}
            />
            {isSubmitted && errors.careerId && (
              <p className="mt-1 text-xs text-red-500">{errors.careerId.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Tipo Práctica *</label>
            <Controller
              name="practiceType"
              control={control}
              render={({ field }) => (
                <Select
                  options={practiceOptions}
                  onChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!watchedCareerId || practiceOptions.length === 0}
                  placeholder={!watchedCareerId ? "Seleccione carrera primero" : "Seleccione tipo"}
                />
              )}
            />
            {isSubmitted && errors.practiceType && (
              <p className="mt-1 text-xs text-red-500">{errors.practiceType.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Región *</label>
            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <Select
                  options={REGION_OPTIONS}
                  onChange={field.onChange}
                  defaultValue={field.value}
                  placeholder="Seleccione región"
                />
              )}
            />
            {isSubmitted && errors.region && (
              <p className="mt-1 text-xs text-red-500">{errors.region.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Núcleo *</label>
            <Controller
              name="nucleus"
              control={control}
              render={({ field }) => (
                <Select
                  options={NUCLEUS_OPTIONS}
                  onChange={field.onChange}
                  defaultValue={field.value}
                  placeholder="Seleccione núcleo"
                />
              )}
            />
            {isSubmitted && errors.nucleus && (
              <p className="mt-1 text-xs text-red-500">{errors.nucleus.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Extensión *</label>
            <Controller
              name="extension"
              control={control}
              render={({ field }) => (
                <Select
                  options={EXTENSION_OPTIONS}
                  onChange={field.onChange}
                  defaultValue={field.value}
                  placeholder="Seleccione extensión"
                />
              )}
            />
            {isSubmitted && errors.extension && (
              <p className="mt-1 text-xs text-red-500">{errors.extension.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Tipo Institución *</label>
            <Controller
              name="institutionType"
              control={control}
              render={({ field }) => (
                <Select
                  options={INSTITUTION_TYPE_OPTIONS}
                  onChange={field.onChange}
                  defaultValue={field.value}
                  placeholder="Seleccione tipo"
                />
              )}
            />
            {isSubmitted && errors.institutionType && (
              <p className="mt-1 text-xs text-red-500">{errors.institutionType.message}</p>
            )}
          </div>
          
          {/* Botón oculto para permitir submit con Enter */}
          <button type="submit" className="hidden" />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={handleCloseAttempt} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit(onSubmit)} loading={isLoading}>
          {editingInst ? "Guardar Cambios" : "Registrar Institución"}
        </Button>
      </ModalFooter>
    </Modal>

    <UnifiedDialog
      isOpen={showConfirmation}
      onClose={cancelClose}
      onConfirm={confirmClose}
      variant="warning"
      title="Cambios no guardados"
      message="¿Estás seguro de que deseas cerrar? Los cambios no guardados se perderán."
      confirmLabel="Cerrar sin guardar"
      cancelLabel="Continuar editando"
    />
  </>
);
}
