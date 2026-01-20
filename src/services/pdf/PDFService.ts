/**
 * Servicio centralizado para la gestión de generación de reportes PDF.
 */

export interface PDFColumn<T> {
  header: string;
  key: keyof T | string;
  width?: number | string;
  render?: (item: T) => string | React.ReactNode;
}

export class PDFService {
  /**
   * Normaliza los datos para ser mostrados en las tablas del PDF.
   */
  static normalizeData<T>(data: T[], columns: PDFColumn<T>[]) {
    return data.map(item => {
      const row: Record<string, any> = {};
      columns.forEach(col => {
        if (col.render) {
          row[col.header] = col.render(item);
        } else {
          row[col.header] = item[col.key as keyof T] || "";
        }
      });
      return row;
    });
  }

  /**
   * Formatea una fecha para el PDF.
   */
  static formatDate(date: string | Date): string {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-VE");
  }

  /**
   * Formatea un booleano como texto legible.
   */
  static formatBoolean(value: boolean): string {
    return value ? "SÍ" : "NO";
  }

  /**
   * Formatea el estado (Activo/Inactivo).
   */
  static formatStatus(status: boolean): string {
    return status ? "ACTIVO" : "INACTIVO";
  }
}
