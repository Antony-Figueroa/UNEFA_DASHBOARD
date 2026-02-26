import React from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../../components/ui/table';
import Badge from '../../../components/ui/badge/Badge';
import { CulminatedStudentReportRow } from '../services/reportsService';

interface CulminatedStudentsTableProps {
  data: CulminatedStudentReportRow[];
  loading?: boolean;
}

const CulminatedStudentsTable: React.FC<CulminatedStudentsTableProps> = ({
  data,
  loading
}) => {
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
          {data.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell>{index + 1}</TableCell>
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
  );
};

export default CulminatedStudentsTable;
