import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { Career, CareerRowData } from "../../../../../features/careers/types";
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
    fontWeight: "bold",
    color: "#1C2434",
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
    fontWeight: "bold",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: "Nunito",
    color: "#1C2434",
  },
  infoValueHighlight: {
    fontSize: 10,
    fontFamily: "Nunito",
    fontWeight: "bold",
    color: "#21486e",
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
    fontWeight: "bold",
  },
  statusTextActive: {
    color: "#166534",
  },
  statusTextInactive: {
    color: "#991B1B",
  },
});

interface CareerIndividualPDFProps {
  data: Career | CareerRowData;
  verificationHash?: string;
}

export const CareerIndividualPDF: React.FC<CareerIndividualPDFProps> = ({ data, verificationHash }) => {
  const career = data;

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

  const statusBoolean = typeof career.status === "boolean" ? career.status : career.status === 1;

  return (
    <PDFLayout
      title="Ficha de Carrera"
      subtitle="Programa Académico"
      verificationHash={verificationHash}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIndicator, { backgroundColor: "#3B82F6" }]} />
          <Text style={styles.sectionTitle}>Información General</Text>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoItemFull}>
            <Text style={styles.infoLabel}>Nombre de la Carrera</Text>
            <Text style={styles.infoValueHighlight}>{career.careerName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Código</Text>
            <Text style={styles.infoValueHighlight}>{career.careerCode}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Abreviatura</Text>
            <Text style={styles.infoValue}>{career.careerAbbreviation}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tipo de Carrera</Text>
            <Text style={styles.infoValue}>{career.careerType === "CORTA" ? "Corta Duración (TSU)" : "Larga Duración (Ing/Lic)"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Nota Mínima Aprobatoria</Text>
            <Text style={styles.infoValue}>{career.minimumGrade} puntos</Text>
          </View>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.infoLabel}>Estado en Sistema</Text>
            <View style={[styles.statusBadge, statusBoolean ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
              <Text style={[styles.statusText, statusBoolean ? styles.statusTextActive : styles.statusTextInactive]}>
                {statusBoolean ? "ACTIVA" : "INACTIVA"}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.infoLabel}>Fecha de Registro</Text>
            <Text style={styles.infoValue}>
              {typeof career.creationDate === "string"
                ? career.creationDate
                : formatDate(career.creationDate)}
            </Text>
          </View>
        </View>
      </View>
    </PDFLayout>
  );
};

export default CareerIndividualPDF;
