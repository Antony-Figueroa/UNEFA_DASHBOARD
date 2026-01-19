import { useMemo } from 'react';
import { usePeriods } from '../hooks/usePeriods';
import DonutChartOne from '../../../components/charts/donut/DonutChartOne';

const PeriodStatusChart = () => {
    const { periodos, status } = usePeriods();

    const chartData = useMemo(() => {
        if (status !== 'success') {
            return { labels: [], series: [] };
        }

        const counts = periodos.reduce((acc, periodo) => {
            if (periodo.status) { // Solo contar períodos activos
                switch (periodo.periodStatus) {
                    case 1: // Pendiente
                        acc.pendiente++;
                        break;
                    case 2: // En Curso
                        acc.enCurso++;
                        break;
                    case 3: // Culminado
                        acc.culminado++;
                        break;
                }
            }
            return acc;
        }, { pendiente: 0, enCurso: 0, culminado: 0 });

        return {
            labels: ['Pendientes', 'En Curso', 'Culminados'],
            series: [counts.pendiente, counts.enCurso, counts.culminado],
        };
    }, [periodos, status]);

    if (status !== 'success') {
        return <div className="h-80 bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl" />;
    }

    return (
        <DonutChartOne 
            title="Distribución de Períodos Activos"
            series={chartData.series}
            labels={chartData.labels}
            colors={['#FBBF24', '#10B981', '#EF4444']} // Amarillo, Verde, Rojo
            height={320}
        />
    );
};

export default PeriodStatusChart;