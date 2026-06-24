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
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>CÓDIGO</Text>
          <Text style={[pdfStyles.tableCell, { flex: 3 }]}>NOMBRE DE LA CARRERA</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>ABREV.</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: "center" }]}>TIPO CARRERA</Text>
        </View>

        {data.map((career, index) => (
          <View key={career.careerId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{career.careerCode}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 3 }]}>{career.careerName}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{career.careerAbbreviation}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: "center" }]}>{career.careerType === "CORTA" ? "Corta" : "Larga"}</Text>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};
