/**
 * @file PendingTasksCard.tsx
 * @description Card de tareas pendientes para el sidebar
 * Muestra contadores de solicitudes, evaluaciones y seguimientos pendientes
 */

import React, { useState, useEffect } from "react";
import { useSidebar } from "../../context/sidebar";
import { cn } from "../../utils/cn";
import { AlertIcon, FileIcon, CalenderIcon } from "../../icons";
import apiClient from "../../api/apiClient";

interface TaskCount {
  pendingRequests: number;
  pendingEvaluations: number;
  upcomingVisits: number;
}

interface DashboardStatsResponse {
  pendingRequests: number;
  pendingEvaluations: number;
  upcomingVisits: number;
}

const PendingTasksCard: React.FC = () => {
  const { isExpanded, isMobileOpen } = useSidebar();
  const [tasks, setTasks] = useState<TaskCount>({
    pendingRequests: 0,
    pendingEvaluations: 0,
    upcomingVisits: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const showContent = isExpanded || isMobileOpen;

  // ponytail: solo fetchear si el sidebar está expandido
  useEffect(() => {
    if (!showContent) return;

    const fetchTaskCounts = async () => {
      try {
        // Llamar al endpoint de estadísticas del dashboard usando apiClient
        const response = await apiClient.get<DashboardStatsResponse>('/dashboard/stats');
        
        if (response.data) {
          setTasks({
            pendingRequests: response.data.pendingRequests || 0,
            pendingEvaluations: response.data.pendingEvaluations || 0,
            upcomingVisits: response.data.upcomingVisits || 0
          });
        }
      } catch (error) {
        // Silently fail - el card simplemente no mostrará tareas pendientes
        console.warn('[PendingTasksCard] No se pudieron cargar las tareas pendientes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskCounts();
  }, [showContent]);

  // No mostrar si no hay tareas
  const totalTasks = tasks.pendingRequests + tasks.pendingEvaluations + tasks.upcomingVisits;
  if (!showContent || isLoading || totalTasks === 0) {
    return null;
  }

  const TaskBadge = ({ count, icon, label, color }: { 
    count: number; 
    icon: React.ReactNode; 
    label: string;
    color: string;
  }) => {
    if (count === 0) return null;
    
    return (
      <div className="flex items-center gap-2 py-1.5">
        <div className={cn("p-1 rounded-lg", color)}>
          {icon}
        </div>
        <span className="text-xs font-medium text-text-secondary dark:text-text-tertiary">
          {count} {label}
        </span>
      </div>
    );
  };

  return (
    <div className="mx-2 mt-2 p-3 rounded-xl bg-warning-50/50 dark:bg-warning-500/5 border border-warning-100/50 dark:border-warning-500/20">
      <div className="flex items-center gap-2 mb-2">
        <AlertIcon className="w-4 h-4 text-warning-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-warning-600 dark:text-warning-400">
          Pendientes
        </span>
      </div>
      
      <div className="space-y-0.5">
        <TaskBadge 
          count={tasks.pendingRequests} 
          icon={<FileIcon className="w-3 h-3" />}
          label="solicitudes"
          color="bg-warning-100 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400"
        />
        <TaskBadge 
          count={tasks.pendingEvaluations} 
          icon={<FileIcon className="w-3 h-3" />}
          label="evaluaciones"
          color="bg-warning-100 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400"
        />
        <TaskBadge 
          count={tasks.upcomingVisits} 
          icon={<CalenderIcon className="w-3 h-3" />}
          label="visitas"
          color="bg-warning-100 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400"
        />
      </div>
    </div>
  );
};

export default PendingTasksCard;