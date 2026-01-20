import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { Enrollment, EnrollmentRowData } from "../../../../features/enrollment/types";
// import { PDFService } from "../../../../services/pdf/PDFService";

interface EnrollmentPDFProps {
  data: Enrollment[] | EnrollmentRowData[];
}

export const EnrollmentPDF: React.FC<EnrollmentPDFProps> = ({ data }) => {
  return (
    <PDFLayout
      title="Reporte de Inscripciones"
      subtitle="Procesos de pasantías formalizados y en curso"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>ID / Cédula</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>Estudiante / Carrera</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>Institución / Responsable</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>Tutores (Acad/Met)</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Período / Tipo</Text>
        </View>

        {data.map((item, index) => (
          <View key={item.enrollmentId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>
              {item.identificationPrefix}-{item.identificationNumber}
            </Text>
            <View style={[pdfStyles.tableCell, { flex: 2.5 }]}>
              <Text style={{ fontWeight: "bold" }}>{item.studentName}</Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                {item.careerName}
              </Text>
            </View>
            <View style={[pdfStyles.tableCell, { flex: 2.5 }]}>
              <Text>{item.institutionName}</Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                Resp: {item.institutionResponsibleName}
              </Text>
            </View>
            <View style={[pdfStyles.tableCell, { flex: 2.5 }]}>
              <Text style={{ fontSize: 9 }}>A: {item.academicTutorName}</Text>
              <Text style={{ fontSize: 9, marginTop: 2 }}>M: {item.methodologicalTutorName}</Text>
            </View>
            <View style={[pdfStyles.tableCell, { flex: 1.5 }]}>
              <Text>{item.period}</Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                {item.practiceType}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};
