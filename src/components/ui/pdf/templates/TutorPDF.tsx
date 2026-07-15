import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { Tutor, TutorRowData } from "../../../../features/tutors/types";
import { Career } from "../../../../features/careers/types";

interface TutorPDFProps {
  data: Tutor[] | TutorRowData[];
  careers?: Career[];
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

export const TutorPDF: React.FC<TutorPDFProps> = ({ data, careers }) => {
  return (
    <PDFLayout
      title="Reporte de Tutores"
      subtitle="Listado de tutores académicos y metodológicos"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]} wrap={false}>
          <Text style={[pdfStyles.tableCell, { flex: 1.2, fontSize: 8 }]}>CÉDULA</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2, fontSize: 8 }]}>NOMBRE COMPLETO</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2, fontSize: 8 }]}>TÍTULO Y CARRERA</Text>
          <Text style={[pdfStyles.tableCell, { flex: 3, fontSize: 8 }]}>CONTACTO</Text>
        </View>

        {data.map((tutor, index) => {
          const fullName = `${tutor.firstName} ${tutor.middleName || ""} ${tutor.lastName} ${tutor.secondLastName || ""}`.trim();
          const careersStr = (tutor.carreras || []).map(id => getCareerName(id, careers)).join(" - ");
          return (
          <View key={tutor.tutorId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 1.2, fontSize: 8 }]}>
              {formatCI(tutor.identificationPrefix, tutor.identificationNumber)}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 2, fontSize: 8 }]}>
              <Text style={{ fontWeight: "bold" }}>{fullName}</Text>
              {'\n'}
              <Text style={{ fontSize: 7, color: "#000000" }}>{tutor.sex}</Text>
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 2, fontSize: 8 }]}>
              <Text>{tutor.profession}</Text>
              {'\n'}
              <Text style={{ fontSize: 7, color: "#000000" }}>{careersStr}</Text>
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 3, fontSize: 8 }]}>
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
