import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { Periodo } from "../../../../features/periods/types";
import { PDFService } from "../../../../services/pdf/PDFService";

interface PeriodoPDFProps {
  data: Periodo[];
}

const PeriodoPDF: React.FC<PeriodoPDFProps> = ({ data }) => {
  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1:
        return "PENDIENTE";
      case 2:
        return "EN CURSO";
      case 3:
        return "CULMINADO";
      default:
        return "DESCONOCIDO";
    }
  };

  const getStatusStyle = (status: number) => {
    switch (status) {
      case 1:
        return pdfStyles.badgeWarning;
      case 2:
        return pdfStyles.badgeSuccess;
      case 3:
        return pdfStyles.badgeSecondary;
      default:
        return {};
    }
  };

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
          <Text style={[pdfStyles.tableCell, { flex: 1.5, textAlign: "center" }]}>Estado</Text>
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
            <View style={[pdfStyles.tableCell, { flex: 1.5, alignItems: "center" }]}>
              <View style={[pdfStyles.badge, getStatusStyle(period.periodStatus)]}>
                <Text style={pdfStyles.badgeText}>{getStatusLabel(period.periodStatus)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};

export default PeriodoPDF;
