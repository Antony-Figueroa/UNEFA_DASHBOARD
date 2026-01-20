import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { Tutor } from "../../../../features/tutors/types";
import { PDFService } from "../../../../services/pdf/PDFService";

interface TutorPDFProps {
  data: Tutor[];
}

export const TutorPDF: React.FC<TutorPDFProps> = ({ data }) => {
  return (
    <PDFLayout
      title="Reporte de Tutores"
      subtitle="Listado de tutores académicos y metodológicos"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>Cédula</Text>
          <Text style={[pdfStyles.tableCell, { flex: 3 }]}>Nombre Completo</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2 }]}>Profesión / Categoría</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2 }]}>Correo / Teléfono</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.2, textAlign: "center" }]}>Estado</Text>
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
                {tutor.category} - {tutor.dedication}
              </Text>
            </View>
            <View style={[pdfStyles.tableCell, { flex: 2 }]}>
              <Text>{tutor.email}</Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                {tutor.phone}
              </Text>
            </View>
            <View style={[pdfStyles.tableCell, { flex: 1.2, alignItems: "center" }]}>
              <View style={[pdfStyles.badge, tutor.status ? pdfStyles.badgeSuccess : pdfStyles.badgeError]}>
                <Text style={pdfStyles.badgeText}>{PDFService.formatStatus(tutor.status)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};
