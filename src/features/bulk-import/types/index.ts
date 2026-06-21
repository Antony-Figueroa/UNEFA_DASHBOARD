export type ImportType = 'students' | 'enrollments';
export type BulkImportStep = 'select-type' | 'upload' | 'preview' | 'confirm' | 'results';

export interface PreviewRow {
  row: number;
  data: Record<string, string>;
  errors: string[];
  warnings: string[];
}

export interface PreviewResponse {
  success: boolean;
  data: {
    type: ImportType;
    columns: string[];
    rows: PreviewRow[];
    summary: { total: number; valid: number; invalid: number };
    duplicates: Array<{ row: number; ci: string }>;
  };
}

export interface ExecutePayload {
  type: ImportType;
  rows: Array<{ data: Record<string, string> }>;
  options: { skipDuplicates: boolean; updateExisting: boolean };
}

export interface ExecuteResponse {
  success: boolean;
  results: {
    total: number;
    inserted: number;
    updated: number;
    errors: number;
    details: Array<{ row: number; status: string; message: string }>;
  };
}
