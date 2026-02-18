import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import InputField from "../../components/form/input/InputField";
import CustomSelect from "../../components/form/CustomSelect";

interface Manual {
  id: number;
  title: string;
  description: string;
  category: string;
  fileType: string;
  fileSize: string;
  updatedAt: string;
  version: string;
}

const MOCK_MANUALS: Manual[] = [
  {
    id: 1,
    title: "Manual de Usuario - Sistema de Gestión",
    description: "Guía completa para el uso del sistema UNEFA Dashboard, incluyendo navegación, funcionalidades principales y mejores prácticas.",
    category: "General",
    fileType: "PDF",
    fileSize: "2.4 MB",
    updatedAt: "2025-01-15",
    version: "2.0",
  },
  {
    id: 2,
    title: "Guía de Inscripción de Estudiantes",
    description: "Proceso paso a paso para la inscripción de estudiantes en el sistema, incluyendo validaciones y documentos requeridos.",
    category: "Inscripciones",
    fileType: "PDF",
    fileSize: "1.8 MB",
    updatedAt: "2025-01-10",
    version: "1.5",
  },
  {
    id: 3,
    title: "Manual de Seguimiento de Prácticas",
    description: "Instrucciones para el registro y seguimiento de prácticas profesionales, visitas y evaluaciones.",
    category: "Seguimiento",
    fileType: "PDF",
    fileSize: "3.2 MB",
    updatedAt: "2025-01-08",
    version: "1.2",
  },
  {
    id: 4,
    title: "Guía de Generación de Reportes",
    description: "Tutorial para generar y exportar reportes del sistema en diferentes formatos.",
    category: "Reportes",
    fileType: "PDF",
    fileSize: "1.5 MB",
    updatedAt: "2025-01-05",
    version: "1.0",
  },
  {
    id: 5,
    title: "Manual de Configuración del Sistema",
    description: "Guía para administradores sobre la configuración de parámetros del sistema, roles y permisos.",
    category: "Configuración",
    fileType: "PDF",
    fileSize: "2.1 MB",
    updatedAt: "2024-12-20",
    version: "1.3",
  },
  {
    id: 6,
    title: "Video Tutorial - Primeros Pasos",
    description: "Video introductorio sobre las funcionalidades básicas del sistema.",
    category: "Videos",
    fileType: "MP4",
    fileSize: "45 MB",
    updatedAt: "2025-01-12",
    version: "1.0",
  },
];

const CATEGORIES = [
  { value: "", label: "Todas las categorías" },
  { value: "General", label: "General" },
  { value: "Inscripciones", label: "Inscripciones" },
  { value: "Seguimiento", label: "Seguimiento" },
  { value: "Reportes", label: "Reportes" },
  { value: "Configuración", label: "Configuración" },
  { value: "Videos", label: "Videos" },
];

export default function ManualsPage() {
  const [loading, setLoading] = useState(true);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setManuals(MOCK_MANUALS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredManuals = manuals.filter((manual) => {
    const matchesSearch = !searchTerm ||
      manual.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manual.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || manual.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (fileType: string) => {
    if (fileType === "PDF") {
      return (
        <svg className="w-6 h-6 text-error-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h4v2h-4v-2zm0 4h4v2h-4v-2zm8-6H7v8h10v-8z" />
        </svg>
      );
    }
    if (fileType === "MP4") {
      return (
        <svg className="w-6 h-6 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm6 5v6l5-3-5-3z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-text-tertiary" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
      </svg>
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, "primary" | "success" | "warning" | "error" | "brand"> = {
      "General": "primary",
      "Inscripciones": "success",
      "Seguimiento": "warning",
      "Reportes": "brand",
      "Configuración": "error",
      "Videos": "primary",
    };
    return colors[category] || "primary";
  };

  return (
    <>
      <PageMeta title="Manuales" description="Documentación y manuales del sistema" />
      <PageBreadcrumb pageTitle="Manuales" />

      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Manuales y Documentación
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Accede a guías, tutoriales y documentación del sistema
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="w-full sm:w-80">
            <InputField
              type="text"
              placeholder="Buscar manuales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <CustomSelect
            options={CATEGORIES}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e as unknown as string)}
            className="w-full sm:w-48"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                </div>
              </div>
            ))
          ) : filteredManuals.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <svg className="w-16 h-16 mx-auto text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-text-primary dark:text-text-emphasis">No hay manuales</h3>
              <p className="text-sm text-text-tertiary mt-1">No se encontraron manuales con los filtros aplicados.</p>
            </div>
          ) : (
            filteredManuals.map((manual) => (
              <div
                key={manual.id}
                className="group rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5 hover:border-brand-300 dark:hover:border-brand-700 transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0">
                    {getFileIcon(manual.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary dark:text-text-emphasis line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {manual.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge color={getCategoryColor(manual.category)} variant="light" shape="rounded" className="text-[10px]">
                        {manual.category}
                      </Badge>
                      <span className="text-xs text-text-tertiary">v{manual.version}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm text-text-secondary dark:text-text-tertiary line-clamp-2">
                  {manual.description}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-text-tertiary">
                    <span>{manual.fileType}</span>
                    <span className="mx-2">•</span>
                    <span>{manual.fileSize}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedManual(manual)}
                  >
                    Ver
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <ComponentCard title="Recursos Adicionales">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <a
              href="#"
              className="flex items-center gap-4 p-4 rounded-lg border border-border-light dark:border-white/10 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-text-primary dark:text-text-emphasis">Preguntas Frecuentes</h3>
                <p className="text-xs text-text-tertiary">Respuestas a dudas comunes</p>
              </div>
            </a>

            <a
              href="#"
              className="flex items-center gap-4 p-4 rounded-lg border border-border-light dark:border-white/10 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-50 dark:bg-success-500/10">
                <svg className="w-5 h-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-text-primary dark:text-text-emphasis">Soporte Técnico</h3>
                <p className="text-xs text-text-tertiary">Contacta al equipo de soporte</p>
              </div>
            </a>

            <a
              href="#"
              className="flex items-center gap-4 p-4 rounded-lg border border-border-light dark:border-white/10 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-50 dark:bg-warning-500/10">
                <svg className="w-5 h-5 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-text-primary dark:text-text-emphasis">Video Tutoriales</h3>
                <p className="text-xs text-text-tertiary">Aprende con videos paso a paso</p>
              </div>
            </a>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
