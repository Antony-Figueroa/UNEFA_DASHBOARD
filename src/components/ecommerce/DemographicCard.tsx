import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import CountryMap from "./CountryMap";

export default function DemographicCard() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-border-light bg-bg-main p-5 dark:border-border-dark dark:bg-white/3 sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary dark:text-white/90">
            Customers Demographic
          </h3>
          <p className="mt-1 text-text-secondary text-theme-sm dark:text-text-tertiary">
            Number of customer based on country
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-text-tertiary hover:text-text-primary dark:hover:text-text-secondary size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-text-secondary rounded-lg hover:bg-bg-secondary hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/5 dark:hover:text-text-secondary"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-text-secondary rounded-lg hover:bg-bg-secondary hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/5 dark:hover:text-text-secondary"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
      <div className="px-4 py-6 my-6 overflow-hidden border border-border-light rounded-2xl dark:border-border-dark sm:px-6">
        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 -my-6 h-53 w-63 2xsm:w-76.75 xsm:w-89.5 sm:-mx-6 md:w-167 lg:w-158.5 xl:w-98.25 2xl:w-138.5"
        >
          <CountryMap />
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="items-center w-full rounded-full max-w-8">
              <img src="./images/country/country-01.svg" alt="usa" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-theme-sm dark:text-white/90">
                USA
              </p>
              <span className="block text-text-secondary text-theme-xs dark:text-text-tertiary">
                2,379 Customers
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-35 items-center gap-3">
            <div className="relative block h-2 w-full max-w-25 rounded-sm bg-bg-secondary dark:bg-bg-dark">
              <div className="absolute left-0 top-0 flex h-full w-79/100 items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-text-primary text-theme-sm dark:text-white/90">
              79%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="items-center w-full rounded-full max-w-8">
              <img src="./images/country/country-02.svg" alt="france" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-theme-sm dark:text-white/90">
                France
              </p>
              <span className="block text-text-secondary text-theme-xs dark:text-text-tertiary">
                589 Customers
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-35 items-center gap-3">
            <div className="relative block h-2 w-full max-w-25 rounded-sm bg-bg-secondary dark:bg-bg-dark">
              <div className="absolute left-0 top-0 flex h-full w-23/100 items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-text-primary text-theme-sm dark:text-white/90">
              23%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
