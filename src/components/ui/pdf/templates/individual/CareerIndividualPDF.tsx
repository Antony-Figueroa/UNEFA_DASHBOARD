import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Career, CareerRowData } from "../../../../../features/careers/types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: "Nunito",
    fontSize: 10,
    backgroundColor: "#FFFFFF",
  },
  institutionalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerImages: {
    width: 45,
    height: 45,
    objectFit: "contain",
  },
  institutionalTextContainer: {
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  institutionalText: {
    fontSize: 7,
    fontFamily: "Nunito",
    fontWeight: "bold",
    color: "#000000",
    lineHeight: 1.3,
  },
  titleContainer: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontFamily: "Nunito",
    fontWeight: "bold",
    color: "#21486e",
    textTransform: "uppercase",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
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
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  qrPlaceholder: {
    width: 30,
    height: 30,
    marginRight: 8,
    objectFit: "contain",
  },
  footerText: {
    fontSize: 7,
    color: "#64748B",
    fontFamily: "Nunito",
  },
  pageNumber: {
    textAlign: "right",
    fontSize: 8,
    color: "#64748B",
    fontFamily: "Nunito",
  },
});

interface CareerIndividualPDFProps {
  data: Career | CareerRowData;
}

export const CareerIndividualPDF: React.FC<CareerIndividualPDFProps> = ({ data }) => {
  const career = data;
  const currentDate = new Date().toLocaleDateString("es-VE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
    <Document title={`Ficha de Carrera - ${career.careerName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.institutionalHeader} fixed>
          <Image src="/pdfs-docs/escudo.png" style={styles.headerImages} />
          <View style={styles.institutionalTextContainer}>
            <Text style={styles.institutionalText}>REPÚBLICA BOLIVARIANA DE VENEZUELA</Text>
            <Text style={styles.institutionalText}>MINISTERIO DEL PODER POPULAR PARA LA DEFENSA</Text>
            <Text style={styles.institutionalText}>UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA</Text>
            <Text style={styles.institutionalText}>DE LA FUERZA ARMADA NACIONAL BOLIVARIANA</Text>
            <Text style={styles.institutionalText}>COORDINACIÓN DE PRÁCTICAS PROFESIONALES</Text>
          </View>
          <Image src="/pdfs-docs/logo.png" style={styles.headerImages} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Ficha de Carrera</Text>
          <Text style={styles.subtitle}>Programa Académico</Text>
        </View>

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

        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Image
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://unefa.edu.ve/validar?carrera=${career.careerCode}`}
              style={styles.qrPlaceholder}
            />
            <Text style={styles.footerText}>Documento validado digitalmente{"\n"}Coordinación de Prácticas Profesionales</Text>
          </View>
          <Text style={styles.footerText}>Generado: {currentDate}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default CareerIndividualPDF;
