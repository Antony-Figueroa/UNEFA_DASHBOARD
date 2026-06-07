import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { DashboardStats } from "../../features/dashboard/types";
import { Skeleton } from "../ui/skeleton";

interface QuickStatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  colorClass: string;
  loading?: boolean;
  index: number;
  isNumber?: boolean;
}

// Animated counter component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ 
  value, 
  duration = 1.5 
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setCount(value);
      return;
    }

    let startTime: number | null = null;
    const startValue = 0;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      // Easing function (easeOutQuart)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(startValue + (value - startValue) * easeOutQuart);
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        hasAnimated.current = true;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span ref={countRef}>{count.toLocaleString()}</span>;
};

const QuickStatItem: React.FC<QuickStatItemProps> = ({ 
  icon, 
  label, 
  value, 
  colorClass, 
  loading,
  index,
  isNumber = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -4, 
        boxShadow: "0 20px 40px rgba(5, 79, 148, 0.15)",
        transition: { duration: 0.2 }
      }}
      className="group relative overflow-hidden rounded-2xl border border-border-light bg-bg-main p-5 shadow-sm transition-all duration-300 hover:border-brand-300 dark:border-border-dark dark:bg-bg-dark dark:hover:border-brand-600"
    >
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${colorClass.replace('text-', 'bg-').replace('600', '50').replace('400', '900/20')}`} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className={`flex size-12 items-center justify-center rounded-xl ${colorClass} shadow-sm shrink-0`}
          >
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "size-6" })}
          </motion.div>
          
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-text-tertiary mb-1">
              {label}
            </span>
            {loading ? (
              <Skeleton height={24} width={80} className="mt-1" />
            ) : (
              <h4 className="text-xl font-bold text-text-primary dark:text-white truncate">
                {isNumber && typeof value === 'number' ? (
                  <AnimatedCounter value={value} duration={1.5} />
                ) : (
                  value
                )}
              </h4>
            )}
          </div>
        </div>

        <div className={`size-16 opacity-10 rounded-full ${colorClass.split(' ')[0].replace('bg-', 'bg-')} shrink-0 ml-4`} />
      </div>

      {/* Bottom progress indicator */}
      {!loading && (
        <motion.div 
          className={`absolute bottom-0 left-0 h-1 ${colorClass.split(' ')[0].replace('bg-', 'bg-').replace('50', '500').replace('/10', '')}`}
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1, delay: index * 0.1 + 0.5, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
};

interface HomeQuickStatsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

const HomeQuickStats: React.FC<HomeQuickStatsProps> = ({ stats, loading }) => {
  const periodInfo = stats?.currentPeriod 
    ? `${stats.currentPeriod.description}`
    : "Sin período activo";

  const statsData = [
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: "Período en curso",
      value: periodInfo,
      colorClass: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
      isNumber: false,
    },
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      label: "Estudiantes activos",
      value: stats?.activeStudents || 0,
      colorClass: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
      isNumber: true,
    },
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      label: "Instituciones activas",
      value: stats?.activeInstitutions || 0,
      colorClass: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
      isNumber: true,
    },
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" />
        </svg>
      ),
      label: "Carreras activas",
      value: stats?.activeCareers || 0,
      colorClass: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
      isNumber: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <QuickStatItem
          key={stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          colorClass={stat.colorClass}
          loading={loading}
          index={index}
          isNumber={stat.isNumber}
        />
      ))}
    </div>
  );
};

export default HomeQuickStats;
