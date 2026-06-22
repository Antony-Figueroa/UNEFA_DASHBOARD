import { useState } from "react";
import { useTour } from "../hooks/useTour";
import type { DriveStep } from "../types";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";
import { PracticeDialog } from "./PracticeDialog";

interface TourButtonProps {
  steps: DriveStep[];
  moduleName: string;
}

export function TourButton({ steps, moduleName }: TourButtonProps) {
  const [showPractice, setShowPractice] = useState(false);
  const { start } = useTour(steps);

  const handleStart = () => {
    start(0, () => setShowPractice(true));
  };

  const button = (
    <button
      onClick={handleStart}
      className="inline-flex items-center justify-center rounded-xl transition-all border disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 bg-[#f5f5f5] dark:bg-white/5 w-10 h-10"
      aria-label="Ayuda - Tour guiado"
    >
      <span className="text-base font-bold leading-none">?</span>
    </button>
  );

  return (
    <>
      <Tooltip content="Ayuda" delay={300} duration={5000}>
        {button}
      </Tooltip>
      {showPractice && (
        <PracticeDialog
          moduleName={moduleName}
          onClose={() => setShowPractice(false)}
        />
      )}
    </>
  );
}
