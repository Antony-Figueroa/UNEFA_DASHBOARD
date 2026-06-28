import type { ReactNode } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";

import { PlusCircleIcon } from "../../../icons/actions";
import { CrudConfirmDialog, CrudConfirmState } from "./CrudConfirmDialog";

export interface CrudLayoutProps {
  title: string;
  description?: string;
  breadcrumbLabel?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  children: ReactNode;
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
          <Button onClick={onPrimaryAction} className="sm:w-auto" startIcon={<PlusCircleIcon className="w-5 h-5" />} loadingText="Guardando...">
            {primaryActionLabel}
          </Button>
        )}
      </div>

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
