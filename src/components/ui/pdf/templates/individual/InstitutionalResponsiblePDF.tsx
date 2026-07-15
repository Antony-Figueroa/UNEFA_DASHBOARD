import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { InstitutionalResponsible, InstitutionalResponsibleRowData } from "../../../../../features/institutions/types";
import PDFLayout from "../../PDFLayout";

const styles = StyleSheet.create({
  section: {
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  sectionIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Nunito",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  infoItemFull: {
    width: "100%",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: "Nunito",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: "Nunito",
    color: "#000000",
  },
  infoValueHighlight: {
    fontSize: 10,
    fontFamily: "Nunito",
    color: "#000000",
  },
  statusContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeActive: {
    backgroundColor: "#DCFCE7",
  },
  statusBadgeInactive: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 9,
    fontFamily: "Nunito",
  },
  statusTextActive: {
    color: "#000000",
  },
  statusTextInactive: {
    color: "#000000",
  },
});

interface InstitutionalResponsiblePDFProps {
  data: InstitutionalResponsible | InstitutionalResponsibleRowData;
  verificationHash?: string;
}

export const InstitutionalResponsiblePDF: React.FC<InstitutionalResponsiblePDFProps> = ({ data, verificationHash }) => {
  const responsible = data;

  const formatDate = (dateStr: string | Date) => {
    try {
      const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
      return date.toLocaleDateString("es-VE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <PDFLayout
      title="Ficha de Responsable Institucional"
      subtitle="Enlace con Institución"
      verificationHash={verificationHash}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIndicator, { backgroundColor: "#3B82F6" }]} />
          <Text style={styles.sectionTitle}>Información Personal</Text>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Cédula de Identidad</Text>
            <Text style={styles.infoValueHighlight}>
              {responsible.identificationPrefix}-{responsible.identificationNumber}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Primer Nombre</Text>
            <Text style={styles.infoValue}>{responsible.firstName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Segundo Nombre</Text>
            <Text style={styles.infoValue}>{responsible.middleName || "-"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Primer Apellido</Text>
            <Text style={styles.infoValue}>{responsible.lastName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Segundo Apellido</Text>
            <Text style={styles.infoValue}>{responsible.secondLastName || "-"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{responsible.phone}</Text>
          </View>
          <View style={styles.infoItemFull}>
            <Text style={styles.infoLabel}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>{responsible.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIndicator, { backgroundColor: "#10B981" }]} />
          <Text style={styles.sectionTitle}>Institución Asignada</Text>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoItemFull}>
            <Text style={styles.infoLabel}>Institución</Text>
            <Text style={styles.infoValueHighlight}>{responsible.institutions?.[0]?.institutionName || "No asignada"}</Text>
          </View>
          {responsible.title && (
            <View style={styles.infoItemFull}>
              <Text style={styles.infoLabel}>Título</Text>
              <Text style={styles.infoValue}>{responsible.title}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.infoLabel}>Estado en Sistema</Text>
            <View style={[styles.statusBadge, responsible.status ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
              <Text style={[styles.statusText, responsible.status ? styles.statusTextActive : styles.statusTextInactive]}>
                {responsible.status ? "ACTIVO" : "INACTIVO"}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.infoLabel}>Fecha de Registro</Text>
            <Text style={styles.infoValue}>
              {typeof responsible.registrationDate === "string"
                ? responsible.registrationDate
                : formatDate(responsible.registrationDate)}
            </Text>
          </View>
        </View>
      </View>
    </PDFLayout>
  );
};

export default InstitutionalResponsiblePDF;
