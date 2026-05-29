import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useState } from "react";
import { DashboardStats } from "../../features/dashboard/types";

interface MonthlySalesChartProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export default function MonthlySalesChart({ stats }: MonthlySalesChartProps) {
  const enrollments = stats?.monthlyEnrollments ?? [];

  const categories = enrollments.map((m) => m.month);
  const chartData = enrollments.map((m) => m.count);

  // Fallback si no hay datos reales
  const displayCategories = categories.length > 0 ? categories : [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const displayData = chartData.length > 0 ? chartData : [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];

  const options: ApexOptions = {
    colors: ["#007fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: displayCategories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  };

  const series = [
    {
      name: "Inscripciones",
      data: displayData,
    },
  ];
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border-light bg-bg-main px-5 pt-5 dark:border-border-dark dark:bg-white/3 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary dark:text-white/90">
          Inscripciones Mensuales
        </h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-text-tertiary hover:text-text-primary dark:hover:text-white size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-text-secondary rounded-lg hover:bg-bg-secondary hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/5 dark:hover:text-white"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-text-secondary rounded-lg hover:bg-bg-secondary hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/5 dark:hover:text-white"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-162.5 xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
