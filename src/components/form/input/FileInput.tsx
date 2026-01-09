import { FC } from "react";

interface FileInputProps {
  className?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileInput: FC<FileInputProps> = ({ className, onChange }) => {
  return (
    <input
      type="file"
      className={`focus:border-ring-brand-300 h-11 w-full overflow-hidden rounded-lg border border-border-medium bg-transparent text-sm text-text-tertiary shadow-theme-xs transition-colors file:mr-5 file:border-collapse file:cursor-pointer file:rounded-l-lg file:border-0 file:border-r file:border-solid file:border-border-light file:bg-bg-secondary file:py-3 file:pl-3.5 file:pr-3 file:text-sm file:text-text-secondary placeholder:text-text-tertiary hover:file:bg-bg-main focus:outline-hidden focus:file:ring-brand-300 dark:border-border-dark dark:bg-bg-dark dark:text-text-emphasis dark:file:border-border-dark dark:file:bg-white/5 dark:file:text-text-tertiary dark:placeholder:text-text-tertiary ${className}`}
      onChange={onChange}
    />
  );
};

export default FileInput;
