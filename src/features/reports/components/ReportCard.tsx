import { FileText, Table2, FileSpreadsheet } from 'lucide-react';
import Button from '../../../components/ui/button/Button';
import Badge from '../../../components/ui/badge/Badge';

export interface ReportCardProps {
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  type: 'pdf' | 'excel';
  loading?: boolean;
  onView: () => void;
  onExportExcel?: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  fileText: <FileText className="w-6 h-6" />,
  table: <Table2 className="w-6 h-6" />,
  spreadsheet: <FileSpreadsheet className="w-6 h-6" />,
};

const DEFAULT_ICON = <FileText className="w-6 h-6" />;

export function ReportCard({ id, title, subtitle, icon, type, loading, onView, onExportExcel }: ReportCardProps) {
  return (
    <div
      className="group rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 dark:bg-brand-500/20">
            {ICON_MAP[icon || ''] || DEFAULT_ICON}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary dark:text-text-emphasis leading-tight">
              {title}
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">
              {subtitle}
            </p>
          </div>
        </div>
        <Badge variant="light" color={type === 'pdf' ? 'info' : 'success'} size="sm">
          {type === 'pdf' ? 'PDF' : 'Excel'}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onView}
          disabled={loading}
          className="flex-1 text-xs"
        >
          {loading ? 'Cargando...' : 'Ver'}
        </Button>
        {onExportExcel && (
          <Button
            variant="primary"
            size="sm"
            onClick={onExportExcel}
            disabled={loading}
            className="flex-1 text-xs"
          >
            Exportar Excel
          </Button>
        )}
      </div>
    </div>
  );
}
