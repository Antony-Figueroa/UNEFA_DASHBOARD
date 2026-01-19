import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useTheme } from '../../../context/theme';
import { usePeriods } from '../hooks/usePeriods';

const PeriodStatusChart = () => {
    const { colorMode } = useTheme();
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

    const options: ApexOptions = {
        chart: {
            type: 'donut',
        },
        colors: ['#FBBF24', '#10B981', '#EF4444'], // Amarillo, Verde, Rojo
        labels: chartData.labels,
        legend: {
            show: true,
            position: 'bottom',
            labels: {
                colors: colorMode === 'dark' ? '#fff' : '#000',
            },
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    background: 'transparent',
                },
            },
        },
        dataLabels: {
            enabled: false,
        },
    };

    return (
        <div className="rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
            <h5 className="text-xl font-semibold text-black dark:text-white mb-4">
                Distribución de Períodos Activos
            </h5>

            <div className="mb-2">
                <div id="chartDonut" className="mx-auto flex justify-center">
                    {status === 'success' && (
                        <ReactApexChart
                            options={options}
                            series={chartData.series}
                            type="donut"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PeriodStatusChart;