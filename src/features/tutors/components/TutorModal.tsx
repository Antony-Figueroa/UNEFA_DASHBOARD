import { useEffect, useState, useMemo } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Tutor } from "../types";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import MultiSelect from "../../../components/form/MultiSelect";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { getCareers } from "../../careers/services/careersService";
import { Career } from "../../careers/types";
import { useLists } from "../../lists/hooks/useLists";

interface TutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tutor: Omit<Tutor, "tutorId" | "registrationDate">) => void;
  editingTutor?: Tutor | null;
  isLoading?: boolean;
  tutors?: Tutor[];
}

export default function TutorModal({
  isOpen,
  onClose,
  onSave,
  editingTutor,
  isLoading = false,
  tutors = [],
}: TutorModalProps) {
  const [careers, setCareers] = useState<Career[]>([]);
  const [careersLoading, setCareersLoading] = useState(false);
  const { fetchMultipleLists } = useLists();
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});

  // Fallbacks for when t_list data is not available
  const NATIONALITY_OPTIONS = options["Nacionalidad"] || [
    { value: "V", label: "V" },
    { value: "E", label: "E" },
  ];

  const SEX_OPTIONS = options["Sexo"] || [
    { value: "FEMENINO", label: "FEMENINO" },
    { value: "MASCULINO", label: "MASCULINO" },
  ];

  const PHONE_AREA_OPTIONS = options["CODIGOS_AREA"] || [
    { value: "0412", label: "0412" },
    { value: "0414", label: "0414" },
    { value: "0424", label: "0424" },
    { value: "0416", label: "0416" },
    { value: "0426", label: "0426" },
    { value: "0212", label: "0212" },
  ];

  const CONDITION_OPTIONS = options["Condición"] || [
    { value: "ORDINARIO", label: "ORDINARIO" },
    { value: "CONTRATADO", label: "CONTRATADO" },
  ];

  const DEDICATION_OPTIONS = options["Dedicación"] || [
    { value: "TIEMPO COMPLETO", label: "TIEMPO COMPLETO" },
    { value: "MEDIO TIEMPO", label: "MEDIO TIEMPO" },
    { value: "TIEMPO CONVENCIONAL", label: "TIEMPO CONVENCIONAL" },
    { value: "DEDICACIÓN EXCLUSIVA", label: "DEDICACIÓN EXCLUSIVA" },
  ];

  const CATEGORY_OPTIONS = options["Categoría"] || [
    { value: "INSTRUCTOR", label: "INSTRUCTOR" },
    { value: "ASISTENTE", label: "ASISTENTE" },
    { value: "AGREGADO", label: "AGREGADO" },
    { value: "ASOCIADO", label: "ASOCIADO" },
    { value: "TITULAR", label: "TITULAR" },
  ];

  const PROFESSION_OPTIONS = options["Profesión"] || [
    { value: "INGENIERO", label: "INGENIERO" },
    { value: "LICENCIADO", label: "LICENCIADO" },
    { value: "ABOGADO", label: "ABOGADO" },
    { value: "MÉDICO", label: "MÉDICO" },
  ];

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const listNames = [
          "Nacionalidad",
          "Sexo",
          "CODIGOS_AREA",
          "Condición",
          "Dedicación",
          "Categoría",
          "Profesión",
          "Tipo de Practica"
        ];
        const data = await fetchMultipleLists(listNames);
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};
        
        Object.entries(data).forEach(([key, values]) => {
          mappedOptions[key] = values.map(v => ({
            // Para Nacionalidad usamos la abreviación (V, E) como valor y etiqueta
            value: (key === "Nacionalidad" && v.abbreviation) ? v.abbreviation.toUpperCase() : v.name.toUpperCase(),
            label: (key === "Nacionalidad" && v.abbreviation) ? v.abbreviation.toUpperCase() : v.name.toUpperCase()
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

  const tutorSchema = useMemo(() => z.object({
    identificationPrefix: z.string().min(1, "Seleccione el tipo"),
    identificationNumber: z.string()
      .min(6, "La cédula debe tener al menos 6 dígitos")
      .max(8, "La cédula no puede exceder los 8 dígitos")
      .regex(/^\d+$/, "Solo se admiten números"),
    firstName: z.string()
      .min(1, "El primer nombre es obligatorio")
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se admiten letras y signos diacríticos")
      .transform(val => val.toUpperCase()),
    middleName: z.string()
      .transform(val => val.toUpperCase())
      .refine(val => !val || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val), "Solo se admiten letras y signos diacríticos")
      .optional(),
    lastName: z.string()
      .min(1, "El primer apellido es obligatorio")
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se admiten letras y signos diacríticos")
      .transform(val => val.toUpperCase()),
    secondLastName: z.string()
      .transform(val => val.toUpperCase())
      .refine(val => !val || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val), "Solo se admiten letras y signos diacríticos")
      .optional(),
    sex: z.string().min(1, "Seleccione el sexo"),
    phoneAreaCode: z.string().min(1, "El código de área es obligatorio"),
    phoneNumber: z.string()
      .length(7, "El número de teléfono debe tener exactamente 7 dígitos")
      .regex(/^\d+$/, "Solo se admiten números"),
    email: z.string().email("Formato de correo electrónico inválido").min(1, "El correo es obligatorio").transform(val => val.toUpperCase()),
    condition: z.string().min(1, "La condición es obligatoria").transform(val => val.toUpperCase()),
    dedication: z.string().min(1, "La dedicación es obligatoria").transform(val => val.toUpperCase()),
    category: z.string().min(1, "La categoría es obligatoria").transform(val => val.toUpperCase()),
    profession: z.string().min(1, "La profesión es obligatoria").transform(val => val.toUpperCase()),
    carreras: z.array(z.string()).min(1, "Debe seleccionar al menos una carrera"),
  }).superRefine((data, ctx) => {
    // Validar duplicidad de cédula
    const isIdDuplicate = tutors.some(
      t => t.tutorId !== editingTutor?.tutorId && 
           t.identificationNumber === data.identificationNumber && 
           t.identificationPrefix === data.identificationPrefix
    );

    if (isIdDuplicate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Esta cédula ya se encuentra registrada",
        path: ["identificationNumber"],
      });
    }

    // Validar duplicidad de correo
    const isEmailDuplicate = tutors.some(
      t => t.tutorId !== editingTutor?.tutorId && 
           t.email.toLowerCase() === data.email.toLowerCase()
    );

    if (isEmailDuplicate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Este correo electrónico ya está en uso",
        path: ["email"],
      });
    }
  }), [tutors, editingTutor]);

  type TutorFormData = z.infer<typeof tutorSchema>;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
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

  useEffect(() => {
    const fetchCareers = async () => {
      setCareersLoading(true);
      try {
        const data = await getCareers();
        setCareers(data.filter(c => c.status));
      } catch (error) {
        console.error("Error fetching careers:", error);
      } finally {
        setCareersLoading(false);
      }
    };
    if (isOpen) {
      fetchCareers();
    }
  }, [isOpen]);

  const careerOptions = useMemo(() => {
    return careers.map(c => ({
      value: String(c.careerId),
      text: `${c.careerCode} - ${c.careerName}`
    }));
  }, [careers]);

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

  const onSubmit: SubmitHandler<TutorFormData> = (data) => {
    onSave({
      identificationPrefix: data.identificationPrefix as "V" | "E",
      identificationNumber: data.identificationNumber,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      secondLastName: data.secondLastName,
      sex: data.sex as "FEMENINO" | "MASCULINO",
      phone: `${data.phoneAreaCode}${data.phoneNumber}`,
      email: data.email,
      condition: data.condition,
      dedication: data.dedication,
      category: data.category,
      profession: data.profession,
      status: editingTutor?.status ?? true,
      carreras: data.carreras,
    });
  };

  const isInUse = editingTutor?.isInUse;

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
          {isInUse && (
            <div className="mt-2 text-xs font-medium text-warning-700 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 p-2.5 rounded-md border border-warning-200 dark:border-warning-800/50 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>Nota: Algunos campos están restringidos porque el tutor tiene registros asociados en el sistema.</span>
            </div>
          )}
        </ModalHeader>

      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form id="tutor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {/* Cédula */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Cédula *</label>
              <div className="flex gap-2">
                <div className="w-24">
                  <Controller
                    name="identificationPrefix"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={NATIONALITY_OPTIONS}
                        placeholder="Tipo"
                        disabled={isInUse}
                        error={!!errors.identificationPrefix}
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    {...register("identificationNumber")}
                    placeholder="INGRESE CÉDULA"
                    error={!!errors.identificationNumber}
                    disabled={isInUse}
                    maxLength={8}
                  />
                </div>
              </div>
              {(errors.identificationPrefix || errors.identificationNumber) && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.identificationPrefix?.message || errors.identificationNumber?.message}
                </p>
              )}
            </div>

            {/* Primer Nombre */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Primer Nombre *</label>
              <Input
                {...register("firstName")}
                placeholder="INGRESE PRIMER NOMBRE"
                error={!!errors.firstName}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  register("firstName").onChange(e);
                }}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            {/* Segundo Nombre */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Segundo Nombre</label>
              <Input
                {...register("middleName")}
                placeholder="INGRESE SEGUNDO NOMBRE"
                error={!!errors.middleName}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  register("middleName").onChange(e);
                }}
              />
              {errors.middleName && (
                <p className="mt-1 text-xs text-red-500">{errors.middleName.message}</p>
              )}
            </div>

            {/* Primer Apellido */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Primer Apellido *</label>
              <Input
                {...register("lastName")}
                placeholder="INGRESE PRIMER APELLIDO"
                error={!!errors.lastName}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  register("lastName").onChange(e);
                }}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
              )}
            </div>

            {/* Segundo Apellido */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Segundo Apellido</label>
              <Input
                {...register("secondLastName")}
                placeholder="INGRESE SEGUNDO APELLIDO"
                error={!!errors.secondLastName}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  register("secondLastName").onChange(e);
                }}
              />
              {errors.secondLastName && (
                <p className="mt-1 text-xs text-red-500">{errors.secondLastName.message}</p>
              )}
            </div>

            {/* Sexo */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Sexo *</label>
              <Controller
                name="sex"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={SEX_OPTIONS}
                    placeholder="Seleccione Sexo"
                    error={!!errors.sex}
                  />
                )}
              />
              {errors.sex && (
                <p className="mt-1 text-xs text-red-500">{errors.sex.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Teléfono *</label>
              <div className="flex gap-2">
                <div className="w-28">
                  <Controller
                    name="phoneAreaCode"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={PHONE_AREA_OPTIONS}
                        placeholder="Prefijo"
                        error={!!errors.phoneAreaCode}
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    {...register("phoneNumber")}
                    placeholder="INGRESE TELÉFONO"
                    error={!!errors.phoneNumber}
                    maxLength={7}
                  />
                </div>
              </div>
              {(errors.phoneAreaCode || errors.phoneNumber) && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.phoneAreaCode?.message || errors.phoneNumber?.message}
                </p>
              )}
            </div>

            {/* Correo */}
            <div className="lg:col-span-2">
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Correo Electrónico *</label>
              <Input
                {...register("email")}
                placeholder="INGRESE CORREO ELECTRÓNICO"
                type="email"
                error={!!errors.email}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Condición */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Condición *</label>
              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={CONDITION_OPTIONS}
                    placeholder="Seleccione Condición"
                    error={!!errors.condition}
                  />
                )}
              />
              {errors.condition && (
                <p className="mt-1 text-xs text-red-500">{errors.condition.message}</p>
              )}
            </div>

            {/* Dedicación */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Dedicación *</label>
              <Controller
                name="dedication"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={DEDICATION_OPTIONS}
                    placeholder="Seleccione Dedicación"
                    error={!!errors.dedication}
                  />
                )}
              />
              {errors.dedication && (
                <p className="mt-1 text-xs text-red-500">{errors.dedication.message}</p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Categoría *</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={CATEGORY_OPTIONS}
                    placeholder="Seleccione Categoría"
                    error={!!errors.category}
                  />
                )}
              />
              {errors.category && (
                <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Profesión */}
            <div className="lg:col-span-1">
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Profesión *</label>
              <Controller
                name="profession"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={PROFESSION_OPTIONS}
                    placeholder="Seleccione Profesión"
                    error={!!errors.profession}
                  />
                )}
              />
              {errors.profession && (
                <p className="mt-1 text-xs text-red-500">{errors.profession.message}</p>
              )}
            </div>

            {/* Carreras */}
            <div className="lg:col-span-3">
              <Controller
                name="carreras"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    {...field}
                    label="Carreras que Atiende *"
                    placeholder={careersLoading ? "Cargando carreras..." : (isInUse ? "Carreras asignadas (no editable)" : "Seleccione las carreras...")}
                    options={careerOptions}
                    disabled={careersLoading || isInUse}
                  />
                )}
              />
              {errors.carreras && (
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