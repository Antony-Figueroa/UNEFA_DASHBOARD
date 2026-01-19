import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { DashboardStats } from "../../features/dashboard/types";

interface MonthlyTargetProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export default function MonthlyTarget({ stats, loading }: MonthlyTargetProps) {
  const series = [stats?.monthlyTarget.percentage || 0];
  const options: ApexOptions = {
    colors: ["#007fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5, // margin is in pixels
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#007fff"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-border-light bg-bg-secondary dark:border-border-dark dark:bg-white/3">
      <div className="px-5 pt-5 bg-bg-main shadow-default rounded-2xl pb-11 dark:bg-bg-dark sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary dark:text-white/90">
              Meta Mensual
            </h3>
            <p className="mt-1 text-text-secondary text-theme-sm dark:text-text-tertiary">
              Meta de inscripciones establecida para este mes
            </p>
          </div>
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
        <div className="relative flex flex-col items-center justify-center">
          <div className="max-w-82.5 w-full mx-auto">
            {loading ? (
              <div className="flex h-50 items-center justify-center">
                <div className="size-20 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
              </div>
            ) : (
              <Chart
                options={options}
                series={series}
                type="radialBar"
                height={330}
              />
            )}
          </div>

          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
            {stats?.monthlyTarget.percentage || 0}%
          </span>
        </div>
        <p className="mx-auto mt-10 w-full max-w-95 text-center text-sm text-text-secondary sm:text-base">
          Has registrado {stats?.monthlyTarget.today || 0} estudiantes hoy. ¡Sigue así!
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-text-secondary text-theme-xs dark:text-text-tertiary sm:text-sm">
            Meta
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-text-primary dark:text-white/90 sm:text-lg">
            {stats?.monthlyTarget.target || 0}
          </p>
        </div>

        <div className="w-px bg-border-light h-7 dark:bg-border-dark"></div>

        <div>
          <p className="mb-1 text-center text-text-secondary text-theme-xs dark:text-text-tertiary sm:text-sm">
            Actual
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-text-primary dark:text-white/90 sm:text-lg">
            {stats?.monthlyTarget.current || 0}
          </p>
        </div>

        <div className="w-px bg-border-light h-7 dark:bg-border-dark"></div>

        <div>
          <p className="mb-1 text-center text-text-secondary text-theme-xs dark:text-text-tertiary sm:text-sm">
            Hoy
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-text-primary dark:text-white/90 sm:text-lg">
            {stats?.monthlyTarget.today || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
