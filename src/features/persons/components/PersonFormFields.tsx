import { UseFormRegister, FieldErrors, Control, Controller } from 'react-hook-form';
import Input from '../../../components/form/input/InputField';
import CustomSelect from '../../../components/form/CustomSelect';

interface PersonFormValues {
  ci: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
  gender?: string;
  birthDate?: string;
  address?: string;
  maritalStatus?: string;
}

interface PersonFormFieldsProps {
  register: UseFormRegister<PersonFormValues>;
  errors: FieldErrors<PersonFormValues>;
  control: Control<PersonFormValues>;
  showExtraFields?: boolean;
  genderOptions?: { value: string; label: string }[];
  maritalOptions?: { value: string; label: string }[];
  onCiChange?: (ci: string) => void;
  ciChecking?: boolean;
  ciAvailable?: boolean | null;
  onEmailChange?: (email: string) => void;
  emailChecking?: boolean;
  emailAvailable?: boolean | null;
}

export default function PersonFormFields({
  register,
  errors,
  control,
  showExtraFields = true,
  genderOptions = [
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'FEMENINO', label: 'Femenino' },
    { value: 'OTRO', label: 'Otro' },
  ],
  maritalOptions = [
    { value: 'SOLTERO', label: 'Soltero(a)' },
    { value: 'CASADO', label: 'Casado(a)' },
    { value: 'DIVORCIADO', label: 'Divorciado(a)' },
    { value: 'VIUDO', label: 'Viudo(a)' },
  ],
  onCiChange,
  ciChecking,
  ciAvailable,
  onEmailChange,
  emailChecking,
  emailAvailable,
}: PersonFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-text-primary dark:text-white/90">Cédula de Identidad</label>
          <Input
            placeholder="V-12345678"
            {...register('ci')}
            error={!!errors.ci}
            hint={errors.ci?.message}
            onChange={(e) => {
              register('ci').onChange(e);
              onCiChange?.(e.target.value);
            }}
          />
          {ciChecking && <span className="text-sm text-gray-500">Verificando...</span>}
          {ciAvailable === false && <span className="text-sm text-red-500">Esta cédula ya está registrada</span>}
          {ciAvailable === true && <span className="text-sm text-green-500">Cédula disponible</span>}
        </div>
        <div>
          <label className="text-sm font-medium text-text-primary dark:text-white/90">Correo Electrónico</label>
          <Input
            placeholder="correo@ejemplo.com"
            type="email"
            {...register('email')}
            error={!!errors.email}
            hint={errors.email?.message}
            onChange={(e) => {
              register('email').onChange(e);
              onEmailChange?.(e.target.value);
            }}
          />
          {emailChecking && <span className="text-sm text-gray-500">Verificando...</span>}
          {emailAvailable === false && <span className="text-sm text-red-500">Este email ya está registrado</span>}
          {emailAvailable === true && <span className="text-sm text-green-500">Email disponible</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-text-primary dark:text-white/90">Primer Nombre</label>
          <Input
            placeholder="Primer nombre"
            {...register('firstName')}
            error={!!errors.firstName}
            hint={errors.firstName?.message}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text-primary dark:text-white/90">Segundo Nombre</label>
          <Input
            placeholder="Segundo nombre (opcional)"
            {...register('middleName')}
            error={!!errors.middleName}
            hint={errors.middleName?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-text-primary dark:text-white/90">Primer Apellido</label>
          <Input
            placeholder="Primer apellido"
            {...register('lastName')}
            error={!!errors.lastName}
            hint={errors.lastName?.message}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text-primary dark:text-white/90">Segundo Apellido</label>
          <Input
            placeholder="Segundo apellido (opcional)"
            {...register('secondLastName')}
            error={!!errors.secondLastName}
            hint={errors.secondLastName?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-text-primary dark:text-white/90">Teléfono</label>
          <Input
            placeholder="04121234567"
            {...register('phone')}
            error={!!errors.phone}
            hint={errors.phone?.message}
          />
        </div>
      </div>

      {showExtraFields && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-text-primary dark:text-white/90">Género</label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    options={genderOptions}
                    placeholder="Seleccionar..."
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={field.value || ''}
                  />
                )}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary dark:text-white/90">Estado Civil</label>
              <Controller
                name="maritalStatus"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    options={maritalOptions}
                    placeholder="Seleccionar..."
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={field.value || ''}
                  />
                )}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary dark:text-white/90">Dirección</label>
            <Input
              placeholder="Dirección de residencia"
              {...register('address')}
              error={!!errors.address}
              hint={errors.address?.message}
            />
          </div>
        </>
      )}
    </div>
  );
}
