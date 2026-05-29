import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import reportsService from '../services/reportsService';
import {
  generateRelacionGeneralTutoresExcel,
  generateResumenPasantiasExcel,
  generateRelacionEmpresasExcel,
  generateDistribucionTutoresExcel,
  generateRelacionIndividualDocenteExcel,
  generateDistribucionTutoresV2Excel,
} from '../../../utils/unefaExcelReports';
import type { TutorAcademicReportResponse } from '../services/reportsService';

export interface ReportConfig {
  id: string;
  title: string;
  subtitle: string;
  category: 'documentos' | 'generales';
  icon: string;
  type: 'pdf' | 'excel';
  loadData: (periodId?: number, careerId?: number) => Promise<any>;
}

export function useReports() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

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

  const fetchData = useCallback(async (
    type: string,
    periodId?: number,
    careerId?: number,
  ) => {
    setLoading(true);
    try {
      let result;
      switch (type) {
        case 'tutores-academicos':
          result = await reportsService.getTutorsAcademicReport(periodId, careerId);
          setData(result);
          return result as TutorAcademicReportResponse;
        case 'resumen-pasantias':
          result = await reportsService.getResumenPasantiasReport(periodId, careerId);
          setData(result);
          return result;
        case 'relacion-empresas':
          result = await reportsService.getRelacionEmpresas(periodId, careerId);
          setData(result);
          return result;
        case 'distribucion-tutores':
          result = await reportsService.getDistribucionTutores(periodId, careerId);
          setData(result);
          return result;
        case 'distribucion-tutores-v2':
          result = await reportsService.getDistribucionTutoresV2(periodId, careerId);
          setData(result);
          return result;
        case 'relacion-individual-docente': {
          if (!periodId) throw new Error('Se requiere tutorId');
          result = await reportsService.getRelacionIndividualDocente(periodId);
          setData(result);
          return result;
        }
        default:
          throw new Error(`Tipo desconocido: ${type}`);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Error al cargar datos');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, data, fetchData, exportExcel };
}
