import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { PreEnrollment, PreEnrollmentRowData } from "../../../../features/pre-enrollment/types";

interface PreEnrollmentPDFProps {
  data: PreEnrollment[] | PreEnrollmentRowData[];
}

const formatCI = (prefix: string | undefined, number: string | undefined): string => {
  const p = (prefix || '').replace(/-/g, '');
  const n = (number || '').replace(/-/g, '');
  return `${p}-${n}`.replace(/--/g, '-');
};

export const PreEnrollmentPDF: React.FC<PreEnrollmentPDFProps> = ({ data }) => {
  return (
    <PDFLayout
      title="Reporte de Pre-Inscripciones"
      subtitle="Solicitudes de inicio de prácticas profesionales"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]} wrap={false}>
          <Text style={[pdfStyles.tableCell, { flex: 1.2, fontSize: 8 }]}>CÉDULA</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2.5, fontSize: 8 }]}>ESTUDIANTE</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2, fontSize: 8 }]}>CARRERA</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>PERÍODO / TIPO</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>MATRÍCULA</Text>
        </View>

        {data.map((item, index) => (
          <View key={item.preEnrollmentId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 1.2, fontSize: 8 }]}>
              {formatCI(item.identificationPrefix, item.identificationNumber)}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 2.5, fontSize: 8 }]}>
              <Text style={{ fontWeight: "bold" }}>{item.studentName}</Text>
              {'\n'}
              <Text style={{ fontSize: 7, color: "#64748B" }}>Tel: {item.phone}</Text>
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 2, fontSize: 8 }]}>{item.careerName}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>
              <Text>{item.period}</Text>
              {'\n'}
              <Text style={{ fontSize: 7, color: "#64748B" }}>{item.practiceType}</Text>
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>{item.enrollmentCode}</Text>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};

export default PreEnrollmentPDF;
