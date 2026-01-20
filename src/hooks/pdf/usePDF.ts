import { useState, useCallback } from "react";
import { pdf, DocumentProps } from "@react-pdf/renderer";

interface UsePDFOptions {
  fileName?: string;
}

export const usePDF = (options: UsePDFOptions = {}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generatePDF = useCallback(async (template: React.ReactElement, fileName?: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const blob = await pdf(template as React.ReactElement<DocumentProps>).toBlob();
      const finalFileName = fileName || options.fileName || `reporte-${Date.now()}.pdf`;
      
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = finalFileName;
      link.click();
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      return blob;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error generating PDF");
      setError(error);
      console.error("PDF Generation Error:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [options.fileName]);

  const previewPDF = useCallback(async (template: React.ReactElement) => {
    setIsGenerating(true);
    setError(null);
    try {
      const blob = await pdf(template as React.ReactElement<DocumentProps>).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      
      // We don't revoke immediately to allow viewing
      return url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error previewing PDF");
      setError(error);
      console.error("PDF Preview Error:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generatePDF,
    previewPDF,
    isGenerating,
    error,
  };
};
