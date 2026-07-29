import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Modal, ModalBody, ModalHeader } from "../../components/ui/modal";
import { manualsService, Manual } from "../../features/manuals/services/manualsService";
import { useToast } from "../../context/toast";
import { TOAST } from "../../components/ui/dialog/DialogConfig";

// ── Manuales locales (PDFs estáticos en /public) ──────────────────────
interface LocalManual {
  id: string;
  title: string;
  description: string;
  category: string;
  fileType: string;
  fileName: string;
  color: string;
}

const LOCAL_MANUALS: LocalManual[] = [
  {
    id: "local-instalacion",
    title: "Manual de Instalación",
    description: "Guía completa para la instalación del sistema UNEFA Dashboard, incluyendo requisitos, configuración del entorno y despliegue.",
    category: "Instalación",
    fileType: "PDF",
    fileName: "manual-instalacion.pdf",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "local-sistema",
    title: "Manual del Sistema",
    description: "Documentación técnica del sistema: arquitectura, módulos, base de datos y guía de administración para el personal técnico.",
    category: "Sistema",
    fileType: "PDF",
    fileName: "manual-sistema.pdf",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    id: "local-usuario",
    title: "Manual del Usuario",
    description: "Guía de uso para usuarios del sistema: navegación, funcionalidades principales y resolución de problemas comunes.",
    category: "Usuario",
    fileType: "PDF",
    fileName: "manual-usuario.pdf",
    color: "from-amber-500 to-orange-600",
  },
];

function pdfUrl(fileName: string) {
  return `/${fileName}`;
}

// ── Helpers de UI ─────────────────────────────────────────────────────
const getCategoryColor = (category: string) => {
  const colors: Record<string, "primary" | "success" | "warning" | "error"> = {
    "General": "primary",
    "Inscripciones": "success",
    "Seguimiento": "warning",
    "Reportes": "primary",
    "Configuración": "error",
    "Videos": "primary",
    "Instalación": "primary",
    "Sistema": "success",
    "Usuario": "warning",
  };
  return colors[category] || "primary";
};

const PDF_ICON = (
  <svg className="w-8 h-8 text-error-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h4v2h-4v-2zm0 4h4v2h-4v-2zm8-6H7v8h10v-8z" />
  </svg>
);



// ── Componente principal ──────────────────────────────────────────────
export default function ManualsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  // ── Fetch manuales del backend ──────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await manualsService.getAll();
      if (res.success) setManuals(res.data);
    } catch (error) {
      console.error("Error fetching manuals:", error);
      addToast(TOAST.loadError());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Combinar manuales locales + API ────────────────────────────────
  const localItems = LOCAL_MANUALS.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    category: m.category,
    fileType: m.fileType,
    fileSize: "",
    fileUrl: pdfUrl(m.fileName),
    version: "1.0",
    status: 1,
    createdAt: "",
    updatedAt: "",
    isLocal: true,
    color: m.color,
    fileName: m.fileName,
  }));

  const apiItems = manuals.map((m) => ({
    ...m,
    isLocal: false,
    fileUrl: m.fileUrl || "",
    color: "",
    fileName: "",
  }));

  const allManuals = [...localItems, ...apiItems];

  // ── PDF preview ────────────────────────────────────────────────────
  const openPreview = (url: string, title: string) => {
    setPreviewPdf(url);
    setPreviewTitle(title);
  };

  const closePreview = () => {
    setPreviewPdf(null);
    setPreviewTitle("");
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <>
      <PageMeta title="Manuales" description="Documentación y manuales del sistema" />
      <PageBreadcrumb pageTitle="Manuales" />

      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Manuales y Documentación
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Accede a los manuales del sistema
            </p>
          </div>
        </div>

        {/* Grid de manuales */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface overflow-hidden animate-pulse"
              >
                <div className="h-2 bg-gray-200 dark:bg-gray-700" />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                  </div>
                </div>
              </div>
            ))
          ) : allManuals.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-text-tertiary mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-text-primary dark:text-text-emphasis">
                No hay manuales
              </h3>
              <p className="text-sm text-text-tertiary mt-1">
                No se encontraron manuales con los filtros aplicados.
              </p>
            </div>
          ) : (
            allManuals.map((manual: any) => (
              <div
                key={manual.id}
                className="group relative rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-700"
              >
                {/* Barra superior de color (solo manuales locales) */}
                <div
                  className={`h-2 w-full bg-gradient-to-r ${
                    (manual as any).color || "from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700"
                  }`}
                />

                <div className="p-5">
                  {/* Ícono + título + badge */}
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 shrink-0">
                      {PDF_ICON}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary dark:text-text-emphasis line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {manual.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge
                          color={getCategoryColor(manual.category)}
                          variant="light"
                          shape="rounded"
                          className="text-[10px]"
                        >
                          {manual.category}
                        </Badge>
                        <span className="text-xs text-text-tertiary">
                          v{manual.version}
                        </span>
                        {manual.fileSize && (
                          <>
                            <span className="text-text-tertiary">•</span>
                            <span className="text-xs text-text-tertiary">
                              {manual.fileSize}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="mt-3 text-sm text-text-secondary dark:text-text-tertiary line-clamp-2 leading-relaxed">
                    {manual.description}
                  </p>

                  {/* Acciones */}
                  <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark flex items-center gap-2 flex-wrap">
                    {manual.isLocal ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPreview(manual.fileUrl, manual.title)}
                          className="flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Vista Previa
                        </Button>
                        <a
                          href={manual.fileUrl}
                          download={manual.fileName}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary dark:text-text-tertiary hover:bg-bg-secondary dark:hover:bg-white/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Descargar
                        </a>
                        <a
                          href={manual.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary dark:text-text-tertiary hover:bg-bg-secondary dark:hover:bg-white/5 transition-colors ml-auto"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Abrir
                        </a>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" className="ml-auto">
                        Ver
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Modal de vista previa PDF ────────────────────────────────── */}
      <Modal
        isOpen={!!previewPdf}
        onClose={closePreview}
        size="5xl"
        modalId="pdf-preview-modal"
      >
        <ModalHeader>
          <div className="flex items-center gap-3">
            {PDF_ICON}
            <span>{previewTitle || "Vista previa"}</span>
          </div>
        </ModalHeader>
        <ModalBody className="p-0 overflow-hidden">
          {previewPdf && (
            <iframe
              src={previewPdf}
              className="w-full h-[80vh] border-0"
              title={previewTitle}
            />
          )}
        </ModalBody>
      </Modal>
    </>
  );
}
