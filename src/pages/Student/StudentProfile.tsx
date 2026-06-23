import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ComponentCard from '../../components/common/ComponentCard';
import studentService from '../../features/student/services/studentService';
import type { StudentProfile } from '../../features/student/types';
import Badge from '../../components/ui/badge/Badge';
import Button from '../../components/ui/button/Button';
import CustomInput from '../../components/ui/form/input/CustomInput';
import { Tabs } from '../../components/ui/tabs/Tabs';
import { useTabs } from '../../hooks/useTabs';
import { User, Mail, Phone, Calendar, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const vePhoneRegex = /^(0[0-9]{3})-?[0-9]{7}$/;

const profileEditSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().regex(vePhoneRegex, 'Formato esperado: 0412-1234567'),
  address: z.string().min(10, 'Dirección debe tener al menos 10 caracteres').max(500),
});

type ProfileEditData = z.infer<typeof profileEditSchema>;

const genderLabels: Record<string, string> = {
  M: 'Masculino',
  F: 'Femenino'
};

const regimeLabels: Record<string, string> = {
  D1: 'Diurno',
  N1: 'Nocturno',
  S3: 'Fin de Semana'
};

const studentTypeLabels: Record<string, string> = {
  CIV: 'Civil',
  MIL: 'Militar'
};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const tabsState = useTabs({ defaultTab: 'general' });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileEditData>({
    resolver: zodResolver(profileEditSchema),
  });

  const PROFILE_TABS = [
    { id: 'general', label: 'General' },
    { id: 'academico', label: 'Académico' },
    { id: 'contacto', label: 'Contacto' },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await studentService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('[StudentProfile] Error:', err);
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const enterEditMode = () => {
    if (!profile) return;
    reset({
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.address || '',
    });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  const onSubmit = async (data: ProfileEditData) => {
    try {
      setSaving(true);
      const updated = await studentService.updateProfile(data);
      setProfile(updated);
      setEditMode(false);
      toast.success('Perfil actualizado exitosamente');
    } catch (err) {
      console.error('[StudentProfile] Error saving:', err);
      toast.error('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
        {error || 'No se encontró el perfil'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ComponentCard title="">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <User className="w-12 h-12 text-brand-600 dark:text-brand-400" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-text-primary dark:text-white">
                  {profile.fullName}
                </h2>
                <p className="text-text-secondary dark:text-text-tertiary">
                  {profile.careerName}
                </p>
              </div>
              <Badge
                color={profile.status === 1 ? 'success' : 'error'}
                size="md"
              >
                {profile.status === 1 ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-text-secondary" />
                <span className="text-text-secondary">CI:</span>
                <span className="font-medium">{profile.ci}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-text-secondary" />
                <span className="text-text-secondary truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-text-secondary" />
                <span className="font-medium">{profile.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-text-secondary" />
                <span className="text-text-secondary">Nacimiento:</span>
                <span className="font-medium">{formatDate(profile.birthdate)}</span>
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>

      <div className="flex items-center justify-between">
        <Tabs options={PROFILE_TABS} {...tabsState.tabProps} variant="underline" className="mb-6" />
        {!editMode ? (
          <Button variant="outline" size="sm" onClick={enterEditMode} startIcon={<Edit2 className="w-4 h-4" />}>
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancelEdit} startIcon={<X className="w-4 h-4" />}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)} loading={saving} startIcon={<Check className="w-4 h-4" />}>
              Guardar
            </Button>
          </div>
        )}
      </div>

      <div hidden={tabsState.activeTab !== 'general'}>
        <ComponentCard title="Datos Personales">
          {editMode ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <CustomInput
                label="Dirección"
                {...register('address')}
                error={errors.address?.message}
                placeholder="Ingrese su dirección"
              />
              <div className="pt-2">
                <Button type="submit" loading={saving} startIcon={<Check className="w-4 h-4" />}>
                  Guardar Cambios
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <InfoRow label="Nombre Completo" value={profile.fullName} />
              <InfoRow label="Cédula" value={profile.ci} />
              <InfoRow label="Género" value={genderLabels[profile.gender] || profile.gender} />
              <InfoRow label="Fecha de Nacimiento" value={formatDate(profile.birthdate)} />
              <InfoRow label="Estado Civil" value={profile.maritalStatus} />
              <InfoRow label="Dirección" value={profile.address} />
            </div>
          )}
        </ComponentCard>
      </div>

      <div hidden={tabsState.activeTab !== 'academico'}>
        <ComponentCard title="Datos Académicos">
          <div className="space-y-4">
            <InfoRow label="Carrera" value={profile.careerName} />
            <InfoRow label="Semestre" value={profile.semester} />
            <InfoRow label="Sección" value={profile.section} />
            <InfoRow label="Régimen" value={regimeLabels[profile.regime] || profile.regime} />
            <InfoRow label="Tipo de Estudiante" value={studentTypeLabels[profile.studentType] || profile.studentType} />
            {profile.militaryRank && profile.militaryRank !== 'NO APLICA' && (
              <InfoRow label="Rango Militar" value={profile.militaryRank} />
            )}
            <InfoRow label="Trabaja" value={profile.employment === 'SI' ? 'Sí' : 'No'} />
            <InfoRow label="Fecha de Registro" value={formatDate(profile.registrationDate)} />
          </div>
        </ComponentCard>
      </div>

      <div hidden={tabsState.activeTab !== 'contacto'}>
        <ComponentCard title="Contacto">
          {editMode ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <CustomInput
                label="Correo Electrónico"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="correo@ejemplo.com"
              />
              <CustomInput
                label="Teléfono"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="0412-1234567"
              />
              <div className="pt-2">
                <Button type="submit" loading={saving} startIcon={<Check className="w-4 h-4" />}>
                  Guardar Cambios
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Mail className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-xs text-text-secondary">Correo Electrónico</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Phone className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-xs text-text-secondary">Teléfono</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <span className="text-sm text-text-secondary min-w-[140px]">{label}:</span>
      <span className="font-medium text-text-primary dark:text-white">{value || '-'}</span>
    </div>
  );
}
