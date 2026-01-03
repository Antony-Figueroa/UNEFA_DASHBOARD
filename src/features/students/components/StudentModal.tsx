import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Student } from "../types";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import FlatpickrDatePicker from "../../../components/form/FlatpickrDatePicker";

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Omit<Student, "studentId" | "enrollmentDate">) => void;
  editingStudent?: Student | null;
  careerOptions: { value: string; label: string }[];
}

const studentSchema = z.object({
  identificationPrefix: z.enum(["V", "E", "J", "P"]),
  identificationNumber: z.string()
    .min(1, "La identificación es obligatoria")
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
  birthDate: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  civilStatus: z.enum(["SOLTERO", "CASADO", "DIVORCIADO", "VIUDO"]),
  phone: z.string()
    .min(1, "El teléfono es obligatorio")
    .regex(/^\d+$/, "Solo se admiten números"),
  email: z.string().email("Email inválido").min(1, "El email es obligatorio"),
  careerId: z.string().min(1, "La carrera es obligatoria"),
  semester: z.string()
    .min(1, "El semestre es obligatorio")
    .regex(/^\d+$/, "Solo se admiten números"),
  section: z.string()
    .min(1, "La sección es obligatoria")
    .regex(/^\d+$/, "Solo se admiten números"),
  regime: z.enum(["DIURNO", "NOCTURNO", "MIXTO"]),
  studentType: z.enum(["CIVIL", "MILITAR"]),
  militaryRank: z.string().min(1, "El rango militar es obligatorio"),
  works: z.enum(["SI", "NO"]),
});

type StudentFormData = z.infer<typeof studentSchema>;

export default function StudentModal({
  isOpen,
  onClose,
  onSave,
  editingStudent,
  careerOptions,
}: StudentModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      identificationPrefix: "V",
      identificationNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      secondLastName: "",
      sex: "FEMENINO",
      birthDate: "",
      civilStatus: "SOLTERO",
      phone: "",
      email: "",
      careerId: "",
      semester: "",
      section: "",
      regime: "DIURNO",
      studentType: "CIVIL",
      militaryRank: "NO APLICA",
      works: "NO",
    },
  });

  const studentType = watch("studentType");

  useEffect(() => {
    if (studentType === "CIVIL") {
      setValue("militaryRank", "NO APLICA");
    }
  }, [studentType, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (editingStudent) {
        reset({
          identificationPrefix: editingStudent.identificationPrefix,
          identificationNumber: editingStudent.identificationNumber,
          firstName: editingStudent.firstName,
          middleName: editingStudent.middleName || "",
          lastName: editingStudent.lastName,
          secondLastName: editingStudent.secondLastName || "",
          sex: editingStudent.sex,
          birthDate: editingStudent.birthDate,
          civilStatus: editingStudent.civilStatus,
          phone: editingStudent.phone,
          email: editingStudent.email,
          careerId: editingStudent.careerId,
          semester: editingStudent.semester,
          section: editingStudent.section,
          regime: editingStudent.regime,
          studentType: editingStudent.studentType,
          militaryRank: editingStudent.militaryRank,
          works: editingStudent.works,
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
          birthDate: "",
          civilStatus: "SOLTERO",
          phone: "",
          email: "",
          careerId: "",
          semester: "",
          section: "",
          regime: "DIURNO",
          studentType: "CIVIL",
          militaryRank: "NO APLICA",
          works: "NO",
        });
      }
    }
  }, [isOpen, editingStudent, reset]);

  const onSubmit = (data: StudentFormData) => {
    onSave({
      ...data,
      status: editingStudent?.status ?? true,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton>
      <ModalHeader>
        <div className="max-w-4xl mx-auto w-full">
          <h5 className="mb-1 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {editingStudent ? "Editar Estudiante" : "Registrar Estudiante"}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
            {editingStudent ? "Modifica los detalles del estudiante." : "Ingresa los detalles del nuevo estudiante."}
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="bg-gray-50/30 dark:bg-gray-900/50">
        <form id="student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
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
                          { value: "J", label: "J-" },
                          { value: "P", label: "P-" },
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
                    placeholder="Ingrese el número de cédula"
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
                placeholder="Ingrese el primer nombre del estudiante"
                error={!!errors.firstName}
                hint={isSubmitted ? errors.firstName?.message : undefined}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Segundo Nombre</label>
              <Input
                {...register("middleName")}
                placeholder="Ingrese el segundo nombre del estudiante (si posee)"
              />
            </div>

            {/* Fila 2 */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Primer Apellido *</label>
              <Input
                {...register("lastName")}
                placeholder="Ingrese el primer apellido del estudiante"
                error={!!errors.lastName}
                hint={isSubmitted ? errors.lastName?.message : undefined}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Segundo Apellido</label>
              <Input
                {...register("secondLastName")}
                placeholder="Ingrese el segundo apellido del estudiante (si posee)"
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
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Fecha de Nacimiento *</label>
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <FlatpickrDatePicker
                    value={field.value}
                    onChange={(dates) => {
                      const date = dates[0];
                      if (date) {
                        // Format to YYYY-MM-DD
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        field.onChange(`${year}-${month}-${day}`);
                      } else {
                        field.onChange("");
                      }
                    }}
                    error={!!errors.birthDate}
                    placeholder="Seleccione fecha de nacimiento (DD/MM/AAAA)"
                  />
                )}
              />
              {isSubmitted && errors.birthDate && (
                <p className="mt-1 text-xs text-red-500">{errors.birthDate.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Estado Civil *</label>
              <Controller
                name="civilStatus"
                control={control}
                render={({ field }) => (
                  <Select
                    options={[
                      { value: "SOLTERO", label: "SOLTERO" },
                      { value: "CASADO", label: "CASADO" },
                      { value: "DIVORCIADO", label: "DIVORCIADO" },
                      { value: "VIUDO", label: "VIUDO" },
                    ]}
                    placeholder="Seleccione el estado civil actual"
                    onChange={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Teléfono *</label>
              <Input
                {...register("phone")}
                placeholder="Ingrese el número telefónico (ej: 04261234567)"
                error={!!errors.phone}
                hint={isSubmitted ? errors.phone?.message : undefined}
              />
            </div>

            {/* Fila 4 */}
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
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Carrera *</label>
              <Controller
                name="careerId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={careerOptions}
                    placeholder="Seleccione la carrera académica que cursa"
                    onChange={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
              {isSubmitted && errors.careerId && (
                <p className="mt-1 text-xs text-red-500">{errors.careerId.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Semestre *</label>
              <Input
                {...register("semester")}
                placeholder="Ingrese el semestre actual (ej: 04)"
                error={!!errors.semester}
                hint={isSubmitted ? errors.semester?.message : undefined}
              />
            </div>

            {/* Fila 5 */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Sección *</label>
              <Input
                {...register("section")}
                placeholder="Ingrese el código de sección (ej: 236)"
                error={!!errors.section}
                hint={isSubmitted ? errors.section?.message : undefined}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Régimen *</label>
              <Controller
                name="regime"
                control={control}
                render={({ field }) => (
                  <Select
                    options={[
                      { value: "DIURNO", label: "DIURNO" },
                      { value: "NOCTURNO", label: "NOCTURNO" },
                      { value: "MIXTO", label: "MIXTO" },
                    ]}
                    placeholder="Seleccione el régimen de estudio"
                    onChange={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Tipo Estudiante *</label>
              <Controller
                name="studentType"
                control={control}
                render={({ field }) => (
                  <Select
                    options={[
                      { value: "CIVIL", label: "CIVIL" },
                      { value: "MILITAR", label: "MILITAR" },
                    ]}
                    placeholder="Seleccione si es Civil o Militar"
                    onChange={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
            </div>

            {/* Fila 6 */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Rango Militar *</label>
              <Controller
                name="militaryRank"
                control={control}
                render={({ field }) => (
                  <Select
                    options={[
                      { value: "NO APLICA", label: "NO APLICA" },
                      { value: "SOLDADO", label: "SOLDADO" },
                      { value: "CABO", label: "CABO" },
                      { value: "SARGENTO", label: "SARGENTO" },
                    ]}
                    placeholder="Seleccione el rango militar correspondiente"
                    onChange={field.onChange}
                    defaultValue={field.value}
                    disabled={studentType === "CIVIL"}
                  />
                )}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Trabaja *</label>
              <Controller
                name="works"
                control={control}
                render={({ field }) => (
                  <Select
                    options={[
                      { value: "SI", label: "SI" },
                      { value: "NO", label: "NO" },
                    ]}
                    placeholder="Indique si el estudiante labora actualmente"
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
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto min-h-12">
            Cancelar
          </Button>
          <Button type="submit" form="student-form" className="w-full sm:w-auto min-h-12">
            {editingStudent ? "Actualizar Registro" : "Guardar Estudiante"}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
