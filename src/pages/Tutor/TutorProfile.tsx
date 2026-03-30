import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import tutorService, { TutorProfile } from "../../features/tutor/services/tutorService";
import Badge from "../../components/ui/badge/Badge";
import { User, Mail, Phone, Briefcase, Award, Calendar } from "lucide-react";

export default function TutorProfilePage() {
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await tutorService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error("[TutorProfile] Error:", err);
      setError("Error al cargar perfil");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: number) => {
    return status === 1 ? (
      <Badge color="success">Activo</Badge>
    ) : (
      <Badge color="error">Inactivo</Badge>
    );
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Mi Perfil | SIGP - UNEFA" description="Perfil del tutor" />
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <PageMeta title="Mi Perfil | SIGP - UNEFA" description="Perfil del tutor" />
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
          {error || "No se pudo cargar el perfil"}
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Mi Perfil | SIGP - UNEFA"
        description="Información del perfil de tutor académico"
      />
      <PageBreadcrumb pageTitle="Mi Perfil" />

      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
            Mi Perfil
          </h1>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            Información personal y profesional
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ComponentCard title="" className="text-center">
              <div className="py-6">
                <div className="w-24 h-24 mx-auto bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-brand-500" />
                </div>
                <h2 className="text-xl font-bold text-text-emphasis">{profile.fullName}</h2>
                <p className="text-text-secondary mt-1">Tutor Académico</p>
                <div className="mt-4">
                  {getStatusBadge(profile.status)}
                </div>
              </div>
            </ComponentCard>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <ComponentCard title="Datos Personales">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <User className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Cédula</p>
                    <p className="font-medium text-text-emphasis">{profile.ci}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Mail className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Email</p>
                    <p className="font-medium text-text-emphasis">{profile.email || "No registrado"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Phone className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Teléfono</p>
                    <p className="font-medium text-text-emphasis">{profile.phone || "No registrado"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Género</p>
                    <p className="font-medium text-text-emphasis">{profile.gender || "No especificado"}</p>
                  </div>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Información Profesional">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Título</p>
                    <p className="font-medium text-text-emphasis">{profile.profession || "No especificada"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Award className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Grado de Instrucción</p>
                    <p className="font-medium text-text-emphasis">{profile.titulo || "No especificado"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                    <Award className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Categoría</p>
                    <p className="font-medium text-text-emphasis">{profile.category || "No especificada"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <Briefcase className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Condición</p>
                    <p className="font-medium text-text-emphasis">{profile.condition || "No especificada"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                    <Award className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Dedicación</p>
                    <p className="font-medium text-text-emphasis">{profile.dedication || "No especificada"}</p>
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>
        </div>
      </div>
    </>
  );
}
