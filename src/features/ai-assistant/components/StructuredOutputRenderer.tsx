/**
 * StructuredOutputRenderer - Renderiza respuestas JSON estructuradas de la IA
 *
 * Tipos soportados:
 * - table: Datos tabulares con columnas y filas
 * - action: Resultados de acciones
 * - error: Mensajes de error estructurados
 * - text: Texto plano (default)
 */

import React from 'react';

// ============================================
// Types
// ============================================

export interface TableData {
  response_type: 'table';
  title: string;
  description?: string;
  columns: Array<{
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
  }>;
  rows: Record<string, unknown>[];
  total?: number;
  message?: string;
}

export interface ActionData {
  response_type: 'action';
  action: 'create' | 'update' | 'delete' | 'navigate' | 'show';
  entity: string;
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  redirect?: string;
}

export interface ErrorData {
  response_type: 'error';
  error: string;
  message: string;
  suggestion?: string;
}

export type StructuredData = TableData | ActionData | ErrorData;

// ============================================
// Helper Functions
// ============================================

/**
 * Intenta parsear el contenido como JSON estructurado
 */
export const tryParseStructuredOutput = (content: string): StructuredData | null => {
  try {
    // Buscar JSON en el contenido (puede haber texto antes/después)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // Verificar si es un tipo válido
    if (parsed.response_type && ['table', 'action', 'error'].includes(parsed.response_type)) {
      return parsed as StructuredData;
    }

    return null;
  } catch {
    return null;
  }
};

// ============================================
// Component: Table Renderer
// ============================================

const TableRenderer: React.FC<{ data: TableData }> = ({ data }) => {
  if (!data.columns || !data.rows || data.rows.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">{data.message || 'Sin datos disponibles'}</p>;
  }

  return (
    <div className="overflow-x-auto my-3">
      {data.title && (
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {data.title}
        </h4>
      )}
      <table className="min-w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            {data.columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-3 py-2 font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.slice(0, 10).map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              {data.columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`px-3 py-2 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {row[col.key] !== undefined ? String(row[col.key]) : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.total !== undefined && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Total: {data.total} registros
        </p>
      )}
    </div>
  );
};

// ============================================
// Component: Action Renderer
// ============================================

const ActionRenderer: React.FC<{ data: ActionData }> = ({ data }) => {
  const actionColors = {
    create: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    update: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    delete: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    navigate: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    show: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  };

  const actionLabels = {
    create: 'Creado',
    update: 'Actualizado',
    delete: 'Eliminado',
    navigate: 'Navegando',
    show: 'Mostrado',
  };

  return (
    <div className={`p-3 rounded-lg ${data.success ? actionColors[data.action] : 'bg-red-100 dark:bg-red-900/30'}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {data.success ? '✅' : '❌'}
        </span>
        <span className="font-medium">
          {data.success ? actionLabels[data.action] : 'Error'}: {data.entity}
        </span>
      </div>
      <p className="text-sm mt-1">{data.message}</p>
    </div>
  );
};

// ============================================
// Component: Error Renderer
// ============================================

const ErrorRenderer: React.FC<{ data: ErrorData }> = ({ data }) => {
  return (
    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
      <div className="flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        <span className="font-medium text-red-700 dark:text-red-400">{data.error}</span>
      </div>
      <p className="text-sm mt-1 text-red-600 dark:text-red-300">{data.message}</p>
      {data.suggestion && (
        <p className="text-xs mt-2 text-red-500 dark:text-red-400">
          💡 {data.suggestion}
        </p>
      )}
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export const StructuredOutputRenderer: React.FC<{ content: string }> = ({ content }) => {
  // Primero verificar si es un JSON estructurado
  const structured = tryParseStructuredOutput(content);

  if (!structured) {
    // No es JSON estructurado, renderizar texto normal
    return null;
  }

  // Renderizar según el tipo
  switch (structured.response_type) {
    case 'table':
      return <TableRenderer data={structured as TableData} />;
    case 'action':
      return <ActionRenderer data={structured as ActionData} />;
    case 'error':
      return <ErrorRenderer data={structured as ErrorData} />;
    default:
      return null;
  }
};

// ============================================
// Helper para verificar si el contenido es estructurado
// ============================================

export const isStructuredOutput = (content: string): boolean => {
  return tryParseStructuredOutput(content) !== null;
};

export default StructuredOutputRenderer;