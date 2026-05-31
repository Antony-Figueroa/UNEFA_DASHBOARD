import { ReportCard } from './ReportCard';

interface ReportListItem {
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  type: 'pdf' | 'excel';
}

interface Section {
  title: string;
  description: string;
  reports: ReportListItem[];
}

interface ReportListProps {
  sections: Section[];
  loadingId: string | null;
  onView: (id: string) => void;
  onExportExcel?: (id: string) => void;
}

export function ReportList({ sections, loadingId, onView, onExportExcel }: ReportListProps) {
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-text-primary dark:text-text-emphasis">
              {section.title}
            </h2>
            <p className="text-sm text-text-tertiary mt-1">
              {section.description}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {section.reports.map((report) => (
              <ReportCard
                key={report.id}
                id={report.id}
                title={report.title}
                subtitle={report.subtitle}
                icon={report.icon}
                type={report.type}
                loading={loadingId === report.id}
                onView={() => onView(report.id)}
                onExportExcel={report.type === 'excel' ? () => onExportExcel?.(report.id) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
