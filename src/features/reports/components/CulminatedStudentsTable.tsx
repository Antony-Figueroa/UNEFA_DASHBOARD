import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../../components/ui/table';
import Badge from '../../../components/ui/badge/Badge';
import Button from '../../../components/ui/button/Button';
import { CulminatedStudentReportRow } from '../services/reportsService';

interface CulminatedStudentsTableProps {
  data: CulminatedStudentReportRow[];
  loading?: boolean;
  rowsPerPage?: number;
}

const CulminatedStudentsTable: React.FC<CulminatedStudentsTableProps> = ({
  data,
  loading,
  rowsPerPage = 20
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = data.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge color="success" variant="solid">Aprobado</Badge>;
      case 'certified':
        return <Badge color="info" variant="solid">Certificado</Badge>;
      case 'pending':
      default:
        return <Badge color="warning" variant="light">Pendiente</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary dark:text-gray-400">
          No se encontraron estudiantes culminados con los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>#</TableCell>
              <TableCell isHeader>Cédula</TableCell>
              <TableCell isHeader>Estudiante</TableCell>
              <TableCell isHeader>Carrera</TableCell>
              <TableCell isHeader className="hidden md:table-cell">Institución</TableCell>
              <TableCell isHeader className="hidden md:table-cell">Tipo</TableCell>
              <TableCell isHeader className="hidden md:table-cell">Tutor</TableCell>
              <TableCell isHeader className="hidden lg:table-cell">Período</TableCell>
              <TableCell isHeader className="hidden lg:table-cell">Inicio</TableCell>
              <TableCell isHeader className="hidden lg:table-cell">Fin</TableCell>
              <TableCell isHeader>Horas</TableCell>
              <TableCell isHeader>Nota</TableCell>
              <TableCell isHeader>Estado</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell className="uppercase">{(safePage - 1) * rowsPerPage + index + 1}</TableCell>
                <TableCell className="uppercase">{item.studentCi}</TableCell>
                <TableCell className="font-medium uppercase">{item.studentName}</TableCell>
                <TableCell className="uppercase">{item.careerName}</TableCell>
                <TableCell className="hidden md:table-cell uppercase">{item.institutionName}</TableCell>
                <TableCell className="hidden md:table-cell uppercase">{item.practiceType}</TableCell>
                <TableCell className="hidden md:table-cell uppercase">{item.tutorName}</TableCell>
                <TableCell className="hidden lg:table-cell uppercase">{item.period}</TableCell>
                <TableCell className="hidden lg:table-cell uppercase">{formatDate(item.startDate)}</TableCell>
                <TableCell className="hidden lg:table-cell uppercase">{formatDate(item.endDate)}</TableCell>
                <TableCell className="text-center uppercase">{item.totalHours}</TableCell>
                <TableCell className="text-center uppercase">{item.grade > 0 ? item.grade.toFixed(1) : '-'}</TableCell>
                <TableCell className="uppercase">{getStatusBadge(item.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-default dark:border-border-dark">
          <p className="text-sm text-text-secondary dark:text-text-tertiary">
            Mostrando {Math.min(data.length, rowsPerPage)} de {data.length} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => goToPage(safePage - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-text-secondary dark:text-text-tertiary px-3">
              Pág. {safePage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => goToPage(safePage + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CulminatedStudentsTable;
