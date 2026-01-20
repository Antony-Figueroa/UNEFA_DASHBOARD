import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { InstitutionalResponsible } from "../../../../features/institutions/types";
import { PDFService } from "../../../../services/pdf/PDFService";

interface InstitutionalResponsiblePDFProps {
  data: InstitutionalResponsible[];
}

export const InstitutionalResponsiblePDF: React.FC<InstitutionalResponsiblePDFProps> = ({ data }) => {
  return (
    <PDFLayout
      title="Reporte de Responsables Institucionales"
      subtitle="Personal de contacto en las instituciones aliadas"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
          <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>Cédula</Text>
          <Text style={[pdfStyles.tableCell, { flex: 3 }]}>Nombre Completo</Text>
          <Text style={[pdfStyles.tableCell, { flex: 3 }]}>Institución</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2.5 }]}>Contacto</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.2, textAlign: "center" }]}>Estado</Text>
        </View>

        {data.map((responsible, index) => (
          <View key={responsible.responsibleId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>
              {responsible.identificationPrefix}-{responsible.identificationNumber}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 3, fontWeight: "bold" }]}>
              {`${responsible.firstName} ${responsible.middleName || ""} ${responsible.lastName} ${responsible.secondLastName || ""}`.trim()}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 3 }]}>
              {responsible.institutionName || "No asignada"}
            </Text>
            <View style={[pdfStyles.tableCell, { flex: 2.5 }]}>
              <Text>{responsible.email}</Text>
              <Text style={{ fontSize: 8, color: "#64748B", marginTop: 2 }}>
                {responsible.phone}
              </Text>
            </View>
            <View style={[pdfStyles.tableCell, { flex: 1.2, alignItems: "center" }]}>
              <View style={[pdfStyles.badge, responsible.status ? pdfStyles.badgeSuccess : pdfStyles.badgeError]}>
                <Text style={pdfStyles.badgeText}>{PDFService.formatStatus(responsible.status)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};
