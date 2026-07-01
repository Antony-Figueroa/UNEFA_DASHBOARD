import { useMemo, useState } from "react";
import { CrudTable } from "../../features/crudTemplate/components/CrudTable";
import { CrudForm, CrudFieldConfig, CrudFormValues } from "../../features/crudTemplate/components/CrudForm";
import { CrudLayout } from "../../features/crudTemplate/components/CrudLayout";
import { useCrudResource, CrudService } from "../../features/crudTemplate/hooks/useCrudResource";
import { useToast } from "../../context/toast";
import type { CrudColumn, CrudFilterConfig } from "../../features/crudTemplate/types";
import { Modal, ModalHeader, ModalBody } from "../../components/ui/modal";
import BarChartOne from "../../components/charts/bar/BarChartOne";
import LineChartOne from "../../components/charts/line/LineChartOne";
import { SkeletonLoader, TablePageSkeleton, ChartSkeleton } from "../../components/ui/skeleton";

type ExampleStatus = "activo" | "inactivo";

interface ExampleEntity {
  id: string;
  name: string;
  code: string;
  average: number;
  status: ExampleStatus;
  tags: string[];
}

const mockData: ExampleEntity[] = [
  { id: "1", name: "Elemento Alfa", code: "ALF-01", average: 14.5, status: "activo", tags: ["A", "B"] },
  { id: "2", name: "Elemento Beta", code: "BET-02", average: 16.2, status: "activo", tags: ["B"] },
  { id: "3", name: "Elemento Gamma", code: "GAM-03", average: 12.9, status: "inactivo", tags: ["C"] },
];

const inMemoryService: CrudService<ExampleEntity> = {
  async list() {
    return Promise.resolve(mockData);
  },
  async create(data) {
    const next: ExampleEntity = {
      ...(data as Omit<ExampleEntity, "id">),
      id: String(Date.now()),
    };
    mockData.push(next);
    return Promise.resolve(next);
  },
  async update(data) {
    const index = mockData.findIndex((item) => item.id === data.id);
    if (index >= 0) {
      mockData[index] = data;
    }
    return Promise.resolve(data);
  },
  async remove(data) {
    const index = mockData.findIndex((item) => item.id === data.id);
    if (index >= 0) {
      mockData.splice(index, 1);
    }
    return Promise.resolve();
  },
};

export default function CrudExample() {
  const [activeStatusFilter, setActiveStatusFilter] = useState<ExampleStatus | "todos">("todos");
  const [filtersState, setFiltersState] = useState<Record<string, string | string[]>>({});
  const [confirmState, setConfirmState] = useState<import("../../features/crudTemplate/components/CrudConfirmDialog").CrudConfirmState | null>(null);
  const [editingItem, setEditingItem] = useState<ExampleEntity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const { items, status, error, loadingAction, createItem, updateItem, removeItem } = useCrudResource<ExampleEntity>({
    service: inMemoryService,
  });

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeStatusFilter !== "todos" && item.status !== activeStatusFilter) {
        return false;
      }
      return true;
    });
  }, [items, activeStatusFilter]);

  const columns: CrudColumn<ExampleEntity>[] = [
    {
      id: "code",
      header: "Código",
      sortable: true,
      accessor: (item) => item.code,
    },
    {
      id: "name",
      header: "Nombre",
      sortable: true,
      accessor: (item) => item.name,
    },
    {
      id: "average",
      header: "Nota promedio",
      sortable: true,
      accessor: (item) => item.average,
    },
    {
      id: "status",
      header: "Estado",
      sortable: true,
      accessor: (item) => item.status,
    },
  ];

  const filters: CrudFilterConfig[] = [
    {
      id: "search",
      label: "Buscar",
      type: "search",
      placeholder: "Buscar por nombre o código",
    },
  ];

  const formFields: CrudFieldConfig[] = [
    {
      name: "name",
      label: "Nombre",
      type: "text",
      required: true,
      minLength: 3,
    },
    {
      name: "code",
      label: "Código",
      type: "text",
      required: true,
    },
    {
      name: "average",
      label: "Nota promedio",
      type: "number",
      required: true,
      min: 0,
      max: 20,
    },
    {
      name: "status",
      label: "Activo",
      type: "switch",
    },
    {
      name: "tags",
      label: "Etiquetas",
      type: "multi-select",
      options: [
        { value: "A", label: "Etiqueta A" },
        { value: "B", label: "Etiqueta B" },
        { value: "C", label: "Etiqueta C" },
      ],
      placeholder: "Seleccione etiquetas",
    },
  ];

  const initialFormValues = editingItem
    ? {
      name: editingItem.name,
      code: editingItem.code,
      average: editingItem.average,
      status: editingItem.status === "activo",
      tags: editingItem.tags,
    }
    : {
      status: true,
      tags: [] as string[],
    };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (values: CrudFormValues) => {
    const isEditing = Boolean(editingItem);
    const nextEntity: ExampleEntity = {
      id: editingItem?.id ?? "",
      name: String(values.name ?? ""),
      code: String(values.code ?? ""),
      average: Number(values.average ?? 0),
      status: values.status ? "activo" : "inactivo",
      tags: (values.tags as string[]) ?? [],
    };

    setConfirmState({
      isOpen: true,
      title: isEditing ? "Confirmar modificación" : "Confirmar creación",
      message: isEditing
        ? "¿Deseas guardar los cambios en este registro?"
        : "¿Deseas crear este nuevo registro?",
      confirmText: "Confirmar",
      variant: "info",
      onConfirm: async () => {
        try {
          if (isEditing && editingItem) {
            await updateItem(nextEntity);
          } else {
            const entityToCreate: Omit<ExampleEntity, "id"> = {
              name: nextEntity.name,
              code: nextEntity.code,
              average: nextEntity.average,
              status: nextEntity.status,
              tags: nextEntity.tags,
            };
            await createItem(entityToCreate);
          }
          setIsModalOpen(false);
        } catch (e) {
          console.error(e);
        } finally {
          setConfirmState(null);
        }
      },
    });
  };

  const handleBulkDelete = (selected: ExampleEntity[]) => {
    setConfirmState({
      isOpen: true,
      title: "Confirmar Desactivación Masiva",
      message: `¿Estás seguro de que deseas desactivar los ${selected.length} elementos seleccionados?`,
      confirmText: "Desactivar Todos",
      variant: "error",
      onConfirm: async () => {
        try {
          for (const item of selected) {
            await removeItem(item);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setConfirmState(null);
        }
      },
    });
  };

  const rowActions: import("../../features/crudTemplate/types").CrudRowAction<ExampleEntity>[] = [
    {
      id: "view",
      label: "Ver",
      icon: "view",
      onClick: (item) => {
        addToast({
          variant: "info",
          title: "Detalles del registro",
          message: `Viendo: ${item.name} (${item.code})`,
        });
      },
    },
    {
      id: "edit",
      label: "Editar",
      icon: "edit",
      onClick: (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
      },
      show: (item) => item.status === "activo",
    },
    {
      id: "restore",
      label: "Restaurar",
      icon: "restore",
      variant: "brand",
      onClick: async (item) => {
        try {
          await updateItem({ ...item, status: "activo" });
        } catch (e) {
          console.error(e);
        }
      },
      show: (item) => item.status === "inactivo",
    },
    {
      id: "delete",
      label: "Inactivar",
      icon: "delete",
      variant: "danger",
      onClick: (item) => {
        setConfirmState({
          isOpen: true,
          title: "Confirmar Desactivación",
          message: `¿Estás seguro de que deseas desactivar el elemento "${item.name}"?`,
          confirmText: "Desactivar",
          variant: "error",
          onConfirm: async () => {
            try {
              await removeItem(item);
            } catch (e) {
              console.error(e);
            } finally {
              setConfirmState(null);
            }
          },
        });
      },
      show: (item) => item.status === "activo",
    },
  ];

  const actions = [
    {
      id: "bulk-delete",
      label: "Eliminar seleccionados",
      variant: "danger" as const,
      onAction: handleBulkDelete,
    },
  ];

  const chartsSlot = (
    <>
      <div className="col-span-1">
        <SkeletonLoader
          isLoading={status === "loading"}
          id="crud-bar-chart"
          skeleton={<ChartSkeleton height={300} />}
        >
          <BarChartOne />
        </SkeletonLoader>
      </div>
      <div className="col-span-1">
        <SkeletonLoader
          isLoading={status === "loading"}
          id="crud-line-chart"
          skeleton={<ChartSkeleton height={300} />}
        >
          <LineChartOne />
        </SkeletonLoader>
      </div>
      <div className="col-span-1 flex items-center justify-center rounded-lg border border-dashed border-border-light p-4 text-sm text-text-secondary dark:border-border-dark dark:text-text-tertiary">
        Slot para gráficos adicionales
      </div>
    </>
  );

  const navigationSlot = (
    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
      <a href="/dashboard" className="text-brand-600 hover:underline">
        Ir al dashboard
      </a>
      <span className="text-text-tertiary">|</span>
      <a href="/careers" className="text-brand-600 hover:underline">
        Gestión de carreras
      </a>
      <span className="text-text-tertiary">|</span>
      <a href="/period" className="text-brand-600 hover:underline">
        Gestión de períodos
      </a>
    </div>
  );

  return (
    <>
      <CrudLayout
        title="Plantilla CRUD de Ejemplo"
        description="Ejemplo de vista de gestión reutilizable basada en TailAdmin"
        breadcrumbLabel="Plantilla CRUD"
        primaryActionLabel="Nuevo registro"
        onPrimaryAction={handleOpenCreate}
        confirmState={confirmState}
        onCloseConfirm={() => setConfirmState(null)}
        isLoadingConfirm={loadingAction}
        chartsSlot={chartsSlot}
        navigationSlot={navigationSlot}
      >
        <div className="flex items-center justify-between pb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveStatusFilter("todos")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${activeStatusFilter === "todos"
                ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80 dark:bg-white/5 dark:text-text-tertiary"
                }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter("activo")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${activeStatusFilter === "activo"
                ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80 dark:bg-white/5 dark:text-text-tertiary"
                }`}
            >
              Activos
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusFilter("inactivo")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${activeStatusFilter === "inactivo"
                ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80 dark:bg-white/5 dark:text-text-tertiary"
                }`}
            >
              Inactivos
            </button>
          </div>
        </div>

        <SkeletonLoader
          isLoading={status === "loading"}
          id="crud-table"
          skeleton={<TablePageSkeleton rows={5} />}
        >
          <CrudTable
            items={filteredItems}
            columns={columns}
            filters={filters}
            filterState={filtersState}
            onFilterChange={setFiltersState}
            actions={actions}
            rowActions={rowActions}
            loading={status === "loading"}
            errorMessage={error?.message ?? null}
          />
        </SkeletonLoader>
      </CrudLayout>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-2xl"
        showCloseButton
      >
        <ModalHeader>
          <div className="w-full">
            <span className="mb-1 text-2xl font-semibold text-text-primary dark:text-white/90">
              {editingItem ? "Editar registro" : "Nuevo registro"}
            </span>
            <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
              Completa la información del registro.
            </p>
          </div>
        </ModalHeader>
        <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
          <CrudForm
            fields={formFields}
            initialValues={initialFormValues}
            onSubmit={handleSubmitForm}
            isLoading={loadingAction}
            secondaryActionLabel="Cancelar"
            onSecondaryAction={() => setIsModalOpen(false)}
          />
        </ModalBody>
      </Modal>
    </>
  );
}
