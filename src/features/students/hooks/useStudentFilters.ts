import { useState, useMemo, useCallback } from "react";
import type { Student, StudentRowData } from "../types";
import { formatDateTime } from "../../../utils/date";

interface FilterState {
  careerId: string;
  regime: string;
  studentType: string;
  periodId: string;
}

const initialFilters: FilterState = {
  careerId: "",
  regime: "",
  studentType: "",
  periodId: "",
};

const formatStudentToRow = (s: Student): StudentRowData => ({
  ...s,
  enrollmentDate: formatDateTime(s.enrollmentDate),
  fullNames: `${s.firstName} ${s.middleName ? s.middleName + " " : ""}${s.lastName} ${s.secondLastName ? s.secondLastName : ""}`.trim(),
});

interface UseStudentFiltersOptions {
  students: Student[];
  activeTab: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface UseStudentFiltersReturn {
  filters: FilterState;
  setFilter: (key: keyof FilterState, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  filtered: StudentRowData[];
  availableCareers: FilterOption[];
  availableRegimes: FilterOption[];
  availableStudentTypes: FilterOption[];
  availablePeriods: FilterOption[];
}

export function useStudentFilters({
  students,
  activeTab,
}: UseStudentFiltersOptions): UseStudentFiltersReturn {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const setFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  // ── Derived filter options from data ──────────────────────────────
  const availableCareers = useMemo(() => {
    const map = new Map<string, string>();
    (Array.isArray(students) ? students : []).forEach((s) => {
      if (s.careerName) map.set(s.careerName, s.careerName);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [students]);

  const availableRegimes = useMemo(() => {
    const set = new Set<string>();
    (Array.isArray(students) ? students : []).forEach((s) => {
      if (s.regime) set.add(s.regime);
    });
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [students]);

  const availableStudentTypes = useMemo(() => {
    const set = new Set<string>();
    (Array.isArray(students) ? students : []).forEach((s) => {
      if (s.studentType) set.add(s.studentType);
    });
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [students]);

  const availablePeriods = useMemo(() => {
    const set = new Set<string>();
    (Array.isArray(students) ? students : []).forEach((s) => {
      if (s.enrollmentDate) {
        const d = new Date(s.enrollmentDate);
        const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        set.add(label);
      }
    });
    return Array.from(set).sort().map((v) => ({ value: v, label: v }));
  }, [students]);

  // ── Filter + format ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!Array.isArray(students)) return [];

    let result = students.filter((s) =>
      activeTab === "Activas" ? !!s.status : !s.status
    );

    if (filters.careerId) {
      result = result.filter((s) => s.careerName === filters.careerId);
    }
    if (filters.regime) {
      result = result.filter((s) => s.regime === filters.regime);
    }
    if (filters.studentType) {
      result = result.filter((s) => s.studentType === filters.studentType);
    }
    if (filters.periodId) {
      result = result.filter((s) => {
        if (!s.enrollmentDate) return false;
        const d = new Date(s.enrollmentDate);
        const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return label === filters.periodId;
      });
    }

    return result.map(formatStudentToRow);
  }, [students, activeTab, filters]);

  return {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    filtered,
    availableCareers,
    availableRegimes,
    availableStudentTypes,
    availablePeriods,
  };
}

export default useStudentFilters;
