import { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

const Label: FC<LabelProps> = ({ htmlFor, children, className }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={clsx(
        twMerge(
          "mb-1.5 block text-sm font-medium text-text-secondary dark:text-text-tertiary",
          className,
        ),
      )}
    >
      {children}
    </label>
  );
};

export default Label;
