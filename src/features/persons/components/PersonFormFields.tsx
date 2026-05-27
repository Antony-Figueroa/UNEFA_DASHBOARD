/**
 * @file PersonFormFields.tsx
 * @description Componente de formulario reutilizable para los campos compartidos de Persona (t_persons).
 * Compatible con Controller + CustomSelect para selects, register para inputs.
 * Acepta handlers de formateo por props para máxima flexibilidad.
 *
 * @example
 * ```tsx
 * <PersonFormFields
 *   control={control}
 *   register={register}
 *   errors={errors}
 *   setValue={setValue}
 *   watch={watch}
 *   options={options}
 *   displayIdentificationNumber={displayId}
 *   onIdentificationNumberChange={handleIdChange}
 *   onCheckCi={handleCiCheck}
 *   isCheckingCi={isChecking}
 *   existingPerson={existing}
 *   displayPhoneNumber={displayPhone}
 *   onPhoneNumberChange={handlePhoneChange}
 *   createNameHandler={(field) => (e) => {
 *     const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '').toUpperCase();
 *     setValue(field, val, { shouldValidate: true, shouldDirty: true });
 *   }}
 *   onAddValue={(listName, field, title) => openAddModal(listName, field, title)}
 *   age={age}
 *   maxDate={maxDate?.toISOString().split('T')[0]}
 *   viewOnlyMode={viewOnlyMode}
 *   editingId={editingStudent?.studentId}
 * />
 * ```
 */

import { Controller, Control, UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from "react-hook-form";
import Input from "../../../components/form/input/InputField";
import CustomSelect from "../../../components/form/CustomSelect";
import { PREFIX_OPTIONS } from "../types";

/** Límites de cédula */
export const CEDULA_MAX_DIGITS = 8;
export const CEDULA_MAX_LENGTH = 10; // V-12345678

/**
 * Propiedades del componente PersonFormFields.
 */
export interface PersonFormFieldsProps {
  /** Control de react-hook-form (para Controller en CustomSelect) */
  control: Control<any>;
  /** Register de react-hook-form (para Input básicos) */
  register: UseFormRegister<any>;
  /** Errores de validación */
  errors: FieldErrors<any>;
  /** Setter de valores de react-hook-form */
  setValue: UseFormSetValue<any>;
  /** Watcher de react-hook-form */
  watch: UseFormWatch<any>;

  /** Opciones de selects cargadas desde t_list */
  options: Record<string, { value: string; label: string }[]>;

  // === CI / Identificación ===
  /** Valor formateado de cédula para display (ej: V-12.345.678) */
  displayIdentificationNumber: string;
  /** Handler cuando cambia el input de cédula */
  onIdentificationNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handler onBlur para verificación de CI */
  onBlurCi?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Handler para verificar disponibilidad de CI (botón) */
  onCheckCi?: () => void;
  /** Indica si se está verificando la CI */
  isCheckingCi?: boolean;
  /** Indica si se está consultando la API externa para autocompletar datos */
  isLookingUpCi?: boolean;
  /** Persona existente encontrada por duplicado */
  existingPerson?: Record<string, any> | null;

  // === Teléfono ===
  /** Valor formateado de teléfono para display */
  displayPhoneNumber?: string;
  /** Handler cuando cambia el input de teléfono */
  onPhoneNumberChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // === Nombres (formateo) ===
  /**
   * Fábrica de handlers onChange para campos de nombre.
   * Recibe el nombre del campo y devuelve un onChange handler.
   * Si no se provee, se usa register() directamente (sin formateo).
   *
   * @example
   * const handleNameChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
   *   const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '').toUpperCase();
   *   setValue(field as any, val, { shouldValidate: true, shouldDirty: true });
   * };
   */
  createNameHandler?: (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;

  // === CustomSelect extras ===
  /** Handler para abrir modal de agregar nuevo valor a una lista (CustomSelect onAddNew) */
  onAddValue?: (listName: string, field: string, title: string) => void;

  // === Fecha de Nacimiento ===
  /** Edad calculada (para mostrar junto a la fecha) */
  age?: number | null;
  /** Fecha máxima permitida (YYYY-MM-DD) */
  maxDate?: string;

  // === Estado ===
  /** Handler onBlur para verificación de email */
  onBlurEmail?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Indica si se está verificando el email */
  isCheckingEmail?: boolean;

  /** Indica si el formulario está en modo solo lectura */
  viewOnlyMode?: boolean;
  /** ID del registro en edición (deshabilita edición de CI) */
  editingId?: string | number | null;
  /** Handler para editar un registro existente encontrado por CI */
  onEditExisting?: () => void;
  /** Lista de campos a ocultar (opcional). Útil para modales que no usan todos los campos personales. */
  hiddenFields?: string[];
  /**
   * Nombre del campo para el prefijo telefónico en el schema del formulario.
   * Por defecto "phonePrefix". TutorModal usa "phoneAreaCode".
   */
  phonePrefixFieldName?: string;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Campos de formulario compartidos para datos de persona (t_persons).
 * Renderiza: CI, nombres, apellidos, email, teléfono, sexo, fecha nacimiento,
 * estado civil y dirección.
 *
 * Diseñado para ser embebido en modales de estudiantes, tutores, usuarios y
 * responsables institucionales. Usa Controller para CustomSelect (consistente
 * con el patrón existente en los modales) y register para Input básicos.
 */
export default function PersonFormFields({
  control,
  register,
  errors,
  setValue,
  watch,
  options,
  displayIdentificationNumber,
  onIdentificationNumberChange,
  onBlurCi,
  onCheckCi,
  isCheckingCi = false,
  isLookingUpCi = false,
  existingPerson,
  displayPhoneNumber,
  onPhoneNumberChange,
  createNameHandler,
  onAddValue,
  age,
  maxDate,
  onBlurEmail,
  isCheckingEmail = false,
  hiddenFields = [],
  viewOnlyMode = false,
  editingId = null,
  onEditExisting,
  phonePrefixFieldName = "phonePrefix",
  className = "",
}: PersonFormFieldsProps) {
  // CI solo se deshabilita cuando hay un editingId (editar registro existente),
  // NO por viewOnlyMode (el usuario debe poder cambiar la CI para buscar otra persona)
  const ciDisabled = !!editingId;

  // === Helpers ===
  const getSelectOptions = (key: string) =>
    (options[key] || []).map((o) => ({ value: String(o.value), label: o.label }));

  const makeControllerSelect = (
    name: string,
    placeholder: string,
    optionKey: string,
    disabled: boolean,
    addNew?: { listName: string; title: string },
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <CustomSelect
          id={name}
          options={getSelectOptions(optionKey)}
          placeholder={placeholder}
          onChange={field.onChange}
          onBlur={field.onBlur}
          value={String(field.value || "")}
          disabled={disabled}
          error={!!errors[name]}
          {...(addNew && onAddValue
            ? {
                onAddNew: () => onAddValue(addNew.listName, name, addNew.title),
                addNewLabel: addNew.title,
              }
            : {})}
        />
      )}
    />
  );

  // === Handlers para inputs con formateo ===
  const nameInputProps = (fieldName: string) => {
    if (createNameHandler) {
      const customOnChange = createNameHandler(fieldName);
      const { ref, name, onBlur } = register(fieldName);
      return {
        ref,
        name,
        onBlur,
        onChange: customOnChange,
      };
    }
    return register(fieldName);
  };

  // === Helper: check if a field is hidden ===
  const isHidden = (...fieldNames: string[]) =>
    fieldNames.some((f) => hiddenFields.includes(f));

  // === Render ===
  return (
    <div className={`space-y-5 ${className}`}>
      {/* ============================================================ */}
      {/* CI / Identificación */}
      {/* ============================================================ */}
      {!isHidden("identificationNumber") && (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        {/* Prefijo */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Prefijo <span className="text-red-500">*</span>
          </label>
          <Controller
            name="identificationPrefix"
            control={control}
            render={({ field }) => (
              <CustomSelect
                id="identificationPrefix"
                options={
                  (options["Nacionalidad"] || PREFIX_OPTIONS).map((o) => ({
                    value: String(o.value),
                    label: o.label,
                  }))
                }
                placeholder="V"
                onChange={field.onChange}
                onBlur={field.onBlur}
                value={String(field.value || "V")}
                disabled={ciDisabled}
                error={!!errors.identificationPrefix}
              />
            )}
          />
          {errors.identificationPrefix && (
            <p className="mt-1 text-xs text-red-500">{errors.identificationPrefix.message as string}</p>
          )}
        </div>

        {/* Número de cédula */}
        <div className="md:col-span-3">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Número de Cédula <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              value={displayIdentificationNumber}
              onChange={onIdentificationNumberChange}
              onBlur={onBlurCi}
              placeholder="V-12.345.678"
              disabled={ciDisabled}
              maxLength={CEDULA_MAX_LENGTH}
              autoComplete="off"
              className="tracking-widest"
              error={!!errors.identificationNumber}
              hint={
                errors.identificationNumber?.message as string
                || (isCheckingCi ? "Verificando..." : undefined)
              }
            />
            {onCheckCi && !ciDisabled && (
              <button
                type="button"
                onClick={onCheckCi}
                disabled={isCheckingCi}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                {isCheckingCi ? "..." : "Verificar"}
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Alerta de persona existente */}
      {existingPerson && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-600 dark:bg-yellow-900/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Persona existente:</strong>{" "}
              {existingPerson.firstName} {existingPerson.lastName} —{" "}
              {existingPerson.identificationPrefix}-{existingPerson.identificationNumber}
            </p>
            {onEditExisting && (
              <button
                type="button"
                onClick={onEditExisting}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                Editar esta persona
              </button>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Nombres y Apellidos */}
      {/* ============================================================ */}
      {!isHidden("firstName") && (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Primer Nombre <span className="text-red-500">*</span>
          </label>
          <Input
            {...nameInputProps("firstName")}
            placeholder="Primer nombre"
            disabled={viewOnlyMode}
            error={!!errors.firstName}
            hint={errors.firstName?.message as string}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Segundo Nombre
          </label>
          <Input
            {...nameInputProps("middleName")}
            placeholder="Segundo nombre (opcional)"
            disabled={viewOnlyMode}
            error={!!errors.middleName}
            hint={errors.middleName?.message as string}
          />
        </div>
      </div>
      )}

      {!isHidden("lastName") && (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Primer Apellido <span className="text-red-500">*</span>
          </label>
          <Input
            {...nameInputProps("lastName")}
            placeholder="Primer apellido"
            disabled={viewOnlyMode}
            error={!!errors.lastName}
            hint={errors.lastName?.message as string}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Segundo Apellido
          </label>
          <Input
            {...nameInputProps("secondLastName")}
            placeholder="Segundo apellido (opcional)"
            disabled={viewOnlyMode}
            error={!!errors.secondLastName}
            hint={errors.secondLastName?.message as string}
          />
        </div>
      </div>
      )}

      {/* ============================================================ */}
      {/* Email */}
      {/* ============================================================ */}
      {!isHidden("email") && (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          Correo Electrónico <span className="text-red-500">*</span>
        </label>
        <Input
          {...register("email")}
          type="email"
          placeholder="correo@ejemplo.com"
          disabled={viewOnlyMode}
          autoComplete="off"
          error={!!errors.email}
          hint={
            isCheckingEmail
              ? "Verificando disponibilidad..."
              : (errors.email?.message as string)
          }
          onChange={(e) => {
            const upper = e.target.value.toUpperCase();
            setValue("email", upper, { shouldValidate: true, shouldDirty: true });
          }}
          onBlur={(e) => {
            register("email").onBlur(e);
            onBlurEmail?.(e);
          }}
        />
      </div>
      )}

      {/* ============================================================ */}
      {/* Teléfono */}
      {/* ============================================================ */}
      {!isHidden("phoneNumber") && (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Prefijo Tel. <span className="text-red-500">*</span>
          </label>
          <Controller
            name={phonePrefixFieldName}
            control={control}
            render={({ field }) => (
              <CustomSelect
                id={phonePrefixFieldName}
                options={getSelectOptions("PREFIJO")}
                placeholder="0412"
                onChange={field.onChange}
                onBlur={field.onBlur}
                value={String(field.value ?? "")}
                disabled={viewOnlyMode}
                error={!!(errors as any)[phonePrefixFieldName]}
                onAddNew={
                  onAddValue
                    ? () => onAddValue("PREFIJO", phonePrefixFieldName, "Agregar Prefijo Telefónico")
                    : undefined
                }
                addNewLabel={onAddValue ? "Nueva opción" : undefined}
              />
            )}
          />
          {(errors as any)[phonePrefixFieldName] && (
            <p className="mt-1 text-xs text-red-500">{(errors as any)[phonePrefixFieldName].message as string}</p>
          )}
        </div>
        <div className="md:col-span-3">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Número de Teléfono <span className="text-red-500">*</span>
          </label>
          <Input
            value={displayPhoneNumber ?? watch("phoneNumber") ?? ""}
            onChange={
              onPhoneNumberChange ||
              ((e) => setValue("phoneNumber", e.target.value.replace(/\D/g, ""), { shouldValidate: true }))
            }
            placeholder="123-4567"
            disabled={viewOnlyMode}
            maxLength={8}
            error={!!errors.phoneNumber}
            hint={errors.phoneNumber?.message as string}
          />
        </div>
      </div>
      )}

      {/* ============================================================ */}
      {/* Sexo + Fecha Nacimiento + Estado Civil */}
      {/* ============================================================ */}
      {!isHidden("sex", "birthDate", "civilStatus") && (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Sexo <span className="text-red-500">*</span>
          </label>
          {makeControllerSelect("sex", "Seleccionar", "Sexo", viewOnlyMode)}
          {errors.sex && (
            <p className="mt-1 text-xs text-red-500">{errors.sex.message as string}</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Fecha de Nacimiento{" "}
            {age !== null && age !== undefined && (
              <span className="text-brand-500 ml-1">({age} años)</span>
            )}
          </label>
          <Controller
            name="birthDate"
            control={control}
            render={({ field }) => (
              <input
                type="date"
                id="birthDate"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                className={`h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm transition-all ${
                  errors.birthDate
                    ? "border-error-500 focus:border-error-500 text-error-500"
                    : "border-border-medium focus:border-brand-300 focus:ring-brand-500/10 text-text-primary"
                } dark:bg-bg-dark dark:text-text-emphasis dark:border-border-dark dark:focus:border-brand-800 ${
                  viewOnlyMode ? "cursor-not-allowed bg-bg-secondary opacity-50" : ""
                }`}
                max={maxDate || undefined}
                disabled={viewOnlyMode}
              />
            )}
          />
          {errors.birthDate && (
            <p className="mt-1 text-xs text-red-500">{errors.birthDate.message as string}</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Estado Civil <span className="text-red-500">*</span>
          </label>
          {makeControllerSelect("civilStatus", "Seleccionar", "Registro Civil", viewOnlyMode, {
            listName: "Registro Civil",
            title: "Agregar Estado Civil",
          })}
          {errors.civilStatus && (
            <p className="mt-1 text-xs text-red-500">{errors.civilStatus.message as string}</p>
          )}
        </div>
      </div>
      )}

      {/* ============================================================ */}
      {/* Dirección */}
      {/* ============================================================ */}
      {!isHidden("address") && (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          Dirección de Residencia <span className="text-red-500">*</span>
        </label>
        <Input
          {...register("address")}
          placeholder="Dirección de habitación"
          disabled={viewOnlyMode}
          error={!!errors.address}
          hint={errors.address?.message as string}
        />
      </div>
      )}
    </div>
  );
}
