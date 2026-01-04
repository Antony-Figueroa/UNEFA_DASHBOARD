import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Tutor } from "../types";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";

interface TutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tutor: Omit<Tutor, "tutorId" | "registrationDate">) => void;
  editingTutor?: Tutor | null;
  isLoading?: boolean;
}

const tutorSchema = z.object({
  identificationPrefix: z.enum(["V", "E"]),
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
  sex: z.enum(["FEMENINO", "MASCULINO", "OTRO"]),
  phoneAreaCode: z.string().min(1, "El código de área es obligatorio"),
  phoneNumber: z.string()
    .min(1, "El teléfono es obligatorio")
    .regex(/^\d+$/, "Solo se admiten números"),
  email: z.string().email("Email inválido").min(1, "El email es obligatorio"),
  condition: z.string().min(1, "La condición es obligatoria"),
  dedication: z.string().min(1, "La dedicación es obligatoria"),
  category: z.string().min(1, "La categoría es obligatoria"),
  profession: z.string().min(1, "La profesión es obligatoria"),
});

type TutorFormData = z.infer<typeof tutorSchema>;

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
    formState: { errors, isSubmitted },
  } = useForm<TutorFormData>({
    resolver: zodResolver(tutorSchema),
    mode: "onChange",
    defaultValues: {
      identificationPrefix: "V",
      identificationNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      secondLastName: "",
      sex: "FEMENINO",
      phoneAreaCode: "0412",
      phoneNumber: "",
      email: "",
      condition: "CONTRATADO",
      dedication: "TIEMPO COMPLETO",
      category: "INSTRUCTOR",
      profession: "INGENIERO EN SISTEMAS",
    },
  });

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
        });
      } else {
        reset({
          identificationPrefix: "V",
          identificationNumber: "",
          firstName: "",
          middleName: "",
          lastName: "",
          secondLastName: "",
          sex: "FEMENINO",
          phoneAreaCode: "0412",
          phoneNumber: "",
          email: "",
          condition: "CONTRATADO",
          dedication: "TIEMPO COMPLETO",
          category: "INSTRUCTOR",
          profession: "INGENIERO EN SISTEMAS",
        });
      }
    }
  }, [isOpen, editingTutor, reset]);

  const onSubmit = (data: TutorFormData) => {
    onSave({
      ...data,
      phone: `${data.phoneAreaCode}${data.phoneNumber}`,
      status: editingTutor?.status ?? true,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton>
      <ModalHeader>
        <div className="max-w-4xl mx-auto w-full">
          <h5 className="mb-1 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {editingTutor ? "Editar Tutor" : "Registrar Tutor"}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
            {editingTutor ? "Modifica los detalles del tutor." : "Ingresa los detalles del nuevo tutor."}
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="bg-gray-50/30 dark:bg-gray-900/50">
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
                      <Select
                        options={[
                          { value: "V", label: "V-" },
                          { value: "E", label: "E-" },
                        ]}
                        onChange={field.onChange}
                        defaultValue={field.value}
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
                    placeholder="Seleccione el sexo"
                    onChange={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
            </div>

            {/* Fila 3 */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Teléfono *</label>
              <div className="flex gap-2">
                <div className="w-24">
                  <Controller
                    name="phoneAreaCode"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={PHONE_AREA_CODES}
                        onChange={field.onChange}
                        defaultValue={field.value}
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    {...register("phoneNumber")}
                    placeholder="Ingrese el número telefónico (ej: 1234567)"
                    error={!!errors.phoneNumber}
                  />
                </div>
              </div>
              {isSubmitted && errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.phoneNumber.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Correo Electrónico *</label>
              <Input
                {...register("email")}
                type="email"
                placeholder="Ingrese el correo institucional o personal (ej: usuario@correo.com)"
                error={!!errors.email}
                hint={isSubmitted ? errors.email?.message : undefined}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Condición *</label>
              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <Select
                    options={CONDITION_OPTIONS}
                    placeholder="Seleccione la condición"
                    onChange={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
            </div>

            {/* Fila 4 */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Dedicación *</label>
              <Controller
                name="dedication"
                control={control}
                render={({ field }) => (
                  <Select
                    options={DEDICATION_OPTIONS}
                    placeholder="Seleccione la dedicación"
                    onChange={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Categoría *</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    options={CATEGORY_OPTIONS}
                    placeholder="Seleccione la categoría"
                    onChange={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Profesión *</label>
              <Controller
                name="profession"
                control={control}
                render={({ field }) => (
                  <Select
                    options={PROFESSION_OPTIONS}
                    placeholder="Seleccione la profesión"
                    onChange={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
            </div>
          </div>
        </form>
      </ModalBody>

      <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-6xl mx-auto">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto min-h-12">
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
  );
}
