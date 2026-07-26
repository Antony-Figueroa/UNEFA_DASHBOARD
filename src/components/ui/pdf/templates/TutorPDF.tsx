import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { Tutor, TutorRowData } from "../../../../features/tutors/types";
import { Career } from "../../../../features/careers/types";

interface TutorPDFProps {
  data: Tutor[] | TutorRowData[];
  careers?: Career[];
  periodo?: string;
}

const getCareerName = (id: string, careers?: Career[]) => {
  if (!careers) return id;
  const career = careers.find(c => String(c.careerId) === String(id));
  return career ? career.careerName : id;
};

const formatCI = (prefix: string | undefined, number: string | undefined): string => {
  const p = (prefix || '').replace(/-/g, '');
  const n = (number || '').replace(/-/g, '');
  return `${p}-${n}`.replace(/--/g, '-');
};

export const TutorPDF: React.FC<TutorPDFProps> = ({ data, careers, periodo }) => {
  return (
    <PDFLayout
      title="Reporte de Tutores"
      subtitle="Listado de tutores académicos y metodológicos"
      logoLeftSrc="/logo-tutores.jpeg"
      logoRightSrc="/pdfs-docs/logo.png"
      headerNormalLines={[0, 2, 3]}
    >
      {/* Periodo — solo valor, sin label */}
      {periodo && (
        <Text style={{ fontSize: 10, fontFamily: "Times-Roman", marginBottom: 10, textAlign: "center" }}>
          {periodo}
        </Text>
      )}

      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]} wrap={false}>
          <Text style={[pdfStyles.tableCell, { flex: 0.9, fontSize: 7.5 }]}>CÉDULA</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.8, fontSize: 7.5 }]}>NOMBRE COMPLETO</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.6, fontSize: 7.5 }]}>TÍTULO Y CARRERA</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.3, fontSize: 7.5 }]}>CONDICIÓN</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.3, fontSize: 7.5 }]}>DEDICACIÓN</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.3, fontSize: 7.5 }]}>CATEGORÍA</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.8, fontSize: 7.5 }]}>CONTACTO</Text>
        </View>

        {data.map((tutor, index) => {
          const fullName = `${tutor.firstName} ${tutor.middleName || ""} ${tutor.lastName} ${tutor.secondLastName || ""}`.trim();
          const careersStr = (tutor.carreras || []).map(id => getCareerName(id, careers)).join(" - ");
          return (
          <View key={tutor.tutorId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 0.9, fontSize: 7.5 }]}>
              {formatCI(tutor.identificationPrefix, tutor.identificationNumber)}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.8, fontSize: 7.5 }]}>
              <Text>{fullName}</Text>
              {'\n'}
              <Text style={{ fontSize: 7, color: "#000000" }}>{tutor.sex}</Text>
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.6, fontSize: 7.5 }]}>
              <Text>{tutor.profession}</Text>
              {'\n'}
              <Text style={{ fontSize: 7, color: "#000000" }}>{careersStr}</Text>
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.3, fontSize: 7.5 }]}>
              {tutor.condition}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.3, fontSize: 7.5 }]}>
              {tutor.dedication}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.3, fontSize: 7.5 }]}>
              {tutor.category}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.8, fontSize: 7.5 }]}>
              <Text>{tutor.email}</Text>
              {'\n'}
              <Text style={{ fontSize: 7, color: "#000000" }}>{tutor.phone}</Text>
            </Text>
          </View>
          );
        })}
      </View>
    </PDFLayout>
  );
};
