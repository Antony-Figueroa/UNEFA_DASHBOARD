import { useTour } from "../hooks/useTour";
import type { DriveStep } from "../types";

interface TourButtonProps {
  steps: DriveStep[];
  label?: string;
}

export function TourButton({ steps, label = "Tour" }: TourButtonProps) {
  const { start } = useTour(steps);

  return (
    <button
      onClick={() => start()}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg bg-brand-600 text-white hover:bg-brand-700 active:scale-95 transition-all duration-200 text-sm font-medium"
      title="Iniciar tour guiado del módulo"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      {label}
    </button>
  );
}
