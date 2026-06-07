import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../../components/ui/table";
import { EmptyState } from "../../../components/ui/table/EmptyState";
import { ProspectListItem } from "../types";

interface ProspectTableProps {
  items: ProspectListItem[];
  onToggleEnrolled: (itemId: number) => void;
  onRemoveItem: (itemId: number) => void;
  loading: boolean;
}

export function ProspectTable({
  items,
  onToggleEnrolled,
  onRemoveItem,
  loading,
}: ProspectTableProps) {
  if (loading) {
    return (
      <div className="py-8 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No hay estudiantes en esta lista"
        description="Buscá y agregá estudiantes usando el buscador de arriba."
      />
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader align="center" className="w-12">N°</TableCell>
            <TableCell isHeader>CI</TableCell>
            <TableCell isHeader>Nombre completo</TableCell>
            <TableCell isHeader>Teléfono</TableCell>
            <TableCell isHeader align="center">Inscripto</TableCell>
            <TableCell isHeader align="center">Acciones</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.itemId}>
              <TableCell align="center" className="text-text-tertiary text-xs">
                {index + 1}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {item.student?.studentCi || `ID:${item.studentsId}`}
              </TableCell>
              <TableCell>
                <span className="font-medium text-text-primary dark:text-text-emphasis">
                  {item.student
                    ? `${item.student.name} ${item.student.surname}`
                    : "Sin datos"}
                </span>
              </TableCell>
              <TableCell className="text-text-secondary text-sm">
                {item.student?.contactPhone || "—"}
              </TableCell>
              <TableCell align="center">
                <button
                  type="button"
                  onClick={() => onToggleEnrolled(item.itemId)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
                    item.enrolled
                      ? "bg-success-500"
                      : "bg-gray-300 dark:bg-white/10"
                  }`}
                  role="switch"
                  aria-checked={item.enrolled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      item.enrolled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </TableCell>
              <TableCell align="center">
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.itemId)}
                  className="p-1.5 rounded-lg text-text-tertiary hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                  title="Eliminar estudiante"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-3 text-xs text-text-tertiary text-right">
        {items.length} estudiante{items.length !== 1 ? "s" : ""} en la lista
      </div>
    </div>
  );
}

export default ProspectTable;
