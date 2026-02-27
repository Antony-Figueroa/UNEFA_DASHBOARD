import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { CulminatedStudentReportRow } from "../../../../features/reports/services/reportsService";

interface CulminatedStudentsPDFProps {
  data: CulminatedStudentReportRow[];
  filters?: {
    period?: string;
    career?: string;
    status?: string;
    institution?: string;
  };
}

export const CulminatedStudentsPDF: React.FC<CulminatedStudentsPDFProps> = ({ data }) => {
  const totalHours = data.reduce((sum, item) => sum + item.totalHours, 0);
  const avgGrade = data.length > 0
    ? data.reduce((sum, item) => sum + (item.grade || 0), 0) / data.filter(item => item.grade > 0).length
    : 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-VE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Aprobado";
      case "certified": return "Certificado";
      case "pending": return "Pendiente";
      default: return status;
    }
  };

  return (
    <PDFLayout
      title="Reporte de Estudiantes Culminados"
      subtitle="Estudiantes que han completado sus prácticas profesionales"
      orientation="landscape"
    >
      {/* Tabla de estudiantes */}
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 0.5 }]}>#</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>Cédula</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>Estudiante</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2 }]}>Carrera</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2 }]}>Institución</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>Tipo</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2 }]}>Tutor</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>Período</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>Inicio</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>Fin</Text>
          <Text style={[pdfStyles.tableCell, { flex: 0.7, textAlign: "center" }]}>Horas</Text>
          <Text style={[pdfStyles.tableCell, { flex: 0.7, textAlign: "center" }]}>Nota</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1 }]}>Estado</Text>
        </View>

        {data.map((student, index) => (
          <View key={student.id || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 0.5 }]}>{index + 1}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{student.studentCi}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>{student.studentName}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{student.careerName}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{student.institutionName}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5 }]}>{student.practiceType}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 2 }]}>{student.tutorName}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{student.period}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{formatDate(student.startDate)}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{formatDate(student.endDate)}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 0.7, textAlign: "center" }]}>{student.totalHours}</Text>
            <Text style={[pdfStyles.tableCell, { flex: 0.7, textAlign: "center" }]}>
              {student.grade > 0 ? student.grade.toFixed(1) : "-"}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1 }]}>{getStatusLabel(student.status)}</Text>
          </View>
        ))}
      </View>

      {/* Totales */}
      <View style={{ marginTop: 10, padding: 10, backgroundColor: "#f3f4f6" }}>
        <Text>Total: {data.length} estudiante(s) | Horas Totales: {totalHours} | Promedio: {avgGrade > 0 ? avgGrade.toFixed(1) : "-"}</Text>
      </View>
    </PDFLayout>
  );
};
