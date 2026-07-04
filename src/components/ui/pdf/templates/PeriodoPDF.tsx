import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { Periodo, PeriodoRowData } from "../../../../features/periods/types";
import { PDFService } from "../../../../services/pdf/PDFService";

interface PeriodoPDFProps {
  data: Periodo[] | PeriodoRowData[];
}

const STATUS_LABELS = {
  1: "Pendiente",
  2: "En Curso",
  3: "Culminado",
} as const;

const PeriodoPDF: React.FC<PeriodoPDFProps> = ({ data }) => {
  return (
    <PDFLayout
      title="Reporte de Períodos Académicos"
      subtitle="Historial y estado de los períodos de Prácticas Profesionales"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]} wrap={false}>
          <Text style={[pdfStyles.tableCell, { flex: 2.5, fontSize: 8 }]}>DESCRIPCIÓN</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>FECHA INICIO</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>FECHA FIN</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.2, fontSize: 8 }]}>ESTADO</Text>
        </View>

        {data.map((period, index) => (
          <View key={period.periodId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 2.5, fontSize: 8 }]}>{period.description}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>
              {PDFService.formatDate(period.startDate)}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>
              {PDFService.formatDate(period.endDate)}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.2, fontSize: 8 }]}>
              {STATUS_LABELS[period.periodStatus as keyof typeof STATUS_LABELS] || "Desconocido"}
            </Text>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};

export default PeriodoPDF;
