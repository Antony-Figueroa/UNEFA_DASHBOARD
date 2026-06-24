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

const formatCI = (s: Student | StudentRowData): string => {
  const p = (s.identificationPrefix || '').replace(/-/g, '');
  const n = (s.identificationNumber || '').replace(/-/g, '');
  return `${p}-${n}`.replace(/--/g, '-');
};

export const StudentPDF: React.FC<StudentPDFProps> = ({ data }) => {
  return (
    <PDFLayout title="Reporte de Estudiantes" subtitle="Listado detallado de estudiantes registrados">
      <View style={pdfStyles.table}>
        {/* Table Header */}
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]} wrap={false}>
          <Text style={[pdfStyles.tableCell, { flex: 1, fontSize: 8 }]}>CÉDULA</Text>
          <Text style={[pdfStyles.tableCell, { flex: 3, fontSize: 8 }]}>NOMBRE COMPLETO</Text>
          <Text style={[pdfStyles.tableCell, { flex: 0.8, fontSize: 8 }]}>SEXO</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.2, fontSize: 8 }]}>TELÉFONO</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2, fontSize: 8 }]}>CORREO ELECTRÓNICO</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2, fontSize: 8 }]}>FECHA REGISTRO</Text>
        </View>

        {/* Table Body */}
        {data.map((student, index) => (
          <View key={student.studentId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 1, fontSize: 8 }]}>
              {formatCI(student)}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 3, fontSize: 8 }]}>
              {fullName(student)}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 0.8, fontSize: 8 }]}>
              {student.sex === 'FEMENINO' ? 'F' : student.sex === 'MASCULINO' ? 'M' : student.sex}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.2, fontSize: 8 }]}>
              {student.phone || '-'}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 2, fontSize: 8 }]}>
              {student.email || '-'}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 2, fontSize: 8 }]}>
              {formatDate(student.enrollmentDate)}
            </Text>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};

export default StudentPDF;
