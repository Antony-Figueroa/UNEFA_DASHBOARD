import React from "react";
import { Text, View } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { Student, StudentRowData } from "../../../../features/students/types";

interface StudentPDFProps {
  data: Student[] | StudentRowData[];
}

export const StudentPDF: React.FC<StudentPDFProps> = ({ data }) => {
  return (
    <PDFLayout title="Reporte de Estudiantes" subtitle="Listado detallado de estudiantes registrados">
      <View style={pdfStyles.table}>
        {/* Table Header */}
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Cédula</Text>
          <Text style={[pdfStyles.tableCell, { flex: 5 }]}>Nombre Completo</Text>
        </View>

        {/* Table Body */}
        {data.map((student, index) => (
          <View key={student.studentId || index} style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>
              {student.identificationPrefix}-{student.identificationNumber}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 5 }]}>
              {`${student.firstName} ${student.lastName}`}
            </Text>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};

export default StudentPDF;
