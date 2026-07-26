import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { Tutor, TutorRowData } from "../../../../../features/tutors/types";
import PDFLayout from "../../PDFLayout";

interface TutorInstitucionalData {
  nombre: string;
  apellido: string;
  ci: string;
  cargo: string;
  telefono: string;
  correo: string;
}

interface TutorIndividualPDFProps {
  data: Tutor | TutorRowData;
  verificationHash?: string;
  /** Periodo académico (ej: "1-2016") */
  periodo?: string;
  /** Observaciones (opcional) */
  observaciones?: string;
  /** RIF del tutor con o sin guiones (ej: "V123456789") */
  rif?: string;
  /** Datos del tutor institucional */
  tutorInstitucional?: TutorInstitucionalData;
}

/**
 * Formatea RIF como X-XXXXXXXX-X
 */
const formatRif = (rif: string): string => {
  if (!rif) return "";
  const clean = rif.replace(/[\s\-]/g, "");
  if (rif.includes("-")) return rif;
  if (clean.length >= 2) {
    const letter = clean.charAt(0).toUpperCase();
    const numbers = clean.slice(1);
    if (numbers.length >= 9) {
      return `${letter}-${numbers.slice(0, 8)}-${numbers.slice(8, 9)}`;
    }
  }
  return rif;
};

const styles = StyleSheet.create({
  // ── Secciones ──
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  sectionIndicator: {
    width: 5,
    height: 5,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 10,
    color: "#000000",
    textTransform: "uppercase",
  },

  // ── Grid de datos ──
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  infoItemFull: {
    width: "100%",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: "#000000",
    textTransform: "uppercase",
    marginBottom: 1,
  },
  infoLabelUnderlined: {
    fontSize: 8,
    color: "#000000",
    textTransform: "uppercase",
    marginBottom: 1,
    textDecoration: "underline",
  },
  infoValue: {
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#000000",
  },
  infoValueHighlight: {
    fontSize: 10,
    color: "#000000",
  },

  // ── Periodo (bold + red) ──
  periodoRow: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  periodoLabel: {
    fontSize: 10,
    color: "#000000",
  },
  periodoValue: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: "#CC0000",
  },

  // ── Observaciones (caja amarilla) ──
  observacionesBox: {
    marginTop: 8,
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#FEF9C3",
    borderWidth: 1,
    borderColor: "#FDE047",
    minHeight: 50,
  },
  observacionesTitle: {
    fontSize: 8,
    color: "#000000",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  observacionesText: {
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#000000",
  },

  // ── RIF ──
  rifValue: {
    fontSize: 10,
    color: "#000000",
  },

  // ── Tutor Institucional ──
  tutorInstSection: {
    marginTop: 8,
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tutorInstTitle: {
    fontSize: 9,
    color: "#000000",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  tutorInstText: {
    fontSize: 9,
    fontFamily: "Times-Roman",
    color: "#000000",
    marginBottom: 2,
  },

  // ── Estado ──
  statusContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 8,
  },
});

export const TutorIndividualPDF: React.FC<TutorIndividualPDFProps> = ({
  data,
  verificationHash,
  periodo,
  observaciones,
  rif,
  tutorInstitucional,
}) => {
  const tutor = data;
  const formattedRif = rif ? formatRif(rif) : "";
  const fullName = `${tutor.firstName} ${tutor.middleName || ""} ${tutor.lastName} ${tutor.secondLastName || ""}`.replace(/\s+/g, " ").trim();

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
      logoLeftSrc="/pdfs-docs/logo.png"
      logoRightSrc="/logo-tutores.jpeg"
      headerNormalLines={[0, 2, 3, 4, 5, 6]}
    >
      {/* Periodo Académico (bold + red) */}
      {periodo && (
        <View style={styles.periodoRow}>
          <Text style={styles.periodoLabel}>PERIODO ACADÉMICO: </Text>
          <Text style={styles.periodoValue}>{periodo}</Text>
        </View>
      )}

      {/* Nombre del Tutor Académico (label underlined, value normal) */}
      <View style={[styles.infoItemFull, { marginBottom: 8 }]}>
        <Text style={styles.infoLabelUnderlined}>Nombre del Tutor Académico</Text>
        <Text style={styles.infoValueHighlight}>{fullName.toUpperCase()}</Text>
      </View>

      {/* Información Personal */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIndicator, { backgroundColor: "#000000" }]} />
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
            <Text style={styles.infoValue}>{tutor.firstName.toUpperCase()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Segundo Nombre</Text>
            <Text style={styles.infoValue}>{(tutor.middleName || "-").toUpperCase()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Primer Apellido</Text>
            <Text style={styles.infoValue}>{tutor.lastName.toUpperCase()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Segundo Apellido</Text>
            <Text style={styles.infoValue}>{(tutor.secondLastName || "-").toUpperCase()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Sexo</Text>
            <Text style={styles.infoValue}>{tutor.sex.toUpperCase()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{tutor.phone}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>{tutor.email.toLowerCase()}</Text>
          </View>
          {formattedRif && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>RIF</Text>
              <Text style={styles.rifValue}>{formattedRif}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Datos Profesionales */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIndicator, { backgroundColor: "#000000" }]} />
          <Text style={styles.sectionTitle}>Datos Profesionales</Text>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Título</Text>
            <Text style={styles.infoValue}>{tutor.profession.toUpperCase()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Grado de Instrucción</Text>
            <Text style={styles.infoValue}>{tutor.titulo.toUpperCase()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Condición</Text>
            <Text style={styles.infoValue}>{tutor.condition.toUpperCase()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Dedicación</Text>
            <Text style={styles.infoValue}>{tutor.dedication.toUpperCase()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Categoría</Text>
            <Text style={styles.infoValue}>{tutor.category.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Tutor Institucional */}
      {tutorInstitucional && (tutorInstitucional.nombre || tutorInstitucional.cargo) && (
        <View style={styles.tutorInstSection}>
          <Text style={styles.tutorInstTitle}>Tutor(a) Institucional</Text>
          <Text style={[styles.tutorInstText, { fontFamily: "Times-Bold" }]}>
            {[tutorInstitucional.nombre, tutorInstitucional.apellido].filter(Boolean).join(" ").toUpperCase()}
          </Text>
          {tutorInstitucional.cargo && (
            <Text style={styles.tutorInstText}>
              Cargo: {tutorInstitucional.cargo.toUpperCase()}
            </Text>
          )}
          {tutorInstitucional.telefono && (
            <Text style={styles.tutorInstText}>TELÉFONO: {tutorInstitucional.telefono}</Text>
          )}
          {tutorInstitucional.correo && (
            <Text style={styles.tutorInstText}>CORREO: {tutorInstitucional.correo.toLowerCase()}</Text>
          )}
        </View>
      )}

      {/* Observaciones (caja amarilla) */}
      <View style={styles.observacionesBox}>
        <Text style={styles.observacionesTitle}>Observaciones</Text>
        <Text style={styles.observacionesText}>
          {observaciones || ""}
        </Text>
      </View>

      {/* Estado */}
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.infoLabel}>Estado en Sistema</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: tutor.status ? "#DCFCE7" : "#FEE2E2" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: "#000000" },
                ]}
              >
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
