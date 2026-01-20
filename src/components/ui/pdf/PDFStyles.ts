import { StyleSheet, Font } from "@react-pdf/renderer";

// Registro de la fuente Nunito
Font.register({
  family: "Nunito",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshRTM.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDFwmRTM.ttf",
      fontWeight: "bold",
    },
  ],
});

/**
 * Sistema de estilos consistentes para los reportes PDF.
 * Sigue la identidad visual de la aplicación (/UNEFA).
 */
export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: "Nunito",
    fontSize: 11,
    color: "#1C2434", // text-primary
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
    fontFamily: "Nunito",
    fontWeight: "bold",
    color: "#000000",
    lineHeight: 1.2,
  },
  // Título del Reporte
  reportTitleContainer: {
    marginTop: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  reportTitle: {
    fontSize: 14,
    fontFamily: "Nunito",
    fontWeight: "bold",
    color: "#21486e",
    textTransform: "capitalize",
    textAlign: "center",
  },
  reportSubtitle: {
    fontSize: 10,
    color: "#64748B",
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
    fontFamily: "Nunito",
    fontWeight: "bold",
    color: "#1C2434",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B", // text-secondary
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontFamily: "Nunito",
    fontWeight: "bold",
    width: 100,
  },
  infoValue: {
    flex: 1,
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
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
    fontFamily: "Nunito",
    fontWeight: "bold",
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 10,
    fontFamily: "Nunito",
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
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Nunito",
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
    fontFamily: "Nunito",
  },
  // Variantes para Badges
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Nunito",
    fontWeight: "bold",
    textAlign: "center",
  },
  badgeText: {
    fontSize: 8,
    fontFamily: "Nunito",
    fontWeight: "bold",
  },
  badgeSuccess: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },
  badgeError: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },
  badgeWarning: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },
  badgeInfo: {
    backgroundColor: "#E0F2FE",
    color: "#075985",
  },
  badgeSecondary: {
    backgroundColor: "#F1F5F9",
    color: "#475569",
  },
});
