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
  hideEquipoTrabajo?: boolean;
  equipoTrabajoText?: string;
  logoLeftSrc?: string;
  logoRightSrc?: string;
  /** Líneas del membrete que deben usar font normal (Times-Roman). Indices 0-based. */
  headerNormalLines?: number[];
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
  hideEquipoTrabajo = false,
  equipoTrabajoText = "EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES",
  logoLeftSrc = "/pdfs-docs/escudo.png",
  logoRightSrc = "/pdfs-docs/logo.png",
  headerNormalLines = [],
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
            src={logoLeftSrc}
            style={pdfStyles.headerImages} 
          />
          <View style={pdfStyles.institutionalTextContainer}>
            {[
              'REPÚBLICA BOLIVARIANA DE VENEZUELA',
              'MINISTERIO DEL PODER POPULAR PARA LA DEFENSA',
              'UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA',
              'DE LA FUERZA ARMADA NACIONAL BOLIVARIANA',
              'VICERRECTORADO DE LA REGIÓN LOS LLANOS',
              'NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA',
            ].map((text, idx) => (
              <Text key={idx} style={headerNormalLines.includes(idx) ? pdfStyles.institutionalTextNormal : pdfStyles.institutionalText}>
                {text}
              </Text>
            ))}
            {!hideEquipoTrabajo && (
              <Text style={pdfStyles.institutionalText}>{equipoTrabajoText}</Text>
            )}
          </View>
          <Image 
            src={logoRightSrc}
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
        <View style={{ flex: 1, fontFamily: 'Times-Roman' }}>
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
