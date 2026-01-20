import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { Institution, InstitutionRowData } from "../../../../features/institutions/types";
// import { PDFService } from "../../../../services/pdf/PDFService";

interface InstitutionPDFProps {
  data: Institution[] | InstitutionRowData[];
}

export const InstitutionPDF: React.FC<InstitutionPDFProps> = ({ data }) => {
  return (
    <PDFLayout
      title="Reporte de Instituciones"
      subtitle="Convenios y sedes para prácticas profesionales"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>RIF</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>Institución</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2 }]}>Ubicación</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Carrera / Tipo</Text>
        </View>

        {data.map((institution, index) => (
          <View key={institution.institutionId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>{institution.rif}</Text>
            <View style={[pdfStyles.tableCell, { flex: 2.5 }]}>
              <Text style={{ fontWeight: "bold" }}>{institution.name}</Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                {institution.institutionType}
              </Text>
              <Text style={{ fontSize: 8, color: "#64748B" }}>
                Tel: {institution.phone}
              </Text>
            </View>
            <View style={[pdfStyles.tableCell, { flex: 2 }]}>
              <Text>{institution.region}</Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                {institution.nucleus} - {institution.extension}
              </Text>
            </View>
            <View style={[pdfStyles.tableCell, { flex: 1.5 }]}>
              <Text>{institution.careerName || "N/A"}</Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                {institution.practiceType}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};
