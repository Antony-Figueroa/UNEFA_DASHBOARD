import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { Tutor, TutorRowData } from "../../../../../features/tutors/types";
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

interface TutorIndividualPDFProps {
  data: Tutor | TutorRowData;
  verificationHash?: string;
}

export const TutorIndividualPDF: React.FC<TutorIndividualPDFProps> = ({ data, verificationHash }) => {
  const tutor = data;

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
      title="Ficha de Tutor Académico"
      subtitle="Prácticas Profesionales"
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
              {tutor.identificationPrefix}-{tutor.identificationNumber}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Primer Nombre</Text>
            <Text style={styles.infoValue}>{tutor.firstName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Segundo Nombre</Text>
            <Text style={styles.infoValue}>{tutor.middleName || "-"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Primer Apellido</Text>
            <Text style={styles.infoValue}>{tutor.lastName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Segundo Apellido</Text>
            <Text style={styles.infoValue}>{tutor.secondLastName || "-"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Sexo</Text>
            <Text style={styles.infoValue}>{tutor.sex}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{tutor.phone}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>{tutor.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIndicator, { backgroundColor: "#10B981" }]} />
          <Text style={styles.sectionTitle}>Datos Académicos</Text>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Título</Text>
            <Text style={styles.infoValue}>{tutor.profession}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Grado de Instrucción</Text>
            <Text style={styles.infoValue}>{tutor.titulo}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Condición</Text>
            <Text style={styles.infoValue}>{tutor.condition}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Dedicación</Text>
            <Text style={styles.infoValue}>{tutor.dedication}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Categoría</Text>
            <Text style={styles.infoValue}>{tutor.category}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.infoLabel}>Estado en Sistema</Text>
            <View style={[styles.statusBadge, tutor.status ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
              <Text style={[styles.statusText, tutor.status ? styles.statusTextActive : styles.statusTextInactive]}>
                {tutor.status ? "ACTIVO" : "INACTIVO"}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.infoLabel}>Fecha de Registro</Text>
            <Text style={styles.infoValue}>
              {typeof tutor.registrationDate === "string"
                ? tutor.registrationDate
                : formatDate(tutor.registrationDate)}
            </Text>
          </View>
        </View>
      </View>
    </PDFLayout>
  );
};

export default TutorIndividualPDF;
