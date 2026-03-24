import React from 'react';
import Badge from '../../../components/ui/badge/Badge';
import { AuditLog } from '../types';

interface AuditLogsTableProps {
  data: AuditLog[];
  loading: boolean;
}

const getOperationColor = (operation: string) => {
  switch (operation) {
    case 'INSERT':
      return 'success';
    case 'UPDATE':
      return 'warning';
    case 'DELETE':
      return 'error';
    default:
      return 'default';
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const truncateValue = (value: string, maxLength: number = 50) => {
  if (!value) return '-';
  return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
};

export const AuditLogsTable: React.FC<AuditLogsTableProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary">
        No hay registros de auditoría disponibles
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-tertiary">
              Fecha/Hora
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-tertiary">
              Operación
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-tertiary">
              Tabla
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-tertiary">
              Campo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-tertiary">
              Usuario
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-tertiary">
              Valor Anterior
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-tertiary">
              Valor Nuevo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-tertiary">
              IP
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((log) => (
            <tr 
              key={log.id} 
              className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <td className="px-4 py-3 text-sm text-text-secondary">
                {formatDate(log.dateTime)}
              </td>
              <td className="px-4 py-3">
                <Badge color={getOperationColor(log.operation) as any} variant="light">
                  {log.operation}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm font-medium text-text-primary">
                {log.tableLabel || log.tableName}
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">
                {log.columnName}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="text-text-primary font-medium">{log.userName || 'Sistema'}</div>
                {log.userCi && <div className="text-xs text-text-tertiary">{log.userCi}</div>}
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary max-w-xs">
                <span title={log.oldValue}>
                  {truncateValue(log.oldValue)}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary max-w-xs">
                <span title={log.newValue}>
                  {truncateValue(log.newValue)}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-text-tertiary">
                {log.ipAddress || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLogsTable;
