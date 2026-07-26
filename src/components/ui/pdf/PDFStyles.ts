import { StyleSheet } from "@react-pdf/renderer";

/**
 * Sistema de estilos consistentes para los reportes PDF.
 * Sigue la identidad visual de la aplicación (/UNEFA).
 */
export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 55,
    paddingBottom: 55,
    paddingHorizontal: 50,
    fontSize: 12,
    color: "#000000",
    fontFamily: "Times-Roman",
  },
  // Encabezado Institucional (Membrete)
  institutionalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
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
    fontSize: 8,
    color: "#000000",
    lineHeight: 1.2,
    fontFamily: "Times-Bold",
  },
  institutionalTextNormal: {
    fontSize: 8,
    color: "#000000",
    lineHeight: 1.2,
    fontFamily: "Times-Roman",
  },
  // Título del Reporte
  reportTitleContainer: {
    marginTop: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  reportTitle: {
    fontSize: 12,
    color: "#000000",
    textTransform: "uppercase",
    textAlign: "center",
    fontFamily: "Times-Bold",
  },
  reportSubtitle: {
    fontSize: 12,
    color: "#000000",
    marginTop: 2,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerText: {
    textAlign: "right",
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#000000", // Changed to black
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 100,
  },
  infoValue: {
    flex: 1,
  },
  table: {
    width: "auto",
    marginBottom: 30,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    minHeight: 25,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#F8FAFC",
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 10,
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
    color: "#000000",
    fontSize: 9,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  qrPlaceholder: {
    width: 35,
    height: 35,
    marginRight: 10,
    objectFit: "contain",
  },
  pageNumber: {
    textAlign: "right",
  },
  // Variantes para Badges
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    textAlign: "center",
  },
  badgeText: {
    fontSize: 8,
  },
  badgeSuccess: {
    backgroundColor: "#DCFCE7",
    color: "#000000", // Changed to black
  },
  badgeError: {
    backgroundColor: "#FEE2E2",
    color: "#000000", // Changed to black
  },
  badgeWarning: {
    backgroundColor: "#FEF3C7",
    color: "#000000", // Changed to black
  },
  badgeInfo: {
    backgroundColor: "#E0F2FE",
    color: "#000000", // Changed to black
  },
  badgeSecondary: {
    backgroundColor: "#F1F5F9",
    color: "#000000", // Changed to black
  },
});