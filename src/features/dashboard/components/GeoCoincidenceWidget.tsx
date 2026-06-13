import { useEffect, useState } from 'react';
import { MapPin, Crosshair, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { addressService } from '../../address/services/addressService';

const LEVEL_LABELS: Record<string, string> = {
  SAME_PARROQUIA: 'Misma Parroquia',
  SAME_MUNICIPIO: 'Mismo Municipio',
  SAME_STATE: 'Mismo Estado',
  DIFFERENT_STATE: 'Distinto Estado',
};

const LEVEL_COLORS: Record<string, string> = {
  SAME_PARROQUIA: 'text-green-600 bg-green-50 dark:bg-green-500/10',
  SAME_MUNICIPIO: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
  SAME_STATE: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
  DIFFERENT_STATE: 'text-red-600 bg-red-50 dark:bg-red-500/10',
};

const LEVEL_ICONS: Record<string, typeof CheckCircle> = {
  SAME_PARROQUIA: CheckCircle,
  SAME_MUNICIPIO: Crosshair,
  SAME_STATE: MapPin,
  DIFFERENT_STATE: AlertTriangle,
};

interface GeoCoincidenceWidgetProps {
  loading?: boolean;
}

const GeoCoincidenceWidget = (_props: GeoCoincidenceWidgetProps) => {
  const [stats, setStats] = useState<{ level: string; count: number; percentage: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    addressService.getStats()
      .then(res => {
        const data = res.data;
        setStats(data.coincidence_distribution ?? []);
        setTotal(data.enrollment_geo?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Coincidencia Geográfica
        </h3>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
          <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : total === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          Sin datos de coincidencia geográfica
        </p>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {total}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 -mt-2">
            inscripciones con datos geográficos
          </p>
          <div className="space-y-2">
            {stats.map((s) => {
              const Icon = LEVEL_ICONS[s.level] ?? MapPin;
              return (
                <div key={s.level} className="flex items-center gap-2 text-sm">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[s.level] ?? ''}`}>
                    <Icon className="h-3 w-3" />
                    {LEVEL_LABELS[s.level] ?? s.level}
                  </span>
                  <span className="ml-auto font-semibold text-gray-700 dark:text-gray-300">
                    {s.count}
                  </span>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {s.percentage?.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default GeoCoincidenceWidget;
