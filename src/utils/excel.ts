import * as XLSX from 'xlsx';

export interface ExportColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  formatter?: (value: unknown, row: T) => string;
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  fileName: string,
  sheetName: string = 'Datos'
): void {
  const worksheetData = data.map(row => {
    const rowData: Record<string, unknown> = {};
    columns.forEach(col => {
      const value = row[col.key as keyof T];
      rowData[col.label] = col.formatter ? col.formatter(value, row) : value;
    });
    return rowData;
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const columnWidths = columns.map(col => ({ wch: Math.max(col.label.length, 15) }));
  worksheet['!cols'] = columnWidths;

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function importFromExcel<T = Record<string, unknown>>(
  file: File
): Promise<{ data: T[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet);
        
        const headers = jsonData.length > 0 
          ? Object.keys(jsonData[0] as Record<string, unknown>) 
          : [];
        
        resolve({ data: jsonData, headers });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsBinaryString(file);
  });
}

export function getExcelColumnLabel(index: number): string {
  let label = '';
  while (index >= 0) {
    label = String.fromCharCode(65 + (index % 26)) + label;
    index = Math.floor(index / 26) - 1;
  }
  return label;
}

export function validateExcelHeaders(
  actualHeaders: string[],
  requiredHeaders: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredHeaders.filter(h => 
    !actualHeaders.some(ah => ah.toLowerCase() === h.toLowerCase())
  );
  return { valid: missing.length === 0, missing };
}
