import React, { useState, useEffect, useRef } from "react";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

/**
 * Componente base para Skeleton Loaders con animación shimmer.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  circle = false,
}) => {
  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`skeleton ${circle ? "rounded-full" : "rounded-lg"} ${className}`}
      style={style}
    />
  );
};

interface SkeletonLoaderProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  duration?: number;
  id?: string; // ID para monitoreo
  monitor?: boolean; // Habilitar/deshabilitar monitoreo
}

/**
 * Componente que orquesta la visualización de skeletons con una duración mínima.
 * Asegura que el skeleton se muestre al menos durante 'duration' ms para evitar parpadeos.
 * Incluye un sistema de monitoreo para detectar discrepancias de tamaño (Layout Shift).
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  isLoading,
  skeleton,
  children,
  duration = 500,
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

  // Monitoreo de discrepancias
  useEffect(() => {
    if (!monitor) return;
    if (isLoading && skeletonRef.current) {
      const rect = skeletonRef.current.getBoundingClientRect();
      setSkeletonSize({ width: rect.width, height: rect.height });
    }
  }, [isLoading, monitor]);

  useEffect(() => {
    if (!monitor) return;
    if (!isLoading && minTimeElapsed && contentRef.current && skeletonSize) {
      const rect = contentRef.current.getBoundingClientRect();
      const widthDiff = Math.abs(rect.width - skeletonSize.width);
      const heightDiff = Math.abs(rect.height - skeletonSize.height);

      // Si la diferencia es mayor a 20px, alertar discrepancia (Layout Shift)
      if (widthDiff > 20 || heightDiff > 20) {
        console.warn(
          `[Skeleton Monitoring] Discrepancia detectada en "${id}":`,
          `Skeleton: ${skeletonSize.width}x${skeletonSize.height}px,`,
          `Real: ${rect.width}x${rect.height}px.`,
          `Diferencia: ${widthDiff.toFixed(1)}px ancho, ${heightDiff.toFixed(1)}px alto.`
        );
      }
    }
  }, [isLoading, minTimeElapsed, skeletonSize, id, monitor]);

  const showContent = !isLoading && minTimeElapsed;

  return (
    <div className="skeleton-loader-container w-full" data-loading={isLoading} data-min-time={minTimeElapsed}>
      {showContent ? (
        <div ref={contentRef} className="animate-fade-in">{children}</div>
      ) : (
        <div ref={skeletonRef} className="animate-pulse">{skeleton}</div>
      )}
    </div>
  );
};

/**
 * Skeleton específico para el título de la página y su descripción.
 */
export const TitleSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton height={32} className="w-56" />
        <Skeleton height={24} width={70} className="rounded-full" />
      </div>
      <Skeleton height={20} className="w-96 max-w-full" />
    </div>
  );
};

/**
 * Skeleton específico para un input de búsqueda o filtro.
 */
export const SearchFilterSkeleton: React.FC = () => {
  return <Skeleton height={42} className="w-full sm:w-64" />;
};

/**
 * Skeleton específico para el breadcrumb de la página.
 */
export const BreadcrumbSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-start justify-between gap-3 mb-6">
      <Skeleton height={20} className="w-32" />
      <Skeleton height={28} className="w-48" />
    </div>
  );
};

/**
 * Skeleton específico para una tabla de datos completa.
 * Simplificado para mostrar menos elementos de carga.
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="table-container p-6 space-y-6 animate-pulse">
      <div className="flex gap-4 mb-4">
        <Skeleton height={20} className="w-1/4" />
        <Skeleton height={20} className="w-1/4" />
        <Skeleton height={20} className="w-1/4" />
        <Skeleton height={20} className="w-1/4" />
      </div>
      <div className="h-px bg-gray-100 dark:bg-gray-800" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton height={40} className="flex-1" />
          <Skeleton height={40} className="flex-1" />
          <Skeleton height={40} className="flex-1" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton simplificado para una página con tabla (solo contenedor).
 */
export const TablePageSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="table-container animate-pulse">
      {/* Área de Filtros/Botones simplificada */}
      <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton height={40} className="w-1/3" />
          <Skeleton height={40} className="w-32" />
        </div>
      </div>

      {/* Cuerpo de tabla simplificado */}
      <div className="p-4 space-y-4">
        {[...Array(rows)].map((_, i) => (
          <Skeleton key={i} height={60} className="w-full" />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton para tarjetas de métricas tipo dashboard.
 */
export const MetricsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
          <Skeleton height={48} width={48} className="rounded-xl mb-5" />
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <Skeleton height={14} width={80} />
              <Skeleton height={24} width={60} />
            </div>
            <Skeleton height={24} width={60} className="rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton para gráficos (donuts, barras, líneas).
 */
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 350 }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
      <Skeleton height={24} width={150} className="mb-6" />
      <Skeleton height={height} className="w-full" />
    </div>
  );
};

/**
 * Skeleton para perfiles de usuario.
 */
export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col items-center gap-6 xl:flex-row">
          <Skeleton circle height={80} width={80} />
          <div className="flex-1 space-y-2 text-center xl:text-left">
            <Skeleton height={24} width={200} className="mx-auto xl:mx-0" />
            <Skeleton height={18} width={150} className="mx-auto xl:mx-0" />
          </div>
          <div className="flex gap-2">
            <Skeleton circle height={44} width={44} />
            <Skeleton circle height={44} width={44} />
            <Skeleton circle height={44} width={44} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <Skeleton height={20} width={120} className="mb-4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton height={16} width={80} />
                <Skeleton height={16} width={120} />
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <Skeleton height={20} width={120} className="mb-4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton height={16} width={80} />
                <Skeleton height={16} width={120} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
