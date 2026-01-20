import React from "react";
import { Text, View } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { Student } from "../../../../features/students/types";

interface StudentPDFProps {
  data: Student[];
}

export const StudentPDF: React.FC<StudentPDFProps> = ({ data }) => {
  return (
    <PDFLayout title="Reporte de Estudiantes" subtitle="Listado detallado de estudiantes registrados">
      <View style={pdfStyles.table}>
        {/* Table Header */}
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Cédula</Text>
          <Text style={[pdfStyles.tableCell, { flex: 3 }]}>Nombre Completo</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>Carrera</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>Sem/Sec</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Estado</Text>
        </View>

        {/* Table Body */}
        {data.map((student, index) => (
          <View key={student.studentId || index} style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>
              {student.identificationPrefix}-{student.identificationNumber}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 3 }]}>
              {`${student.firstName} ${student.lastName}`}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>
              {student.careerName || "N/A"}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>
              {`${student.semester}-${student.section}`}
            </Text>
            <View style={[pdfStyles.tableCell, { flex: 1.5 }]}>
              <Text style={[
                pdfStyles.badge, 
                student.status ? pdfStyles.badgeSuccess : pdfStyles.badgeError
              ]}>
                {student.status ? "ACTIVO" : "INACTIVO"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};

export default StudentPDF;
