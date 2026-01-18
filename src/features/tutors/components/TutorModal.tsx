import { useEffect, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Tutor } from "../types";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import CustomSelect from "../../../components/form/CustomSelect";
import MultiSelect from "../../../components/form/MultiSelect";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";

interface TutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tutor: Omit<Tutor, "tutorId" | "registrationDate">) => void;
  editingTutor?: Tutor | null;
  isLoading?: boolean;
}

const tutorSchema = z.object({
  identificationPrefix: z.string().min(1, "Seleccione un prefijo"),
  identificationNumber: z.string()
    .min(1, "La cédula es obligatoria")
    .regex(/^\d+$/, "Solo se admiten números"),
  firstName: z.string()
    .min(1, "El primer nombre es obligatorio")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se admiten letras"),
  middleName: z.string()
    .optional()
    .refine(val => !val || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val), "Solo se admiten letras"),
  lastName: z.string()
    .min(1, "El primer apellido es obligatorio")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se admiten letras"),
  secondLastName: z.string()
    .optional()
    .refine(val => !val || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val), "Solo se admiten letras"),
  sex: z.string().min(1, "Seleccione el sexo"),
  phoneAreaCode: z.string().min(1, "El código de área es obligatorio"),
  phoneNumber: z.string()
    .min(1, "El teléfono es obligatorio")
    .regex(/^\d+$/, "Solo se admiten números"),
  email: z.string().email("Email inválido").min(1, "El email es obligatorio"),
  condition: z.string().min(1, "La condición es obligatoria"),
  dedication: z.string().min(1, "La dedicación es obligatoria"),
  category: z.string().min(1, "La categoría es obligatoria"),
  profession: z.string().min(1, "La profesión es obligatoria"),
  carreras: z.array(z.string()).min(1, "Debe seleccionar al menos una carrera"),
}).refine((data) => {
  const selectedOptions = CARRERA_OPTIONS.filter(opt => data.carreras.includes(opt.value));
  const types = new Set(selectedOptions.map(opt => opt.type));
  return types.size <= 1;
}, {
  message: "No se pueden mezclar carreras de Ingeniería y Enfermería",
  path: ["carreras"],
});

type TutorFormData = z.infer<typeof tutorSchema>;

const CARRERA_OPTIONS = [
  { value: "ING_SISTEMAS", label: "Ingeniería en Sistemas", type: "ingenieria" },
  { value: "ING_CIVIL", label: "Ingeniería Civil", type: "ingenieria" },
  { value: "ING_ELECTRICA", label: "Ingeniería Eléctrica", type: "ingenieria" },
  { value: "ENF_GENERAL", label: "Enfermería General", type: "enfermeria" },
  { value: "ENF_OBSTETRICA", label: "Enfermería Obstétrica", type: "enfermeria" },
  { value: "ENF_PEDIATRICA", label: "Enfermería Pediátrica", type: "enfermeria" },
];

const PROFESSION_OPTIONS = [
  { value: "INGENIERO EN SISTEMAS", label: "INGENIERO EN SISTEMAS" },
  { value: "LICENCIADO EN EDUCACIÓN", label: "LICENCIADO EN EDUCACIÓN" },
  { value: "ABOGADO", label: "ABOGADO" },
  { value: "MÉDICO", label: "MÉDICO" },
  { value: "CONTADOR PÚBLICO", label: "CONTADOR PÚBLICO" },
];

const CONDITION_OPTIONS = [
  { value: "CONTRATADO", label: "CONTRATADO" },
  { value: "ORDINARIO", label: "ORDINARIO" },
  { value: "JUBILADO", label: "JUBILADO" },
];

const DEDICATION_OPTIONS = [
  { value: "TIEMPO COMPLETO", label: "TIEMPO COMPLETO" },
  { value: "MEDIO TIEMPO", label: "MEDIO TIEMPO" },
  { value: "TIEMPO PARCIAL", label: "TIEMPO PARCIAL" },
  { value: "DEDICACIÓN EXCLUSIVA", label: "DEDICACIÓN EXCLUSIVA" },
];

const CATEGORY_OPTIONS = [
  { value: "INSTRUCTOR", label: "INSTRUCTOR" },
  { value: "ASISTENTE", label: "ASISTENTE" },
  { value: "AGREGADO", label: "AGREGADO" },
  { value: "ASOCIADO", label: "ASOCIADO" },
  { value: "TITULAR", label: "TITULAR" },
];

const PHONE_AREA_CODES = [
  { value: "0412", label: "0412" },
  { value: "0414", label: "0414" },
  { value: "0424", label: "0424" },
  { value: "0416", label: "0416" },
  { value: "0426", label: "0426" },
  { value: "0212", label: "0212" },
];

export default function TutorModal({
  isOpen,
  onClose,
  onSave,
  editingTutor,
  isLoading = false,
}: TutorModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitted, isDirty },
  } = useForm<TutorFormData>({
    resolver: zodResolver(tutorSchema),
    mode: "onChange",
    defaultValues: {
      identificationPrefix: "",
      identificationNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      secondLastName: "",
      sex: "",
      phoneAreaCode: "",
      phoneNumber: "",
      email: "",
      condition: "",
      dedication: "",
      category: "",
      profession: "",
      carreras: [],
    },
  });

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  const watchedCarreras = useWatch({ control, name: "carreras" });

  const filteredCarreraOptions = useMemo(() => {
    const selectedCarreras = watchedCarreras || [];
    // Si no hay nada seleccionado, mostramos todas
    if (selectedCarreras.length === 0) {
      return CARRERA_OPTIONS.map((opt) => ({
        value: opt.value,
        text: opt.label,
      }));
    }

    // Identificar el tipo del primer elemento seleccionado
    const firstSelected = CARRERA_OPTIONS.find(
      (opt) => opt.value === selectedCarreras[0]
    );
    const selectedType = firstSelected?.type;

    // Filtrar opciones que coincidan con el tipo seleccionado
    return CARRERA_OPTIONS.filter((opt) => opt.type === selectedType).map(
      (opt) => ({
        value: opt.value,
        text: opt.label,
      })
    );
  }, [watchedCarreras]);

  useEffect(() => {
    if (isOpen) {
      if (editingTutor) {
        const areaCode = editingTutor.phone.substring(0, 4);
        const number = editingTutor.phone.substring(4);
        reset({
          identificationPrefix: editingTutor.identificationPrefix,
          identificationNumber: editingTutor.identificationNumber,
          firstName: editingTutor.firstName,
          middleName: editingTutor.middleName || "",
          lastName: editingTutor.lastName,
          secondLastName: editingTutor.secondLastName || "",
          sex: editingTutor.sex,
          phoneAreaCode: areaCode,
          phoneNumber: number,
          email: editingTutor.email,
          condition: editingTutor.condition,
          dedication: editingTutor.dedication,
          category: editingTutor.category,
          profession: editingTutor.profession,
          carreras: editingTutor.carreras || [],
        });
      } else {
        reset({
          identificationPrefix: "",
          identificationNumber: "",
          firstName: "",
          middleName: "",
          lastName: "",
          secondLastName: "",
          sex: "",
          phoneAreaCode: "",
          phoneNumber: "",
          email: "",
          condition: "",
          dedication: "",
          category: "",
          profession: "",
          carreras: [],
        });
      }
    }
  }, [isOpen, editingTutor, reset]);

  const onSubmit = (data: TutorFormData) => {
    onSave({
      ...data,
      identificationPrefix: data.identificationPrefix as "V" | "E",
      sex: data.sex as "FEMENINO" | "MASCULINO" | "OTRO",
      phone: `${data.phoneAreaCode}${data.phoneNumber}`,
      status: editingTutor?.status ?? true,
      carreras: data.carreras,
    });
    onClose();
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        onCloseAttempt={handleCloseAttempt} 
        showCloseButton 
        className="max-w-[95%] sm:max-w-[85%] md:max-w-[70%] lg:max-w-4xl"
      >
        <ModalHeader>
          <h5 className="text-xl font-semibold text-text-primary dark:text-white/90">
            {editingTutor ? "Editar Tutor" : "Registrar Tutor"}
          </h5>
          <p className="text-sm text-text-secondary">Complete la información del tutor académico.</p>
        </ModalHeader>

      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form id="tutor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {/* Fila 1 */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Cédula *</label>
              <div className="flex gap-2">
                <div className="w-24">
                  <Controller
                    name="identificationPrefix"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="identificationPrefix"
                        options={[
                          { value: "V", label: "V" },
                          { value: "E", label: "E" },
                          { value: "P", label: "P", disabled: true, disabledReason: "Pasaportes no habilitados temporalmente" },
                        ]}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value}
                        placeholder="Tipo"
                        disabled={!!editingTutor}
                        error={!!errors.identificationPrefix}
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    {...register("identificationNumber")}
                    placeholder="Número de cédula"
                    error={!!errors.identificationNumber}
                  />
                </div>
              </div>
              {isSubmitted && errors.identificationNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.identificationNumber.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Primer Nombre *</label>
              <Input
                {...register("firstName")}
                placeholder="Ingrese el primer nombre del tutor"
                error={!!errors.firstName}
                hint={isSubmitted ? errors.firstName?.message : undefined}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Segundo Nombre</label>
              <Input
                {...register("middleName")}
                placeholder="Ingrese el segundo nombre del tutor (si posee)"
              />
            </div>

            {/* Fila 2 */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Primer Apellido *</label>
              <Input
                {...register("lastName")}
                placeholder="Ingrese el primer apellido del tutor"
                error={!!errors.lastName}
                hint={isSubmitted ? errors.lastName?.message : undefined}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Segundo Apellido</label>
              <Input
                {...register("secondLastName")}
                placeholder="Ingrese el segundo apellido del tutor (si posee)"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Sexo *</label>
              <Controller
                name="sex"
                control={control}
                render={({ field }) => (
                  <Select
                    options={[
                      { value: "FEMENINO", label: "FEMENINO" },
                      { value: "MASCULINO", label: "MASCULINO" },
                      { value: "OTRO", label: "OTRO" },
                    ]}
                    onChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="Seleccione Sexo"
                  />
                )}
              />
              {isSubmitted && errors.sex && (
                <p className="mt-1 text-xs text-red-500">{errors.sex.message}</p>
              )}
            </div>

            {/* Fila 3 */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Teléfono *</label>
              <div className="flex gap-2">
                <div className="w-28">
                  <Controller
                    name="phoneAreaCode"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={PHONE_AREA_CODES}
                        onChange={field.onChange}
                        defaultValue={field.value}
                        placeholder="Seleccione Código"
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    {...register("phoneNumber")}
                    placeholder="Ingrese el número"
                    error={!!errors.phoneNumber}
                  />
                </div>
              </div>
              {isSubmitted && (errors.phoneAreaCode || errors.phoneNumber) && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.phoneAreaCode?.message || errors.phoneNumber?.message}
                </p>
              )}
            </div>
            <div className="lg:col-span-2">
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Correo Electrónico *</label>
              <Input
                {...register("email")}
                placeholder="Ingrese el correo institucional o personal"
                error={!!errors.email}
                hint={isSubmitted ? errors.email?.message : undefined}
              />
            </div>

            {/* Fila 4 */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Condición *</label>
              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <Select
                    options={CONDITION_OPTIONS}
                    onChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="Seleccione Condición"
                  />
                )}
              />
              {isSubmitted && errors.condition && (
                <p className="mt-1 text-xs text-red-500">{errors.condition.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Dedicación *</label>
              <Controller
                name="dedication"
                control={control}
                render={({ field }) => (
                  <Select
                    options={DEDICATION_OPTIONS}
                    onChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="Seleccione Dedicación"
                  />
                )}
              />
              {isSubmitted && errors.dedication && (
                <p className="mt-1 text-xs text-red-500">{errors.dedication.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Categoría *</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    options={CATEGORY_OPTIONS}
                    onChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="Seleccione Categoría"
                  />
                )}
              />
              {isSubmitted && errors.category && (
                <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Fila 5 */}
            <div className="lg:col-span-1">
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Profesión *</label>
              <Controller
                name="profession"
                control={control}
                render={({ field }) => (
                  <Select
                    options={PROFESSION_OPTIONS}
                    onChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="Seleccione Profesión"
                  />
                )}
              />
              {isSubmitted && errors.profession && (
                <p className="mt-1 text-xs text-red-500">{errors.profession.message}</p>
              )}
            </div>
            <div className="lg:col-span-2">
              {/* <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Carreras que Atiende *</label> */}
              <Controller
                name="carreras"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    label="Carreras que Atiende *"
                    options={filteredCarreraOptions}
                    onChange={field.onChange}
                    value={field.value}
                    placeholder="Seleccione las carreras..."
                  />
                )}
              />
              {isSubmitted && errors.carreras && (
                <p className="mt-1 text-xs text-red-500">{errors.carreras.message}</p>
              )}
            </div>
          </div>
        </form>
      </ModalBody>

      <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-6xl mx-auto">
          <Button variant="outline" onClick={handleCloseAttempt} disabled={isLoading} className="w-full sm:w-auto min-h-12">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="tutor-form"
            loading={isLoading}
            className="w-full sm:w-auto min-h-12"
          >
            {editingTutor ? "Actualizar Registro" : "Guardar Tutor"}
          </Button>
        </div>
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
