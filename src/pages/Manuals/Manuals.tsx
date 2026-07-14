import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import InputField from "../../components/form/input/InputField";
import CustomSelect from "../../components/form/CustomSelect";
import { manualsService, Manual } from "../../features/manuals/services/manualsService";
import { useToast } from "../../context/toast";
import { TOAST } from "../../components/ui/dialog/DialogConfig";

const getCategoryColor = (category: string) => {
  const colors: Record<string, "primary" | "success" | "warning" | "error"> = {
    "General": "primary",
    "Inscripciones": "success",
    "Seguimiento": "warning",
    "Reportes": "primary",
    "Configuración": "error",
    "Videos": "primary",
  };
  return colors[category] || "primary";
};

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

export default function ManualsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [manualsRes, categoriesRes] = await Promise.all([
        manualsService.getAll({
          category: categoryFilter || undefined,
          search: searchTerm || undefined
        }),
        manualsService.getCategories()
      ]);

      if (manualsRes.success) {
        setManuals(manualsRes.data);
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error('Error fetching manuals:', error);
      addToast(TOAST.loadError());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchData();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const categoryOptions = [
    { value: "", label: "Todas las categorías" },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

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
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e as unknown as string)}
            className="w-full sm:w-48"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5 animate-pulse">
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
          ) : manuals.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <svg className="w-16 h-16 mx-auto text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-text-primary dark:text-text-emphasis">No hay manuales</h3>
              <p className="text-sm text-text-tertiary mt-1">No se encontraron manuales con los filtros aplicados.</p>
            </div>
          ) : (
            manuals.map((manual) => (
              <div key={manual.id} className="group rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5 hover:border-brand-300 dark:hover:border-brand-700 transition-all hover:shadow-lg">
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
                  <Button size="sm" variant="outline">
                    Ver
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <ComponentCard title="Recursos Adicionales">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a href="#" className="flex items-center gap-4 p-4 rounded-lg border border-border-light dark:border-white/10 hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
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

            <a href="#" className="flex items-center gap-4 p-4 rounded-lg border border-border-light dark:border-white/10 hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
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
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
