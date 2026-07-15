import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { InstitutionalResponsible, InstitutionalResponsibleRowData } from "../../../../features/institutions/types";

const formatCI = (prefix?: string, number?: string) =>
  `${(prefix || 'V').replace(/-/g, '')}-${String(number || '').replace(/-/g, '')}`;

const formatName = (item: InstitutionalResponsible | InstitutionalResponsibleRowData) =>
  [item.firstName, item.middleName, item.lastName, item.secondLastName].filter(Boolean).join(' ');

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d instanceof Date ? d.toLocaleDateString("es-VE", { year: "numeric", month: "2-digit", day: "2-digit" }) : "-";
};

interface InstitutionalResponsiblePDFProps {
  data: InstitutionalResponsible[] | InstitutionalResponsibleRowData[];
}

export const InstitutionalResponsiblePDF: React.FC<InstitutionalResponsiblePDFProps> = ({ data }) => {
  return (
    <PDFLayout
      title="Reporte De Responsables Empresariales e Institucionales"
      subtitle="Personal de contacto en las empresas e instituciones aliadas"
    >
      <View style={pdfStyles.table}>
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]} wrap={false}>
          <Text style={[pdfStyles.tableCell, { flex: 1.2, fontSize: 8 }]}>CÉDULA</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2.5, fontSize: 8 }]}>NOMBRES Y APELLIDOS</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>TÍTULO</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>EMPRESA</Text>
          <Text style={[pdfStyles.tableCell, { flex: 2.5, fontSize: 8 }]}>CONTACTO</Text>
          <Text style={[pdfStyles.tableCell, { flex: 1.3, fontSize: 8 }]}>FECHA REG.</Text>
        </View>

        {data.map((responsible, index) => (
          <View key={responsible.responsibleId || index} style={pdfStyles.tableRow} wrap={false}>
            <Text style={[pdfStyles.tableCell, { flex: 1.2, fontSize: 8 }]}>
              {formatCI(responsible.identificationPrefix, responsible.identificationNumber)}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 2.5, fontSize: 8, fontWeight: "bold" }]}>
              {formatName(responsible)}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>
              {responsible.title || "-"}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.5, fontSize: 8 }]}>
              {responsible.institutions?.[0]?.institutionName || "No asignada"}
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 2.5, fontSize: 8 }]}>
              <Text>{responsible.email}</Text>
              {'\n'}
              <Text style={{ fontSize: 7, color: "#000000" }}>{responsible.phone}</Text>
            </Text>
            <Text style={[pdfStyles.tableCell, { flex: 1.3, fontSize: 8 }]}>
              {formatDate(responsible.registrationDate)}
            </Text>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};
