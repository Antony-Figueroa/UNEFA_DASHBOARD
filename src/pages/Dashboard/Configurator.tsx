import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import toast from 'react-hot-toast';
import { useDragAndDrop } from '@formkit/drag-and-drop/react';
import {
  WIDGET_REGISTRY,
  getWidgetsByRole,
  WIDGET_SIZE_CLASSES,
  type WidgetSize,
} from '../../features/dashboard/constants/widgetRegistry';
import {
  dashboardLayoutService,
  type DashboardWidget,
} from '../../features/dashboard/services/dashboardLayoutService';
import WidgetSizeSelector from '../../features/dashboard/components/widget-config/WidgetSizeSelector';
import WidgetColorPicker from '../../features/dashboard/components/widget-config/WidgetColorPicker';
import { rolesService, type Role } from '../../features/roles/services/rolesService';

// ─── Iconos inline ───────────────────────────────────────────────────────────

const DragHandle = () => (
  <svg className="drag-handle-config size-5 text-gray-400 shrink-0 cursor-grab active:cursor-grabbing" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
  </svg>
);

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <svg className={`size-4 ${visible ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {visible ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    ) : null}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    {!visible && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />}
  </svg>
);

const XIcon = () => (
  <svg className="size-4 text-red-400 hover:text-red-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlusIcon = () => (
  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const WidgetIcon = ({ icon, color }: { icon: string; color?: string }) => {
  const size = 'size-5';
  const accent = color ?? '#054F94';
  const props = {
    className: `${size} shrink-0`,
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 2,
    style: { color: accent },
  };

  switch (icon) {
    case 'activity': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'trending-up': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
    case 'pie-chart': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
    case 'check-circle': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'users': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    case 'building': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    case 'calendar': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case 'inbox': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;
    case 'clock': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'briefcase': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    case 'list': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
    case 'zap': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'file-text': return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    case 'bar-chart-3':
    default: return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  }
};

// ─── Size info ───────────────────────────────────────────────────────────────

const SIZE_LABELS: Record<WidgetSize, { label: string; cols: string }> = {
  xs: { label: '1/4', cols: 'col-span-3' },
  sm: { label: '1/3', cols: 'col-span-4' },
  md: { label: '1/2', cols: 'col-span-6' },
  lg: { label: '2/3', cols: 'col-span-8' },
  xl: { label: 'Full', cols: 'col-span-12' },
};

// ─── Componente Principal ────────────────────────────────────────────────────

export default function DashboardConfigurator() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);

  // ── FormKit Drag & Drop ────────────────────────────────────────────────────
  // dndWidgets is the single source of truth — FormKit keeps display order

  const [parentRef, dndWidgets, setDndWidgets] = useDragAndDrop<HTMLDivElement, DashboardWidget>(
    [],
    {
      dragHandle: '.drag-handle-config',
      draggingClass: 'opacity-50 shadow-lg ring-2 ring-blue-400 scale-[1.02]',
      dropZoneClass: 'ring-2 ring-blue-300 dark:ring-blue-500',
    },
  );

  // ── Carga de Roles ──────────────────────────────────────────────────────────

  useEffect(() => {
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const res = await rolesService.getAll();
        if (res.success) {
          // Solo roles activos, ordenados por ID
          const active = res.data
            .filter(r => r.status === 'active')
            .sort((a, b) => a.id - b.id);
          setRoles(active);
          // Si el rol seleccionado ya no existe, resetear al primero
          if (active.length > 0 && !active.find(r => r.id === selectedRoleId)) {
            setSelectedRoleId(active[0].id);
          }
        }
      } catch (err) {
        console.error('[DashboardConfig] Error loading roles:', err);
        toast.error('Error al cargar los roles');
      } finally {
        setRolesLoading(false);
      }
    };
    loadRoles();
  }, []);

  // ── Carga ──────────────────────────────────────────────────────────────────

  const loadLayout = useCallback(async (roleId: number) => {
    setLoading(true);
    try {
      const layout = await dashboardLayoutService.getByRole(roleId);
      setDndWidgets(layout.widgets ?? []);
    } catch {
      setDndWidgets([]);
    } finally {
      setLoading(false);
    }
  }, [setDndWidgets]);

  useEffect(() => {
    loadLayout(selectedRoleId);
  }, [selectedRoleId, loadLayout]);

  const availableWidgets = getWidgetsByRole(selectedRoleId)
    .filter(def => !dndWidgets.some(w => w.key === def.key));

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const addWidget = (key: string) => {
    setDndWidgets(prev => {
      if (prev.some(w => w.key === key)) return prev;
      const maxOrder = prev.reduce((max, w) => Math.max(max, w.order), -1);
      return [...prev, { key, order: maxOrder + 1, visible: true }];
    });
  };

  const removeWidget = (key: string) => {
    setDndWidgets(prev => prev.filter(w => w.key !== key));
  };

  const toggleVisibility = (key: string) => {
    setDndWidgets(prev =>
      prev.map(w => w.key === key ? { ...w, visible: !w.visible } : w)
    );
  };

  const updateWidgetSize = (key: string, size: WidgetSize | undefined) => {
    setDndWidgets(prev =>
      prev.map(w => w.key === key ? { ...w, size } : w)
    );
  };

  const updateWidgetColor = (key: string, color: string | undefined) => {
    setDndWidgets(prev =>
      prev.map(w => w.key === key ? { ...w, color } : w)
    );
  };

  // ── Persistir ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalized = dndWidgets.map((w, i) => ({ ...w, order: i }));
      await dashboardLayoutService.save(selectedRoleId, normalized);
      toast.success('Layout del dashboard guardado exitosamente');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar el layout');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      toast.loading('Restableciendo...');
      const layout = await dashboardLayoutService.reset(selectedRoleId);
      setDndWidgets(layout.widgets ?? []);
      toast.dismiss();
      toast.success('Layout restablecido a valores por defecto');
    } catch {
      toast.dismiss();
      toast.error('Error al restablecer el layout');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <PageMeta
        title="Configurar Dashboards | SIGP - UNEFA"
        description="Personaliza los dashboards para cada rol del sistema"
      />

      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Dashboard Config" />

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configurador de Dashboards
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Personalizá qué widgets ve cada rol, el orden, el tamaño y el color de acento.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" onClick={handleReset} disabled={loading || saving} size="sm">
              Restablecer
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={loading || saving} size="sm" loading={saving} loadingText="Guardando...">
              Guardar Layout
            </Button>
          </div>
        </div>

        {/* ── Role Pills ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-1">
            Rol:
          </span>
          {rolesLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`
                  rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150
                  ${selectedRoleId === role.id
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900/30'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:border-gray-600'
                  }
                `}
              >
                <span>{role.name}</span>
                {role.isSystem && (
                  <span className="ml-1.5 text-[10px] opacity-60">&#9679;</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        ) : rolesLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <svg className="w-8 h-8 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Cargando roles...</span>
          </div>
        ) : (
          <>
            {/* ═══ Grilla principal ═══ */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
              {/* ─── COLUMNA: Widgets Activos ─── */}
              <ComponentCard
                title={
                  <span>
                    Widgets Activos
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({dndWidgets.length})
                    </span>
                  </span>
                }
                desc="Arrastrá para reordenar · Usá color y tamaño para personalizar"
              >
                <div ref={parentRef} className="space-y-2">
                  {dndWidgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                        No hay widgets activos
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Agregalos desde el panel de disponibles
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {dndWidgets.map((widget) => {
                        const def = WIDGET_REGISTRY[widget.key];
                        if (!def) return null;

                        const accent = widget.color ?? '#054F94';

                        return (
                          <motion.div
                            key={widget.key}
                            layout
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div
                              className={`
                                relative rounded-xl border bg-white shadow-sm
                                dark:bg-gray-900
                                transition-all duration-150 overflow-hidden
                                ${widget.visible
                                  ? 'border-border-light dark:border-border-dark'
                                  : 'border-dashed border-gray-300 dark:border-gray-600'
                                }
                              `}
                              style={{
                                borderLeftColor: accent,
                                borderLeftWidth: widget.visible ? 3 : 2,
                              }}
                            >
                              {/* Fila superior: ícono, info, acciones */}
                              <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                  <DragHandle />
                                  <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <WidgetIcon icon={def.icon} color={accent} />
                                    <div className="min-w-0 flex-1">
                                      <p className={`text-sm font-medium truncate leading-tight
                                        ${widget.visible
                                          ? 'text-gray-800 dark:text-white/90'
                                          : 'text-gray-400 dark:text-gray-500'
                                        }`}
                                      >
                                        {def.displayName}
                                      </p>
                                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                        {def.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <WidgetColorPicker
                                    value={widget.color}
                                    onChange={(c) => updateWidgetColor(widget.key, c)}
                                  />
                                  <button
                                    onClick={() => toggleVisibility(widget.key)}
                                    className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title={widget.visible ? 'Ocultar' : 'Mostrar'}
                                  >
                                    <EyeIcon visible={widget.visible} />
                                  </button>
                                  <button
                                    onClick={() => removeWidget(widget.key)}
                                    className="rounded-lg p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    title="Quitar"
                                  >
                                    <XIcon />
                                  </button>
                                </div>
                              </div>

                              {/* Fila inferior: selector de tamaño */}
                              <div className="px-4 pb-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">
                                    Tamaño
                                  </span>
                                  <WidgetSizeSelector
                                    value={widget.size ?? def.size}
                                    onChange={(size) => updateWidgetSize(widget.key, size)}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </ComponentCard>

              {/* ─── COLUMNA: Widgets Disponibles ─── */}
              <ComponentCard
                title={
                  <span>
                    Disponibles
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({availableWidgets.length})
                    </span>
                  </span>
                }
                desc="Hacé clic para agregar al dashboard"
              >
                <div className="space-y-2">
                  {availableWidgets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                        Todos los widgets están en uso
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {availableWidgets.map(def => (
                        <button
                          key={def.key}
                          onClick={() => addWidget(def.key)}
                          className="group flex items-center gap-3 rounded-xl border border-border-light bg-white px-4 py-3
                                     shadow-sm hover:border-blue-200 hover:shadow-md hover:bg-blue-50/30
                                     dark:border-border-dark dark:bg-gray-900
                                     dark:hover:border-blue-700 dark:hover:bg-blue-500/5
                                     transition-all duration-150 text-left w-full"
                        >
                          <WidgetIcon icon={def.icon} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {def.displayName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 uppercase">
                                {def.size}
                              </span>
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                {def.module}
                              </span>
                            </div>
                          </div>
                          <span className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600
                                           dark:bg-blue-500/10 dark:text-blue-400
                                           group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors shrink-0">
                            <PlusIcon />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ComponentCard>
            </div>

            {/* ═══ Preview ═══ */}
            {dndWidgets.length > 0 && (
              <ComponentCard
                title="Vista Previa del Layout"
                headerAction={
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {dndWidgets.filter(w => w.visible).length} widgets visibles
                  </span>
                }
              >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  {dndWidgets
                    .filter(w => w.visible)
                    .map(widget => {
                      const def = WIDGET_REGISTRY[widget.key];
                      if (!def) return null;
                      const effectiveSize = widget.size ?? def.size;
                      const sizeClass = WIDGET_SIZE_CLASSES[effectiveSize] || WIDGET_SIZE_CLASSES.sm;
                      const accent = widget.color ?? '#054F94';
                      const sizeInfo = SIZE_LABELS[effectiveSize];

                      return (
                        <div
                          key={widget.key}
                          className={`${sizeClass} rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 min-h-[80px] transition-colors`}
                          style={{
                            borderColor: `${accent}40`,
                            backgroundColor: `${accent}08`,
                          }}
                        >
                          <WidgetIcon icon={def.icon} color={accent} />
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 text-center leading-tight">
                            {def.displayName}
                          </p>
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${accent}15`,
                              color: accent,
                            }}
                          >
                            {sizeInfo?.label ?? effectiveSize}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </ComponentCard>
            )}
          </>
        )}
      </div>
    </>
  );
}
