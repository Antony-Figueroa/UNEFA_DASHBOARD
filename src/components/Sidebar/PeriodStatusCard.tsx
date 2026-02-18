import React, { useMemo } from "react";
import { usePeriods } from "../../features/periods/hooks/usePeriods";
import { useSidebar } from "../../context/sidebar";
import { CalenderIcon, TimeIcon, AlertIcon } from "../../icons";
import { cn } from "../../utils/cn";
import { Skeleton } from "../ui/skeleton";

/**
 * Tarjeta que muestra el estatus del periodo académico actual o próximo.
 * Diseñada para integrarse en la parte inferior del sidebar.
 */
const PeriodStatusCard: React.FC = () => {
    const { periodos, status } = usePeriods();
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();

    const showContent = isExpanded || isHovered || isMobileOpen;

    // Lógica para encontrar el periodo actual o el próximo pendiente
    const displayPeriod = useMemo(() => {
        if (!periodos || periodos.length === 0) return null;

        // 1. Buscar periodo "En Curso" (periodStatus === 2)
        const current = periodos.find((p) => p.periodStatus === 2 && p.status);
        if (current) return { ...current, type: 'current' as const };

        // 2. Buscar el próximo "Pendiente" (periodStatus === 1)
        const pending = [...periodos]
            .filter((p) => p.periodStatus === 1 && p.status)
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        if (pending.length > 0) return { ...pending[0], type: 'next' as const };

        return null;
    }, [periodos]);

    if (status === "loading" && showContent) {
        return (
            <div className="mx-4 mb-6 p-4 rounded-2xl bg-bg-secondary/50 border border-border-light dark:border-white/5">
                <Skeleton height={16} width={96} className="mb-3" />
                <Skeleton height={12} width={128} />
            </div>
        );
    }

    // Si el sidebar está colapsado, mostramos una versión minimalista o nada
    if (!showContent) {
        return (
            <div className="flex flex-col items-center mb-6">
                <div
                    className={cn(
                        "p-2.5 rounded-xl border transition-colors",
                        displayPeriod?.type === 'current'
                            ? "bg-success-50 border-success-100 text-success-600 dark:bg-success-500/10 dark:border-success-500/20 dark:text-success-400"
                            : displayPeriod?.type === 'next'
                                ? "bg-brand-50 border-brand-100 text-brand-600 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400"
                                : "bg-gray-50 border-gray-100 text-gray-400 dark:bg-white/5 dark:border-white/10"
                    )}
                    title={displayPeriod ? (displayPeriod.type === 'current' ? `En Curso: ${displayPeriod.description}` : `Próximo: ${displayPeriod.description}`) : "Sin periodos"}
                >
                    {displayPeriod?.type === 'current' ? <TimeIcon className="w-5 h-5" /> : <CalenderIcon className="w-5 h-5" />}
                </div>
            </div>
        );
    }

    if (!displayPeriod) {
        return (
            <div className="mx-4 mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 transition-all duration-300">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-400">
                        <AlertIcon className="w-[18px] h-[18px]" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Periodo</p>
                        <p className="text-sm font-medium text-gray-400 mt-0.5">No hay periodos activos</p>
                    </div>
                </div>
            </div>
        );
    }

    const isCurrent = displayPeriod.type === 'current';

    return (
        <div
            className={cn(
                "mx-4 mb-8 p-4 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md group",
                isCurrent
                    ? "bg-success-50/30 border-success-100/50 dark:bg-success-500/5 dark:border-success-500/20"
                    : "bg-unefa-gold/[0.03] border-unefa-gold/20 dark:bg-unefa-gold/5 dark:border-unefa-gold/15"
            )}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300",
                        isCurrent
                            ? "bg-success-100/80 text-success-700 dark:bg-success-500/20 dark:text-success-400"
                            : "bg-unefa-gold/10 text-unefa-gold dark:bg-unefa-gold/20 dark:text-unefa-gold-light"
                    )}
                >
                    {isCurrent ? <TimeIcon className="w-5 h-5" /> : <CalenderIcon className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <p
                            className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                isCurrent ? "text-success-700 dark:text-success-400" : "text-unefa-gold dark:text-unefa-gold-light"
                            )}
                        >
                            {isCurrent ? "Período Actual" : "Próximo Período"}
                        </p>
                        {isCurrent && (
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-success-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
                            </span>
                        )}
                    </div>

                    <h4 className="text-sm font-bold text-text-primary dark:text-white mt-1 truncate">
                        {displayPeriod.description}
                    </h4>

                    <div className="flex items-center gap-1.5 mt-2">
                        <CalenderIcon className="w-3 h-3 text-text-tertiary" />
                        <p className="text-[11px] text-text-secondary dark:text-text-tertiary font-medium">
                            {displayPeriod.startDate.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })} - {displayPeriod.endDate.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PeriodStatusCard;
