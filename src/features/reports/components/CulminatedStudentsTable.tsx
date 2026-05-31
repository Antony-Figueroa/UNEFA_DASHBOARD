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
              <TableCell isHeader>Institución</TableCell>
              <TableCell isHeader>Tipo</TableCell>
              <TableCell isHeader>Tutor</TableCell>
              <TableCell isHeader>Período</TableCell>
              <TableCell isHeader>Inicio</TableCell>
              <TableCell isHeader>Fin</TableCell>
              <TableCell isHeader>Horas</TableCell>
              <TableCell isHeader>Nota</TableCell>
              <TableCell isHeader>Estado</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{(safePage - 1) * rowsPerPage + index + 1}</TableCell>
                <TableCell>{item.studentCi}</TableCell>
                <TableCell className="font-medium">{item.studentName}</TableCell>
                <TableCell>{item.careerName}</TableCell>
                <TableCell>{item.institutionName}</TableCell>
                <TableCell>{item.practiceType}</TableCell>
                <TableCell>{item.tutorName}</TableCell>
                <TableCell>{item.period}</TableCell>
                <TableCell>{formatDate(item.startDate)}</TableCell>
                <TableCell>{formatDate(item.endDate)}</TableCell>
                <TableCell className="text-center">{item.totalHours}</TableCell>
                <TableCell className="text-center">{item.grade > 0 ? item.grade.toFixed(1) : '-'}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
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
