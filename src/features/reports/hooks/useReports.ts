import { useState, useCallback } from 'react';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';
import { getReportConfig } from '../config/reportConfig';
import {
  generateRelacionGeneralTutoresExcel,
  generateResumenPasantiasExcel,
  generateRelacionEmpresasExcel,
  generateRelacionInstitucionesSolicitanExcel,
  generateProyeccionExcel,
} from '../../../utils/unefaExcelReports';

export function useReports() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const exportExcel = useCallback(async (
    type: string,
    data: any[],
    period: string,
    extra?: string,
  ) => {
    const fileName = `${type}_${period.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    try {
      switch (type) {
        case 'tutores-academicos':
          await generateRelacionGeneralTutoresExcel(data, period, fileName);
          break;
        case 'resumen-pasantias':
          await generateResumenPasantiasExcel(data, period, fileName);
          break;
        case 'relacion-empresas':
          await generateRelacionEmpresasExcel(data, period, fileName);
          break;
        case 'relacion-instituciones-solicitan':
          await generateRelacionInstitucionesSolicitanExcel(data, period, fileName);
          break;
        case 'proyeccion-pasantias':
          await generateProyeccionExcel(data, period, fileName);
          break;
        default:
          addToast({ variant: "error", title: "No soportado", message: "Tipo de reporte no soportado" });
          return;
      }
      addToast({ variant: "success", title: "Exportado", message: "Reporte exportado exitosamente" });
    } catch (error) {
      console.error(`[useReports] Error exporting ${type}:`, error);
      addToast({ variant: "error", title: "Error al exportar", message: "Error al exportar el reporte" });
    }
  }, []);

  /** Carga datos usando la config del reporte en lugar de un switch */
  const fetchData = useCallback(async (
    type: string,
    periodId?: number,
    careerId?: number,
    page?: number,
    limit?: number,
    careerIds?: number[],
  ) => {
    setLoading(true);
    try {
      const config = getReportConfig(type);
      if (!config) throw new Error(`Tipo de reporte desconocido: ${type}`);
      return await config.loadData(periodId, careerId, page, limit, careerIds);
    } catch (error: any) {
      addToast({ variant: "error", title: "Error al cargar", message: error?.message || 'Error al cargar datos' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, fetchData, exportExcel };
}
