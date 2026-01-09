import type { ReactNode } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Alert from "../../../components/ui/alert/Alert";
import Button from "../../../components/ui/button/Button";
import { PlusCircleIcon, XIcon } from "../../../icons/actions";
import { CrudConfirmDialog, CrudConfirmState } from "./CrudConfirmDialog";
import type { CrudPageAlert } from "../types";

export interface CrudLayoutProps {
  title: string;
  description?: string;
  breadcrumbLabel?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  children: ReactNode;
  alert?: CrudPageAlert | null;
  onCloseAlert?: () => void;
  confirmState: CrudConfirmState | null;
  onCloseConfirm: () => void;
  isLoadingConfirm?: boolean;
  chartsSlot?: ReactNode;
  navigationSlot?: ReactNode;
  cardTitle?: string;
}

/**
 * Layout de página para vistas de gestión CRUD.
 *
 * Encapsula meta tags, breadcrumb, acción primaria, alertas,
 * navegación contextual y slots de gráficos, manteniendo la
 * coherencia visual con el resto de TailAdmin.
 *
 * @param props Propiedades de configuración del layout CRUD.
 */
export function CrudLayout({
  title,
  description,
  breadcrumbLabel,
  primaryActionLabel,
  onPrimaryAction,
  children,
  alert,
  onCloseAlert,
  confirmState,
  onCloseConfirm,
  isLoadingConfirm = false,
  chartsSlot,
  navigationSlot,
  cardTitle,
}: CrudLayoutProps) {
  return (
    <>
      <PageMeta title={title} description={description ?? title} />

      <div className="flex items-center justify-between mb-6">
        <PageBreadcrumb pageTitle={breadcrumbLabel ?? title} />
        {primaryActionLabel && onPrimaryAction && (
          <Button onClick={onPrimaryAction} className="sm:w-auto">
            <PlusCircleIcon className="w-5 h-5" />
            <span className="ml-2">{primaryActionLabel}</span>
          </Button>
        )}
      </div>

      {alert && (
        <div className="relative mb-6">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
            showLink={false}
          />
          {onCloseAlert && (
            <button
              onClick={onCloseAlert}
              className="absolute right-4 top-4 text-text-secondary hover:text-text-primary dark:text-text-tertiary dark:hover:text-white/90"
              aria-label="Cerrar alerta"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {chartsSlot && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
          {chartsSlot}
        </div>
      )}

      <ComponentCard title={cardTitle ?? title}>
        {navigationSlot && (
          <div className="mb-4">
            {navigationSlot}
          </div>
        )}
        {children}
      </ComponentCard>

      <CrudConfirmDialog 
        state={confirmState} 
        onClose={onCloseConfirm} 
        isLoading={isLoadingConfirm}
      />
    </>
  );
}
