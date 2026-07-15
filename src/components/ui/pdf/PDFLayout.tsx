import React from "react";
import { Page, Text, View, Document, Image } from "@react-pdf/renderer";
import { pdfStyles } from "./PDFStyles";

interface PDFLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  orientation?: "portrait" | "landscape";
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string;
  };
  hideReportTitle?: boolean;
  verificationHash?: string;
  qrCodeDataUri?: string;
}

/**
 * Componente base para todos los reportes PDF.
 * Proporciona el encabezado, pie de página y estructura común.
 */
const PDFLayout: React.FC<PDFLayoutProps> = ({ 
  title, 
  subtitle, 
  children, 
  orientation = "portrait",
  metadata,
  hideReportTitle = false,
  verificationHash,
  qrCodeDataUri
}) => {
  return (
    <Document
      title={title}
      author={metadata?.author || "UNEFA Dashboard"}
      subject={metadata?.subject || "Reporte del Sistema"}
      keywords={metadata?.keywords || "unefa, reporte, sistema"}
    >
      <Page size="A4" orientation={orientation} style={pdfStyles.page}>
        {/* Encabezado Institucional (Membrete) */}
        <View style={pdfStyles.institutionalHeader} fixed>
          <Image 
            src="/pdfs-docs/escudo.png" 
            style={pdfStyles.headerImages} 
          />
          <View style={pdfStyles.institutionalTextContainer}>
            <Text style={pdfStyles.institutionalText}>REPÚBLICA BOLIVARIANA DE VENEZUELA</Text>
            <Text style={pdfStyles.institutionalText}>MINISTERIO DEL PODER POPULAR PARA LA DEFENSA</Text>
            <Text style={pdfStyles.institutionalText}>UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA</Text>
            <Text style={pdfStyles.institutionalText}>DE LA FUERZA ARMADA NACIONAL BOLIVARIANA</Text>
            <Text style={pdfStyles.institutionalText}>VICERRECTORADO REGIÓN LOS LLANOS</Text>
            <Text style={pdfStyles.institutionalText}>NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA</Text>
            <Text style={pdfStyles.institutionalText}>COORDINACIÓN DE PRÁCTICA PROFESIONAL</Text>
          </View>
          <Image 
            src="/pdfs-docs/logo.png" 
            style={pdfStyles.headerImages} 
          />
        </View>

        {/* Título del Reporte */}
        {!hideReportTitle && (
          <View style={pdfStyles.reportTitleContainer}>
            <Text style={pdfStyles.reportTitle}>{title}</Text>
            {subtitle && <Text style={pdfStyles.reportSubtitle}>{subtitle}</Text>}
          </View>
        )}

        {/* Content */}
        <View style={{ flex: 1 }}>
          {children}
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <View style={pdfStyles.footerLeft}>
            {qrCodeDataUri && (
              <Image 
                src={qrCodeDataUri}
                style={pdfStyles.qrPlaceholder} 
              />
            )}
            <Text>Documento validado digitalmente por la Coordinación de Prácticas Profesionales</Text>
          </View>
          <Text 
            style={pdfStyles.pageNumber} 
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} 
          />
        </View>
      </Page>
    </Document>
  );
};

export default PDFLayout;
