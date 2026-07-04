import { useState, useCallback } from 'react';
import { pdf, DocumentProps } from '@react-pdf/renderer';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';

interface UseSingleReportOptions {
  fileName: string;
}

interface UseSingleReportReturn {
  isGenerating: boolean;
  generatePDF: (template: React.ReactElement<DocumentProps>) => Promise<void>;
  previewPDF: (template: React.ReactElement<DocumentProps>) => Promise<void>;
}

export const useSingleReport = ({ fileName }: UseSingleReportOptions): UseSingleReportReturn => {
  const { addToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = useCallback(async (template: React.ReactElement<DocumentProps>) => {
    setIsGenerating(true);
    try {
      const blob = await pdf(template).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast({ variant: "success", title: "Reporte generado", message: "Reporte generado exitosamente" });
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast({ variant: "error", title: "Error al generar", message: "Error al generar el reporte" });
    } finally {
      setIsGenerating(false);
    }
  }, [fileName]);

  const previewPDF = useCallback(async (template: React.ReactElement<DocumentProps>) => {
    setIsGenerating(true);
    try {
      const blob = await pdf(template).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      addToast({ variant: "success", title: "Abriendo reporte", message: "Abriendo reporte en nueva pestaña" });
    } catch (error) {
      console.error('Error previewing PDF:', error);
      addToast({ variant: "error", title: "Error al previsualizar", message: "Error al previsualizar el reporte" });
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    generatePDF,
    previewPDF
  };
};
