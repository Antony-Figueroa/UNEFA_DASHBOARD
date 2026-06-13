import { useEffect, useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import ComponentCard from '../../components/common/ComponentCard';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import studentService from '../../features/student/services/studentService';
import type { StudentProfile } from '../../features/student/types';
import Badge from '../../components/ui/badge/Badge';
import { Tabs } from '../../components/ui/tabs/Tabs';
import { useTabs } from '../../hooks/useTabs';
import { User, Mail, Phone, Calendar } from 'lucide-react';

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
  const tabsState = useTabs({ defaultTab: 'general' });

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
      <>
        <PageMeta title="Mi Perfil | UNEFA Dashboard" description="Perfil del estudiante" />
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <PageMeta title="Mi Perfil | UNEFA Dashboard" description="Perfil del estudiante" />
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
          {error || 'No se encontró el perfil'}
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta 
        title="Mi Perfil | UNEFA Dashboard" 
        description="Información personal del estudiante" 
      />

      <PageBreadcrumb pageTitle="Mi Perfil" />

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
                  <h1 className="text-2xl font-bold text-text-primary dark:text-white">
                    {profile.fullName}
                  </h1>
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

        <Tabs options={PROFILE_TABS} {...tabsState.tabProps} variant="underline" className="mb-6" />

        <div hidden={tabsState.activeTab !== 'general'}>
          <ComponentCard title="Datos Personales">
            <div className="space-y-4">
              <InfoRow label="Nombre Completo" value={profile.fullName} />
              <InfoRow label="Cedula" value={profile.ci} />
              <InfoRow label="Genero" value={genderLabels[profile.gender] || profile.gender} />
              <InfoRow label="Fecha de Nacimiento" value={formatDate(profile.birthdate)} />
              <InfoRow label="Estado Civil" value={profile.maritalStatus} />
              <InfoRow label="Direccion" value={profile.address} />
            </div>
          </ComponentCard>
        </div>

        <div hidden={tabsState.activeTab !== 'academico'}>
          <ComponentCard title="Datos Académicos">
            <div className="space-y-4">
              <InfoRow label="Carrera" value={profile.careerName} />
              <InfoRow label="Semestre" value={profile.semester} />
              <InfoRow label="Seccion" value={profile.section} />
              <InfoRow label="Regimen" value={regimeLabels[profile.regime] || profile.regime} />
              <InfoRow label="Tipo de Estudiante" value={studentTypeLabels[profile.studentType] || profile.studentType} />
              {profile.militaryRank && profile.militaryRank !== 'NO APLICA' && (
                <InfoRow label="Rango Militar" value={profile.militaryRank} />
              )}
              <InfoRow 
                label="Trabaja" 
                value={profile.employment === 'SI' ? 'Si' : 'No'} 
              />
              <InfoRow 
                label="Fecha de Registro" 
                value={formatDate(profile.registrationDate)} 
              />
            </div>
          </ComponentCard>
        </div>

        <div hidden={tabsState.activeTab !== 'contacto'}>
          <ComponentCard title="Contacto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Mail className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-xs text-text-secondary">Correo Electronico</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Phone className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-xs text-text-secondary">Telefono</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
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
