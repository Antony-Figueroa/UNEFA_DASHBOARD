import { useState } from "react";

const ChartTab: React.FC = () => {
  const [selected, setSelected] = useState<
    "optionOne" | "optionTwo" | "optionThree"
  >("optionOne");

  const getButtonClass = (option: "optionOne" | "optionTwo" | "optionThree") =>
    selected === option
      ? "shadow-theme-xs text-text-primary dark:text-white bg-bg-main dark:bg-bg-dark"
      : "text-text-secondary dark:text-text-tertiary";

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-bg-secondary p-0.5 dark:bg-bg-dark">
      <button
        onClick={() => setSelected("optionOne")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-text-primary   dark:hover:text-white ${getButtonClass(
          "optionOne"
        )}`}
      >
        Monthly
      </button>

      <button
        onClick={() => setSelected("optionTwo")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-text-primary   dark:hover:text-white ${getButtonClass(
          "optionTwo"
        )}`}
      >
        Quarterly
      </button>

      <button
        onClick={() => setSelected("optionThree")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-text-primary   dark:hover:text-white ${getButtonClass(
          "optionThree"
        )}`}
      >
        Annually
      </button>
    </div>
  );
};

export default ChartTab;
