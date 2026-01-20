import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { Career, CareerRowData } from "../../../../features/careers/types";
// import { PDFService } from "../../../../services/pdf/PDFService";

interface CarreraPDFProps {
  data: Career[] | CareerRowData[];
}

export const CarreraPDF: React.FC<CarreraPDFProps> = ({ data }) => {
  return (
    <PDFLayout
      title="Reporte de Carreras"
      subtitle="Listado de programas académicos y configuraciones"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>Código</Text>
          <Text style={[pdfStyles.tableCell, { flex: 3 }]}>Nombre de la Carrera</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>Abrev.</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>Tipo</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: "center" }]}>Nota Mín.</Text>
        </View>

        {data.map((career, index) => (
          <View key={career.careerId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{career.careerCode}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 3 }]}>{career.careerName}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{career.careerAbbreviation}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{career.careerType}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: "center" }]}>{career.minimumGrade}</Text>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};
