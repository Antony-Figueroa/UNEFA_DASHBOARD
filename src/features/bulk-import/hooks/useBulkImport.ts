import { useState, useCallback } from 'react';
import { bulkImportService } from '../services/bulkImportService';
import type { ImportType, BulkImportStep, PreviewResponse, ExecuteResponse } from '../types';

export function useBulkImport() {
  const [step, setStep] = useState<BulkImportStep>('select-type');
  const [type, setType] = useState<ImportType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse['data'] | null>(null);
  const [options, setOptions] = useState({ skipDuplicates: true, updateExisting: false });
  const [results, setResults] = useState<ExecuteResponse['results'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectType = useCallback((t: ImportType) => {
    setType(t);
    setStep('upload');
  }, []);

  const downloadTemplate = useCallback(async () => {
    if (!type) return;
    setLoading(true);
    try {
      await bulkImportService.downloadTemplate(type);
    } finally {
      setLoading(false);
    }
  }, [type]);

  const uploadFile = useCallback(async (f: File) => {
    setFile(f);
    setLoading(true);
    setError(null);
    try {
      const res = await bulkImportService.previewImport(f);
      if (!res.success) {
        setError('Error al procesar el archivo');
        return;
      }
      setPreview(res.data);
      setStep('preview');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar el archivo';
      setError(message);
      // Stay on upload so user can retry
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmImport = useCallback(async () => {
    if (!type || !preview) return;
    setLoading(true);
    setError(null);
    try {
      const validRows = preview.rows.filter(r => r.errors.length === 0);
      const res = await bulkImportService.executeImport({
        type,
        rows: validRows.map(r => ({ data: r.data })),
        options,
      });
      setResults(res.results);
      setStep('results');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al importar';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [type, preview, options]);

  const reset = useCallback(() => {
    setStep('select-type');
    setType(null);
    setFile(null);
    setPreview(null);
    setOptions({ skipDuplicates: true, updateExisting: false });
    setResults(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    step, type, file, preview, options, results, loading, error,
    setOptions,
    selectType, downloadTemplate, uploadFile, confirmImport, reset,
  } as const;
}
