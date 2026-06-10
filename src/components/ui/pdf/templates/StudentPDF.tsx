import React from "react";
import { Text, View } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { Student, StudentRowData } from "../../../../features/students/types";

interface StudentPDFProps {
  data: Student[] | StudentRowData[];
}

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const fullName = (s: Student | StudentRowData): string =>
  [s.firstName, s.middleName, s.lastName, s.secondLastName].filter(Boolean).join(' ');

export const StudentPDF: React.FC<StudentPDFProps> = ({ data }) => {
  return (
    <PDFLayout title="Reporte de Estudiantes" subtitle="Listado detallado de estudiantes registrados">
      <View style={pdfStyles.table}>
        {/* Table Header */}
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Cédula</Text>
          <Text style={[pdfStyles.tableCell, { flex: 3 }]}>Nombre Completo</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>Sexo</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Teléfono</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2 }]}>Correo Electrónico</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Fecha Registro</Text>
        </View>

        {/* Table Body */}
        {data.map((student, index) => (
          <View key={student.studentId || index} style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>
              {student.identificationPrefix}-{student.identificationNumber}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 3 }]}>
              {fullName(student)}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>
              {student.sex === 'FEMENINO' ? 'F' : student.sex === 'MASCULINO' ? 'M' : student.sex}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>
              {student.phone || '-'}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 2 }]}>
              {student.email || '-'}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>
              {formatDate(student.enrollmentDate)}
            </Text>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};

export default StudentPDF;
