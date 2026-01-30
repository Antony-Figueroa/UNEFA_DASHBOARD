import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../../utils/cn";

/**
 * Propiedades para el componente Skeleton.
 */
export interface SkeletonProps {
  /** Clases CSS adicionales. */
  className?: string;
  /** Ancho explícito (ej: '100px', 200). */
  width?: string | number;
  /** Altura explícita (ej: '20px', 40). */
  height?: string | number;
  /** Si el skeleton debe ser circular (ej: para avatares). */
  circle?: boolean;
  /** Variante de animación. Por defecto 'pulse'. */
  animation?: "pulse" | "shimmer" | "none";
}

/**
 * Componente Skeleton base para representar estados de carga.
 * Proporciona una forma visual temporal mientras se cargan los datos reales.
 * 
 * @component
 * @example
 * ```tsx
 * <Skeleton width={100} height={20} />
 * <Skeleton circle className="w-10 h-10" />
 * <Skeleton className="h-4 w-full" animation="shimmer" />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  circle = false,
  animation = "pulse",
}) => {
  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-bg-secondary dark:bg-white/5",
        animation === "pulse" && "animate-pulse",
        animation === "shimmer" && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-linear-to-r before:from-transparent before:via-white/10 before:to-transparent dark:before:via-white/5",
        circle ? "rounded-full" : "rounded-md",
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
};

/**
 * Propiedades para el componente SkeletonLoader.
 */
export interface SkeletonLoaderProps {
  /** Indica si los datos aún se están cargando. */
  isLoading: boolean;
  /** El componente skeleton a mostrar mientras se carga. */
  skeleton: React.ReactNode;
  /** El contenido real a mostrar una vez finalizada la carga. */
  children: React.ReactNode;
  /** Duración mínima para mostrar el skeleton y evitar parpadeos (ms). Por defecto 400. */
  duration?: number;
  /** ID único para depuración de desplazamientos de diseño. */
  id?: string;
  /** Si se debe habilitar el monitoreo de desplazamientos de diseño (CLS). */
  monitor?: boolean;
}

/**
 * Componente orquestador para cargadores skeleton.
 * Evita el parpadeo de la interfaz asegurando un tiempo mínimo de visualización del skeleton.
 * 
 * @component
 * @example
 * ```tsx
 * <SkeletonLoader 
 *   isLoading={loading} 
 *   skeleton={<ProfileSkeleton />}
 * >
 *   <ProfileContent data={data} />
 * </SkeletonLoader>
 * ```
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  isLoading,
  skeleton,
  children,
  duration = 400,
  id = "unnamed-loader",
  monitor = false,
}) => {
  const [minTimeElapsed, setMinTimeElapsed] = useState(!isLoading);
  const skeletonRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [skeletonSize, setSkeletonSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isLoading) {
      setMinTimeElapsed(false);
      timer = setTimeout(() => {
        setMinTimeElapsed(true);
      }, duration);
    } else {
      setMinTimeElapsed(true);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, duration]);

  useEffect(() => {
    if (monitor && skeletonRef.current && isLoading) {
      const { width, height } = skeletonRef.current.getBoundingClientRect();
      setSkeletonSize({ width, height });
    }
  }, [isLoading, monitor]);

  useEffect(() => {
    if (monitor && !isLoading && contentRef.current && skeletonSize) {
      const { width, height } = contentRef.current.getBoundingClientRect();
      const widthDiff = Math.abs(width - skeletonSize.width);
      const heightDiff = Math.abs(height - skeletonSize.height);

      if (widthDiff > 50 || heightDiff > 50) {
        console.warn(
          `[SkeletonLoader:${id}] Desplazamiento de diseño (CLS) detectado:`,
          { widthDiff, heightDiff }
        );
      }
    }
  }, [isLoading, skeletonSize, monitor, id]);

  const showSkeleton = isLoading || !minTimeElapsed;

  return (
    <>
      {showSkeleton ? (
        <div ref={skeletonRef} className="animate-in fade-in duration-300">
          {skeleton}
        </div>
      ) : (
        <div ref={contentRef} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      )}
    </>
  );
};

/**
 * Skeleton para el encabezado de página (Título y Badge).
 */
export const TitleSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton height={32} className="w-64" />
        <Skeleton height={24} width={80} className="rounded-full" />
      </div>
      <Skeleton height={20} className="w-full max-w-md opacity-70" />
    </div>
  );
};

/**
 * Skeleton para barras de búsqueda o filtros.
 */
export const SearchFilterSkeleton: React.FC = () => {
  return <Skeleton height={44} className="w-full sm:w-72 rounded-xl" />;
};

/**
 * Skeleton para breadcrumbs y títulos de sección.
 */
export const BreadcrumbSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-start gap-4 mb-8">
      <Skeleton height={18} className="w-36" />
      <Skeleton height={32} className="w-56" />
    </div>
  );
};

/**
 * Skeleton para una tabla de datos genérica.
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl border border-border-light dark:border-border-dark p-6 space-y-6">
      <div className="flex gap-4 mb-4 opacity-50">
        <Skeleton height={20} className="w-1/4" />
        <Skeleton height={20} className="w-1/4" />
        <Skeleton height={20} className="w-1/4" />
        <Skeleton height={20} className="w-1/4" />
      </div>
      <div className="h-px bg-border-light dark:bg-border-dark" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton height={48} className="flex-1 rounded-xl" />
          <Skeleton height={48} className="flex-1 rounded-xl" />
          <Skeleton height={48} className="flex-1 rounded-xl" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton para una página completa con tabla.
 */
export const TablePageSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="space-y-6">
      <TitleSkeleton />
      <div className="bg-white dark:bg-bg-dark rounded-2xl border border-border-light dark:border-border-dark overflow-hidden">
        <div className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-bg-secondary/30">
          <Skeleton height={44} className="w-full max-w-xs rounded-xl" />
          <Skeleton height={44} className="w-32 rounded-xl" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(rows)].map((_, i) => (
            <Skeleton key={i} height={64} className="w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton para tarjetas de métricas del dashboard.
 */
export const MetricsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border-light bg-white p-5 dark:border-border-dark dark:bg-white/5 md:p-6 shadow-sm">
          <Skeleton height={48} width={48} className="rounded-2xl mb-5" />
          <div className="space-y-3">
            <Skeleton height={14} className="w-1/2 opacity-60" />
            <div className="flex items-end justify-between">
              <Skeleton height={32} className="w-20" />
              <Skeleton height={20} className="w-12 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton para gráficos (donuts, barras, líneas).
 */
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 320 }) => {
  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 dark:border-border-dark dark:bg-white/5 md:p-6 shadow-sm">
      <Skeleton height={24} width={180} className="mb-6" />
      <Skeleton height={height} className="w-full rounded-xl opacity-60" animation="shimmer" />
    </div>
  );
};

/**
 * Skeleton para perfiles de usuario y vistas de detalle.
 */
export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 border border-border-light rounded-2xl bg-white dark:bg-white/5 dark:border-border-dark lg:p-8 shadow-sm">
        <div className="flex flex-col items-center gap-6 xl:flex-row">
          <Skeleton circle height={100} width={100} className="ring-4 ring-bg-secondary dark:ring-white/10" />
          <div className="flex-1 space-y-3 text-center xl:text-left">
            <Skeleton height={28} width={240} className="mx-auto xl:mx-0" />
            <Skeleton height={18} width={160} className="mx-auto xl:mx-0 opacity-70" />
          </div>
          <div className="flex gap-3">
            <Skeleton circle height={48} width={48} />
            <Skeleton circle height={48} width={48} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-6 border border-border-light bg-white rounded-2xl dark:border-border-dark dark:bg-white/5 lg:p-8 shadow-sm">
            <Skeleton height={20} width={140} className="mb-6" />
            <div className="space-y-5">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex justify-between items-center">
                  <Skeleton height={14} width={100} className="opacity-60" />
                  <Skeleton height={14} width={140} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
