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
      subtitle="Historial y estado de los períodos de pasantías"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>Código</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2 }]}>Descripción</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Fecha Inicio</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Fecha Fin</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>Estado</Text>
        </View>

        {data.map((period, index) => (
          <View key={period.periodId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{period.code}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{period.description}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>
              {PDFService.formatDate(period.startDate)}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>
              {PDFService.formatDate(period.endDate)}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>
              {STATUS_LABELS[period.periodStatus as keyof typeof STATUS_LABELS] || "Desconocido"}
            </Text>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};

export default PeriodoPDF;
