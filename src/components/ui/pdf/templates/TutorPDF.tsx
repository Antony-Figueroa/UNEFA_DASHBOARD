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

export const TutorPDF: React.FC<TutorPDFProps> = ({ data, careers }) => {
  return (
    <PDFLayout
      title="Reporte de Tutores"
      subtitle="Listado de tutores académicos y metodológicos"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>Cédula</Text>
          <Text style={[pdfStyles.tableCell, { flex: 3 }]}>Nombre Completo</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2 }]}>Título</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2 }]}>Contacto</Text>
        </View>

        {data.map((tutor, index) => (
          <View key={tutor.tutorId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>
              {tutor.identificationPrefix}-{tutor.identificationNumber}
            </Text>
            <View style={[pdfStyles.tableCell, { flex: 3 }]}>
              <Text style={{ fontWeight: "bold" }}>
                {`${tutor.firstName} ${tutor.middleName || ""} ${tutor.lastName} ${tutor.secondLastName || ""}`.trim()}
              </Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                {tutor.sex}
              </Text>
            </View>
            <View style={[pdfStyles.tableCell, { flex: 2 }]}>
              <Text>{tutor.profession}</Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                {(tutor.carreras || []).map(id => getCareerName(id, careers)).join(" - ")}
              </Text>
            </View>
            <View style={[pdfStyles.tableCell, { flex: 2 }]}>
              <Text>{tutor.email}</Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                {tutor.phone}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};
