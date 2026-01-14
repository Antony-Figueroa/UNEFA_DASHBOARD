interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
}) => {
  return (
    <div
      className={`rounded-2xl border border-border-light bg-white dark:bg-bg-dark transition-all duration-300 shadow-theme-md hover:shadow-theme-lg focus-within:ring-2 focus-within:ring-brand-500/20 ${className}`}
    >
      {/* Card Header */}
      <div className="px-6 py-5">
        <h3 className="text-base font-medium text-text-emphasis dark:text-text-emphasis">
          {title}
        </h3>
        {desc && (
          <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
            {desc}
          </p>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 border-t border-border-light dark:border-border-dark sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
