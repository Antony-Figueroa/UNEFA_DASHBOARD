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
      title="Reporte De Instituciones"
      subtitle="Convenios y sedes de empresas o instituciones para prácticas profesionales"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 0.8 }]}>RIF</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2 }]}>Nombre de la Empresa o Institución</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>Dirección</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>Teléfono</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Carrera</Text>
        </View>

        {data.map((institution, index) => (
          <View key={institution.institutionId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 0.8, fontSize: 8 }]}>{institution.rif}</Text>
            <View style={[pdfStyles.tableCell, { flex: 2 }]}>
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>{institution.name}</Text>
              <Text style={{ fontSize: 7, color: "#64748B", marginTop: 1 }}>
                {institution.institutionType}
              </Text>
            </View>
            <Text style={[pdfStyles.tableCell, { flex: 2.5, fontSize: 8 }]}>{institution.fiscalAddress}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, fontSize: 8 }]}>{institution.phone}</Text>
            <View style={[pdfStyles.tableCell, { flex: 1.5 }]}>
              {(institution.careerNames && institution.careerNames.length > 0
                ? institution.careerNames
                : ["N/A"]
              ).map((name: string, i: number) => (
                <Text key={i} style={{ fontSize: 7, color: "#374151", lineHeight: 1.4 }}>
                  {name}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};
