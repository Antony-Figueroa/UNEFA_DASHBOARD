import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import CulminatedStudentsFilters from "../../features/reports/components/CulminatedStudentsFilters";
import CulminatedStudentsTable from "../../features/reports/components/CulminatedStudentsTable";
import { reportsService, CulminatedStudentReportRow } from "../../features/reports/services/reportsService";
import { getPeriods } from "../../features/periods/services/periodService";
import { unwrapData } from "../../api/crudServiceFactory";
import { getCareers } from "../../features/careers/services/careersService";
import { getInstitutions } from "../../features/institutions/services/institutionsService";
import toast from "react-hot-toast";

export default function CulminatedStudentsReportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CulminatedStudentReportRow[]>([]);
  const [filters, setFilters] = useState<{
    periodId?: number;
    careerIds?: number[];
    status?: string;
    institutionId?: number;
  }>({});

  const [periods, setPeriods] = useState<{ value: string; label: string }[]>([]);
  const [careers, setCareers] = useState<{ value: string; label: string }[]>([]);
  const [institutions, setInstitutions] = useState<{ value: string; label: string }[]>([]);

  const fetchFilters = async () => {
    try {
      const [periodsRes, careersRes, institutionsRes] = await Promise.all([
        getPeriods(),
        getCareers(),
        getInstitutions()
      ]);

      setPeriods(
        (periodsRes || []).map((p: any) => ({
          value: String(p.periodId),
          label: p.description
        }))
      );

      setCareers(
        (unwrapData(careersRes) || []).map((c: any) => ({
          value: String(c.careerId),
          label: c.careerName
        }))
      );

      setInstitutions(
        (unwrapData(institutionsRes) || []).map((i: any) => ({
          value: String(i.institutionId),
          label: i.institutionName
        }))
      );
    } catch (error) {
      console.error("[CulminatedReport] Error fetching filters:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await reportsService.getCulminatedStudents(filters);
      setData(response.data || []);
    } catch (error) {
      console.error("[CulminatedReport] Error fetching data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const totalHours = data.reduce((sum, item) => sum + item.totalHours, 0);
  const avgGrade = data.length > 0
    ? data.reduce((sum, item) => sum + (item.grade || 0), 0) / data.filter(item => item.grade > 0).length
    : 0;

  return (
    <>
      <PageMeta title="Reportes de Estudiantes Culminados" description="Reporte de estudiantes que culminaron sus prácticas profesionales" />
      <PageBreadcrumb pageTitle="Reportes" />

      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Estudiantes Culminados
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Reporte de estudiantes que han completado sus prácticas profesionales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchData}>
              Actualizar
            </Button>
          </div>
        </div>

        <ComponentCard title="Filtros y Resultados">
          <CulminatedStudentsFilters
            periodId={filters.periodId}
            careerIds={filters.careerIds}
            status={filters.status}
            institutionId={filters.institutionId}
            periods={periods}
            careers={careers}
            institutions={institutions}
            onFilterChange={handleFilterChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-brand-50 dark:bg-brand-500/10 rounded-lg p-4">
              <p className="text-sm text-brand-600 dark:text-brand-400">Total Estudiantes</p>
              <p className="text-2xl font-bold text-brand-700 dark:text-brand-300">{data.length}</p>
            </div>
            <div className="bg-success-50 dark:bg-success-500/10 rounded-lg p-4">
              <p className="text-sm text-success-600 dark:text-success-400">Horas Totales</p>
              <p className="text-2xl font-bold text-success-700 dark:text-success-300">{totalHours}</p>
            </div>
            <div className="bg-info-50 dark:bg-info-500/10 rounded-lg p-4">
              <p className="text-sm text-info-600 dark:text-info-400">Promedio Notas</p>
              <p className="text-2xl font-bold text-info-700 dark:text-info-300">
                {avgGrade > 0 ? avgGrade.toFixed(1) : '-'}
              </p>
            </div>
          </div>

          <CulminatedStudentsTable data={data} loading={loading} />
        </ComponentCard>
      </div>
    </>
  );
}
