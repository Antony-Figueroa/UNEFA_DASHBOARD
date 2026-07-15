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
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]} wrap={false}>
          <Text style={[pdfStyles.tableCell, { flex: 0.8, fontSize: 8 }]}>RIF</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>NOMBRE DE LA EMPRESA</Text>
          <Text style={[pdfStyles.tableCell, { flex: 3.5, fontSize: 8 }]}>DIRECCIÓN FISCAL</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1, fontSize: 8 }]}>TELÉFONO</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>CARRERA</Text>
        </View>

        {data.map((institution, index) => {
          const careers = (institution.careerNames && institution.careerNames.length > 0
            ? institution.careerNames
            : ["N/A"]
          ).join('\n');
          return (
          <View key={institution.institutionId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 0.8, fontSize: 8 }]}>{institution.rif}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>
              <Text>{institution.name}</Text>
              {'\n'}
              <Text style={{ fontSize: 7, color: "#000000" }}>{institution.institutionType}</Text>
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 3.5, fontSize: 8 }]}>{institution.fiscalAddress}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1, fontSize: 8 }]}>{institution.phone}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 7 }]}>{careers}</Text>
          </View>
          );
        })}
      </View>
    </PDFLayout>
  );
};
