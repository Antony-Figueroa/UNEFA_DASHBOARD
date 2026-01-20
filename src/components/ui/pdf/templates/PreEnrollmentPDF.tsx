import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { PreEnrollment, PreEnrollmentRowData } from "../../../../features/pre-enrollment/types";
import { PDFService } from "../../../../services/pdf/PDFService";

interface PreEnrollmentPDFProps {
  data: PreEnrollment[] | PreEnrollmentRowData[];
}

export const PreEnrollmentPDF: React.FC<PreEnrollmentPDFProps> = ({ data }) => {
  return (
    <PDFLayout
      title="Reporte de Pre-Inscripciones"
      subtitle="Solicitudes de inicio de prácticas profesionales"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>Cédula</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>Estudiante</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2 }]}>Carrera</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Período / Tipo</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Matrícula</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1, textAlign: "center" }]}>Estado</Text>
        </View>

        {data.map((item, index) => (
          <View key={item.preEnrollmentId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>
              {item.identificationPrefix}-{item.identificationNumber}
            </Text>
            <View style={[pdfStyles.tableCell, { flex: 2.5 }]}>
              <Text style={{ fontWeight: "bold" }}>{item.studentName}</Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                Tel: {item.phone}
              </Text>
            </View>
            <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{item.careerName}</Text>
            <View style={[pdfStyles.tableCell, { flex: 1.5 }]}>
              <Text>{item.period}</Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                {item.practiceType}
              </Text>
            </View>
            <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>{item.enrollmentCode}</Text>
            <View style={[pdfStyles.tableCell, { flex: 1, alignItems: "center" }]}>
              <View style={[pdfStyles.badge, item.status ? pdfStyles.badgeSuccess : pdfStyles.badgeError]}>
                <Text style={pdfStyles.badgeText}>{PDFService.formatStatus(item.status)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};
