import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import tutorService from "../../features/tutor/services/tutorService";
import type { TutorTracking as TutorTrackingType } from "../../features/tutor/services/tutorService";
import Badge from "../../components/ui/badge/Badge";

export default function TutorTracking() {
  const [tracking, setTracking] = useState<TutorTrackingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTracking();
  }, []);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const data = await tutorService.getTracking();
      setTracking(data);
    } catch (err) {
      console.error("[TutorTracking] Error:", err);
      setError("Error al cargar seguimientos");
    } finally {
      setLoading(false);
    }
  };

  const filteredTracking = tracking.filter(t =>
    t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.studentCi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <PageMeta
        title="Seguimiento | SIGP - UNEFA"
        description="Registro de seguimiento de estudiantes"
      />

      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
            Seguimiento
          </h1>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            Historial de seguimiento de sus estudiantes
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <ComponentCard title="Buscar">
          <input
            type="text"
            placeholder="Buscar por nombre o cédula del estudiante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500"
          />
        </ComponentCard>

        <ComponentCard 
          title={`Registros (${filteredTracking.length})`}
          className="overflow-hidden"
        >
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-4 p-4 border-b border-border-light dark:border-border-dark">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : filteredTracking.length === 0 ? (
            <div className="text-center py-12 text-text-secondary dark:text-text-tertiary">
              No se encontraron registros de seguimiento
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTracking.map((item) => (
                <div 
                  key={item.trackingId}
                  className="p-4 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div>
                      <h4 className="font-medium text-text-emphasis">{item.studentName}</h4>
                      <p className="text-sm text-text-secondary">{item.studentCi}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color="info" size="sm">
                        {item.tutorType}
                      </Badge>
                      <span className="text-xs text-text-secondary">
                        {new Date(item.creationDate).toLocaleDateString('es-VE')}
                      </span>
                    </div>
                  </div>
                  
                  {item.reportTitle && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-text-secondary">Título: </span>
                      <span className="text-sm">{item.reportTitle}</span>
                    </div>
                  )}
                  
                  {item.route && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-text-secondary">Ruta: </span>
                      <span className="text-sm">{item.route}</span>
                    </div>
                  )}
                  
                  {item.observations && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm text-text-secondary">{item.observations}</span>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <Badge 
                      color={item.transfer ? "success" : "light"} 
                      size="sm"
                    >
                      {item.transfer ? "Con Traslado" : "Sin Traslado"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
