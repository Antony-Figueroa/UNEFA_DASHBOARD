import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getReportConfig } from '../config/reportConfig';
import {
  generateRelacionGeneralTutoresExcel,
  generateResumenPasantiasExcel,
  generateRelacionEmpresasExcel,
  generateDistribucionTutoresExcel,
  generateRelacionIndividualDocenteExcel,
  generateDistribucionTutoresV2Excel,
} from '../../../utils/unefaExcelReports';

export function useReports() {
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
        case 'distribucion-tutores':
          await generateDistribucionTutoresExcel(data, period, fileName);
          break;
        case 'distribucion-tutores-v2':
          await generateDistribucionTutoresV2Excel(data, period, fileName);
          break;
        case 'relacion-individual-docente':
          await generateRelacionIndividualDocenteExcel(data, period, extra || '', fileName);
          break;
        default:
          toast.error('Tipo de reporte no soportado');
          return;
      }
      toast.success('Reporte exportado exitosamente');
    } catch (error) {
      console.error(`[useReports] Error exporting ${type}:`, error);
      toast.error('Error al exportar el reporte');
    }
  }, []);

  /** Carga datos usando la config del reporte en lugar de un switch */
  const fetchData = useCallback(async (
    type: string,
    periodId?: number,
    careerId?: number,
    page?: number,
    limit?: number,
  ) => {
    setLoading(true);
    try {
      const config = getReportConfig(type);
      if (!config) throw new Error(`Tipo de reporte desconocido: ${type}`);
      return await config.loadData(periodId, careerId, page, limit);
    } catch (error: any) {
      toast.error(error?.message || 'Error al cargar datos');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, fetchData, exportExcel };
}
