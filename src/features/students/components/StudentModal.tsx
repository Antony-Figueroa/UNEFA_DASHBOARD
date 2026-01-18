import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkAvailability } from "../services/studentsService";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Student } from "../types";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import CustomSelect from "../../../components/form/CustomSelect";
import FlatpickrDatePicker from "../../../components/form/FlatpickrDatePicker";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useLists } from "../../lists/hooks/useLists";
import { ListValue } from "../../lists/types";
import { 
  studentSchema, 
  StudentFormInput,
  StudentFormOutput
} from "../constants/validation";

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Omit<Student, "studentId" | "enrollmentDate">) => void;
  editingStudent?: Student | null;
  careerOptions: { value: string | number; label: string }[];
  dynamicLists?: Record<string, ListValue[]>;
  isLoading?: boolean;
}

export default function StudentModal({
  isOpen,
  onClose,
  onSave,
  editingStudent,
  careerOptions,
  dynamicLists,
  isLoading = false,
}: StudentModalProps) {
  const [isCheckingCi, setIsCheckingCi] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const { fetchMultipleLists } = useLists();
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});

  useEffect(() => {
    const loadOptions = async () => {
      // Si ya tenemos las listas por prop, las usamos y evitamos la petición
      if (dynamicLists && Object.keys(dynamicLists).length > 0) {
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};
        Object.entries(dynamicLists).forEach(([key, values]) => {
          mappedOptions[key] = values.map(v => ({
            value: v.name.toUpperCase(),
            label: v.name.toUpperCase()
          }));
        });
        setOptions(mappedOptions);
        return;
      }

      try {
        const listNames = [
          "Nacionalidad",
          "Sexo",
          "CODIGOS_AREA",
          "Registro Civil",
          "Regimen/Turno",
          "Tipo de estudiante",
          "Rango Militar",
          "Trabajo"
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
        console.error("Error loading list options for StudentModal:", error);
      }
    };

    if (isOpen) {
      loadOptions();
    }
  }, [isOpen, fetchMultipleLists, dynamicLists]);

  const NATIONALITY_OPTIONS = options["Nacionalidad"] || [
    { value: "V", label: "V" },
    { value: "E", label: "E" },
  ];

  const SEX_OPTIONS = options["Sexo"] || [
    { value: "FEMENINO", label: "FEMENINO" },
    { value: "MASCULINO", label: "MASCULINO" },
  ];

  const CIVIL_STATUS_OPTIONS = options["Registro Civil"] || [
    { value: "SOLTERO/A", label: "SOLTERO/A" },
    { value: "CASADO/A", label: "CASADO/A" },
    { value: "DIVORCIADO/A", label: "DIVORCIADO/A" },
    { value: "VIUDO/A", label: "VIUDO/A" },
  ];

  const VENEZUELA_PHONE_PREFIXES = options.CODIGOS_AREA || [
    { value: "0412", label: "0412" },
    { value: "0414", label: "0414" },
    { value: "0424", label: "0424" },
    { value: "0416", label: "0416" },
    { value: "0426", label: "0426" },
    { value: "0212", label: "0212" },
  ];

  const REGIME_OPTIONS = options["Regimen/Turno"] || [
    { value: "DIURNO", label: "DIURNO" },
    { value: "NOCTURNO", label: "NOCTURNO" },
  ];

  const STUDENT_TYPE_OPTIONS = options["Tipo de estudiante"] || [
    { value: "REGULAR", label: "REGULAR" },
    { value: "NUEVO INGRESO", label: "NUEVO INGRESO" },
  ];

  const MILITARY_RANKS = options["Rango Militar"] || [
    { value: "NO APLICA", label: "NO APLICA" },
  ];

  const WORKS_OPTIONS = options["Trabajo"] || [
    { value: "SI", label: "SI" },
    { value: "NO", label: "NO" },
  ];

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isDirty, isValid },
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentSchema),
    mode: "all",
    defaultValues: editingStudent ? { ...editingStudent } : {
      identificationPrefix: "",
      identificationNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      secondLastName: "",
      sex: "",
      birthDate: "",
      civilStatus: "",
      phonePrefix: "",
      phoneNumber: "",
      email: "",
      address: "",
      careerId: "",
      semester: "",
      section: "",
      regime: "",
      studentType: "",
      militaryRank: "",
      works: "",
    },
  });

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  const studentType = watch("studentType");
  const birthDate = watch("birthDate");

  // Calcular edad basada en birthDate
  const age = useMemo(() => {
    if (!birthDate || birthDate.trim() === "") return null;
    // Usar T12:00:00 para evitar problemas de zona horaria con strings YYYY-MM-DD
    const birth = new Date(birthDate.includes('T') ? birthDate : `${birthDate}T12:00:00`);
    if (isNaN(birth.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, [birthDate]);

  // Restricción de fecha: 16 años atrás desde hoy
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 16);
    return d;
  }, []);

  useEffect(() => {
    if (studentType === "CIVIL") {
      setValue("militaryRank", "NO APLICA", { shouldValidate: true });
    } else if (studentType === "MILITAR" && watch("militaryRank") === "NO APLICA") {
      setValue("militaryRank", "", { shouldValidate: true });
    }
  }, [studentType, setValue, watch]);

  useEffect(() => {
    if (isOpen) {
      if (editingStudent) {
        // Separar prefijo y número de teléfono (ej: 04121234567)
        let phonePrefix = "";
        let phoneNumber = "";
        
        if (editingStudent.phone) {
          const cleanPhone = editingStudent.phone.replace(/[-\s]/g, '');
          if (cleanPhone.length >= 4) {
            phonePrefix = cleanPhone.substring(0, 4);
            phoneNumber = cleanPhone.substring(4);
          } else {
            phoneNumber = cleanPhone;
          }
        }
        
        reset({
          identificationPrefix: (editingStudent.identificationPrefix || "V").toUpperCase(),
          identificationNumber: editingStudent.identificationNumber || "",
          firstName: (editingStudent.firstName || "").toUpperCase(),
          middleName: (editingStudent.middleName || "").toUpperCase(),
          lastName: (editingStudent.lastName || "").toUpperCase(),
          secondLastName: (editingStudent.secondLastName || "").toUpperCase(),
          sex: (editingStudent.sex || "").toUpperCase(),
          birthDate: editingStudent.birthDate || "",
          civilStatus: (editingStudent.civilStatus || "").toUpperCase(),
          phonePrefix: phonePrefix,
          phoneNumber: phoneNumber,
          email: (editingStudent.email || "").toUpperCase(),
          address: (editingStudent.address || "").toUpperCase(),
          careerId: String(editingStudent.careerId || ""),
          semester: editingStudent.semester || "",
          section: editingStudent.section || "",
          regime: (editingStudent.regime || "").toUpperCase(),
          studentType: (editingStudent.studentType || "").toUpperCase(),
          militaryRank: (editingStudent.militaryRank || "").toUpperCase(),
          works: (editingStudent.works || "").toUpperCase(),
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
          birthDate: "",
          civilStatus: "",
          phonePrefix: "",
          phoneNumber: "",
          email: "",
          address: "",
          careerId: "",
          semester: "",
          section: "",
          regime: "",
          studentType: "",
          militaryRank: "",
          works: "",
        });
      }
    }
  }, [isOpen, editingStudent, reset]);

  const onSubmit = async (data: StudentFormInput) => {
    try {
      // data ya ha sido validado y transformado por zodResolver, 
      // pero TS lo ve como StudentFormInput. Lo tratamos como el output validado.
      const validatedData = data as StudentFormOutput;

      const studentData: Omit<Student, "studentId" | "enrollmentDate"> = {
        identificationPrefix: validatedData.identificationPrefix.toUpperCase() as Student["identificationPrefix"],
        identificationNumber: validatedData.identificationNumber,
        firstName: validatedData.firstName.toUpperCase(),
        middleName: validatedData.middleName?.toUpperCase() || "",
        lastName: validatedData.lastName.toUpperCase(),
        secondLastName: validatedData.secondLastName?.toUpperCase() || "",
        sex: validatedData.sex.toUpperCase() as Student["sex"],
        birthDate: validatedData.birthDate,
        civilStatus: validatedData.civilStatus.toUpperCase() as Student["civilStatus"],
        phone: `${validatedData.phonePrefix}${validatedData.phoneNumber}`,
        email: validatedData.email.toUpperCase(),
        address: validatedData.address.toUpperCase(),
        careerId: String(validatedData.careerId),
        semester: validatedData.semester,
        section: validatedData.section,
        regime: validatedData.regime.toUpperCase() as Student["regime"],
        studentType: validatedData.studentType.toUpperCase() as Student["studentType"],
        militaryRank: validatedData.militaryRank.toUpperCase(),
        works: validatedData.works.toUpperCase() as Student["works"],
        status: editingStudent?.status ?? true,
      };
      
      onSave(studentData);
    } catch (error) {
      console.error("Error en validación:", error);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton>
        <ModalHeader>
          <div className="max-w-4xl mx-auto w-full">
            <h5 className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {editingStudent ? "Editar Estudiante" : "Registrar Estudiante"}
            </h5>
            <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
              {editingStudent ? "Modifica los detalles del estudiante." : "Ingresa los detalles del nuevo estudiante."}
            </p>
          </div>
        </ModalHeader>

      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form id="student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {/* Fila 1 */}
            <div>
              <label htmlFor="identificationPrefix" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Cédula *</label>
              <div className="flex gap-2">
                <div className="w-24">
                  <Controller
                    name="identificationPrefix"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="identificationPrefix"
                        options={NATIONALITY_OPTIONS}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value}
                        placeholder="Tipo"
                        disabled={!!editingStudent}
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
                      hint={isCheckingCi ? "Verificando disponibilidad..." : errors.identificationNumber?.message}
                      disabled={!!editingStudent || isCheckingCi}
                    maxLength={8}
                    autoComplete="off"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').substring(0, 8);
                      setValue("identificationNumber", val, { shouldValidate: true });
                    }}
                    onBlur={async (e) => {
                      const value = e.target.value;
                      if (value.length >= 6) {
                        setIsCheckingCi(true);
                        const prefix = watch("identificationPrefix") || 'V';
                        const fullCi = `${prefix}-${value}`;
                        try {
                          const res = await checkAvailability('ci', fullCi, editingStudent?.studentId);
                          if (!res.available) {
                            setError("identificationNumber", { 
                              type: "manual", 
                              message: res.status === 0 
                                ? "Cédula registrada (INACTIVO). Contacte a administración para reactivar." 
                                : "Esta cédula ya está registrada." 
                            });
                          } else {
                            clearErrors("identificationNumber");
                          }
                        } catch (err) {
                          console.error("Error checking CI availability:", err);
                        } finally {
                          setIsCheckingCi(false);
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Primer Nombre *</label>
              <Input
                {...register("firstName")}
                placeholder="Primer nombre"
                error={!!errors.firstName}
                hint={errors.firstName?.message}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '').toUpperCase();
                  setValue("firstName", val, { shouldValidate: true });
                }}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Segundo Nombre</label>
              <Input
                {...register("middleName")}
                placeholder="Segundo nombre"
                error={!!errors.middleName}
                hint={errors.middleName?.message}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '').toUpperCase();
                  setValue("middleName", val, { shouldValidate: true });
                }}
              />
            </div>

            {/* Fila 2 */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Primer Apellido *</label>
              <Input
                {...register("lastName")}
                placeholder="Primer apellido"
                error={!!errors.lastName}
                hint={errors.lastName?.message}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '').toUpperCase();
                  setValue("lastName", val, { shouldValidate: true });
                }}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Segundo Apellido</label>
              <Input
                {...register("secondLastName")}
                placeholder="Segundo apellido"
                error={!!errors.secondLastName}
                hint={errors.secondLastName?.message}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '').toUpperCase();
                  setValue("secondLastName", val, { shouldValidate: true });
                }}
              />
            </div>
            <div>
              <label htmlFor="sex" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Sexo *</label>
              <Controller
                name="sex"
                control={control}
                render={({ field }) => (
                  <Select
                    id="sex"
                    options={SEX_OPTIONS}
                    placeholder="Seleccione Sexo"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={field.value}
                    className={errors.sex ? "border-error-500" : ""}
                  />
                )}
              />
              {errors.sex && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.sex.message}
                </p>
              )}
            </div>

            {/* Fila 3 */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">
                Fecha de Nacimiento * {age !== null && <span className="text-brand-500 ml-1">({age} años)</span>}
              </label>
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <FlatpickrDatePicker
                    value={field.value}
                    onChange={(dates) => {
                      const date = dates[0];
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        field.onChange(`${year}-${month}-${day}`);
                      } else {
                        field.onChange("");
                      }
                    }}
                    onBlur={field.onBlur}
                    error={!!errors.birthDate}
                    placeholder="Seleccione fecha"
                    options={{
                      maxDate: maxDate,
                      showMonths: 1,
                    }}
                  />
                )}
              />
              {errors.birthDate && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.birthDate.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="civilStatus" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Estado Civil *</label>
              <Controller
                name="civilStatus"
                control={control}
                render={({ field }) => (
                  <Select
                    id="civilStatus"
                    options={CIVIL_STATUS_OPTIONS}
                    placeholder="Seleccione Estado Civil"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={field.value}
                    className={errors.civilStatus ? "border-error-500" : ""}
                  />
                )}
              />
              {errors.civilStatus && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.civilStatus.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Teléfono *</label>
              <div className="flex gap-2">
                <div className="w-32">
                  <Controller
                    name="phonePrefix"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="phonePrefix"
                        options={VENEZUELA_PHONE_PREFIXES}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value}
                        placeholder="0412"
                        error={!!errors.phonePrefix}
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    {...register("phoneNumber")}
                    placeholder="Número de teléfono"
                    error={!!errors.phoneNumber}
                    maxLength={7}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').substring(0, 7);
                      setValue("phoneNumber", val, { shouldValidate: true });
                    }}
                  />
                </div>
              </div>
              {(errors.phonePrefix || errors.phoneNumber) && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.phoneNumber?.message || errors.phonePrefix?.message}
                </p>
              )}
            </div>

            {/* Fila 4 */}
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Correo Electrónico *</label>
              <Input
                {...register("email")}
                type="email"
                placeholder="Ingresa correo electrónico"
                error={!!errors.email}
                hint={isCheckingEmail ? "Verificando disponibilidad..." : (errors.email?.message || " ")}
                disabled={isCheckingEmail}
                autoComplete="off"
                onChange={(e) => {
                  setValue("email", e.target.value.toUpperCase(), { shouldValidate: true });
                }}
                onBlur={async (e) => {
                  const value = e.target.value;
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (value && emailRegex.test(value)) {
                    setIsCheckingEmail(true);
                    try {
                      const res = await checkAvailability('email', value, editingStudent?.studentId);
                      if (!res.available) {
                        setError("email", { 
                          type: "manual", 
                          message: res.status === 0 
                            ? "Email registrado (INACTIVO). Contacte a administración para reactivar." 
                            : "Este correo electrónico ya está registrado." 
                        });
                      } else {
                        clearErrors("email");
                      }
                    } catch (err) {
                      console.error("Error checking email availability:", err);
                    } finally {
                      setIsCheckingEmail(false);
                    }
                  }
                }}
              />
            </div>

            {/* Fila 5 Académica */}
            <div>
              <label htmlFor="careerId" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Carrera *</label>
              <Controller
                name="careerId"
                control={control}
                render={({ field }) => (
                  <Select
                    id="careerId"
                    options={careerOptions.map((opt) => ({ value: String(opt.value), label: opt.label.toUpperCase() }))}
                    placeholder="Seleccione Carrera"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={String(field.value)}
                    disabled={isLoading}
                    className={errors.careerId ? "border-error-500" : ""}
                  />
                )}
              />
              {errors.careerId && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.careerId.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Semestre *</label>
              <Input
                {...register("semester")}
                placeholder="Semestre"
                error={!!errors.semester}
                hint={errors.semester?.message}
                maxLength={2}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').substring(0, 2);
                  setValue("semester", val, { shouldValidate: true });
                }}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Sección *</label>
              <Input
                {...register("section")}
                placeholder="Sección"
                error={!!errors.section}
                hint={errors.section?.message}
                maxLength={5}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').substring(0, 5);
                  setValue("section", val, { shouldValidate: true });
                }}
              />
            </div>

            {/* Fila 6 Clasificación */}
            <div>
              <label htmlFor="regime" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Régimen *</label>
              <Controller
                name="regime"
                control={control}
                render={({ field }) => (
                  <Select
                    id="regime"
                    options={REGIME_OPTIONS}
                    placeholder="Seleccione Régimen"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={field.value}
                    className={errors.regime ? "border-error-500" : ""}
                  />
                )}
              />
              {errors.regime && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.regime.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="studentType" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Tipo Estudiante *</label>
              <Controller
                name="studentType"
                control={control}
                render={({ field }) => (
                  <Select
                    id="studentType"
                    options={STUDENT_TYPE_OPTIONS}
                    placeholder="Seleccione campo"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={field.value}
                    className={errors.studentType ? "border-error-500" : ""}
                  />
                )}
              />
              {errors.studentType && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.studentType.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="militaryRank" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Rango Militar *</label>
              <Controller
                name="militaryRank"
                control={control}
                render={({ field }) => {
                  const currentOptions = studentType === "CIVIL" 
                    ? [{ value: "NO APLICA", label: "NO APLICA" }]
                    : MILITARY_RANKS;

                  return (
                    <Select
                      id="militaryRank"
                      options={currentOptions}
                      placeholder="Seleccione Rango"
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      value={field.value}
                      className={errors.militaryRank ? "border-error-500" : ""}
                    />
                  );
                }}
              />
              {errors.militaryRank && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.militaryRank.message}
                </p>
              )}
            </div>
            
            <div className="md:col-span-2 lg:col-span-1">
              <label htmlFor="works" className="mb-2.5 block text-black dark:text-white font-medium text-sm">¿Trabaja? *</label>
              <Controller
                name="works"
                control={control}
                render={({ field }) => (
                  <Select
                    id="works"
                    options={WORKS_OPTIONS}
                    placeholder="Seleccione"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={field.value}
                    className={errors.works ? "border-error-500" : ""}
                  />
                )}
              />
              {errors.works && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.works.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Dirección de Residencia *</label>
              <TextArea
                {...register("address")}
                placeholder="Ingrese dirección de residencia completa"
                error={!!errors.address}
                hint={errors.address?.message}
                autoComplete="off"
                rows={2}
                className="w-full"
                onChange={(e) => {
                  setValue("address", e.target.value.toUpperCase(), { shouldValidate: true });
                }}
              />
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
            form="student-form" 
            loading={isLoading} 
            disabled={!isValid}
            className="w-full sm:w-auto min-h-12"
          >
            {editingStudent ? "Actualizar Registro" : "Guardar Estudiante"}
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
