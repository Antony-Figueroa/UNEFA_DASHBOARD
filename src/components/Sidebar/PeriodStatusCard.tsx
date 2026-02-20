import React, { useMemo } from "react";
import { usePeriods } from "../../features/periods/hooks/usePeriods";
import { useSidebar } from "../../context/sidebar";
import { CalenderIcon, TimeIcon, AlertIcon } from "../../icons";
import { cn } from "../../utils/cn";
import { Skeleton } from "../ui/skeleton";

const PeriodStatusCard: React.FC = () => {
    const { periodos, status } = usePeriods();
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();

    const showContent = isExpanded || isHovered || isMobileOpen;

    const displayPeriod = useMemo(() => {
        if (!periodos || periodos.length === 0) return null;

        const current = periodos.find((p) => p.periodStatus === 2 && p.status);
        if (current) return { ...current, type: 'current' as const };

        return null;
    }, [periodos]);

    if (status === "loading" && showContent) {
        return (
            <div className="mx-2 p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-border-light/30 dark:border-white/5">
                <Skeleton height={14} width={80} className="mb-2" />
                <Skeleton height={10} width={120} />
            </div>
        );
    }

    if (!showContent) {
        return (
            <div className="flex justify-center pb-4">
                <div
                    className={cn(
                        "p-2.5 rounded-xl border transition-all duration-200",
                        displayPeriod
                            ? "bg-success-50 border-success-100 text-success-600 dark:bg-success-500/10 dark:border-success-500/20 dark:text-success-400"
                            : "bg-gray-50 border-gray-100 text-gray-400 dark:bg-white/5 dark:border-white/10"
                    )}
                    title={displayPeriod ? `Período: ${displayPeriod.description}` : "Sin período activo"}
                >
                    {displayPeriod ? <TimeIcon className="w-4 h-4" /> : <CalenderIcon className="w-4 h-4" />}
                </div>
            </div>
        );
    }

    if (!displayPeriod) {
        return (
            <div className="mx-2 p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-border-light/30 dark:border-white/5 transition-all duration-200">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-400">
                        <AlertIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Período</p>
                        <p className="text-xs font-medium text-text-secondary dark:text-text-tertiary">Sin período activo</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "mx-2 p-3 rounded-xl border transition-all duration-200",
                "bg-success-50/50 border-success-100/50 dark:bg-success-500/5 dark:border-success-500/20"
            )}
        >
            <div className="flex items-center gap-2.5">
                <div className="relative p-1.5 rounded-lg bg-success-100/80 text-success-600 dark:bg-success-500/20 dark:text-success-400">
                    <TimeIcon className="w-3.5 h-3.5" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
                    </span>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold text-success-600 dark:text-success-400 uppercase tracking-wider">
                            Período Activo
                        </p>
                    </div>

                    <h4 className="text-xs font-semibold text-text-primary dark:text-white mt-0.5 truncate">
                        {displayPeriod.description}
                    </h4>

                    <div className="flex items-center gap-1 mt-1">
                        <CalenderIcon className="w-3 h-3 text-text-tertiary" />
                        <p className="text-[10px] text-text-secondary dark:text-text-tertiary font-medium">
                            {displayPeriod.startDate.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })} - {displayPeriod.endDate.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PeriodStatusCard;
