import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { Tutor, TutorRowData } from "../../../../../features/tutors/types";

interface TutorCertificatePDFProps {
  data: Tutor | TutorRowData;
  decanaName?: string;
  decanaTitle?: string;
  academicHours?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 60,
    fontFamily: "Nunito",
    fontSize: 11,
    backgroundColor: "#FFFFFF",
    lineHeight: 1.5,
  },
  institutionalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    // Eliminada la línea de separación
  },
  headerImages: {
    width: 65,
    height: 65,
    objectFit: "contain",
  },
  institutionalTextContainer: {
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  institutionalText: {
    fontSize: 7.5,
    fontFamily: "Nunito",
    fontWeight: "bold",
    color: "#000000",
    lineHeight: 1.2,
  },
  titleContainer: {
    marginTop: 20,
    marginBottom: 25,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Nunito",
    fontWeight: "bold",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 2,
    textAlign: "center",
    textDecoration: "none",
  },
  body: {
    marginTop: 10,
    textAlign: "justify",
    color: "#1A202C",
    fontSize: 11,
    textIndent: 35,
  },
  bold: {
    fontWeight: "bold",
    color: "#000000",
  },
  footer: {
    marginTop: 60,
    alignItems: "center",
  },
  signatureLine: {
    width: 220,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginBottom: 8,
  },
  signerTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  signerSubtitle: {
    fontSize: 8,
    textAlign: "center",
    color: "#4A5568",
    marginTop: 2,
  },
  watermark: {
    position: "absolute",
    top: "30%",
    left: "15%",
    width: "70%",
    height: "auto",
    opacity: 0.04,
    zIndex: -1,
  }
});

export const TutorCertificatePDF: React.FC<TutorCertificatePDFProps> = ({
  data,
  decanaName = "MARBELYS DEL VALLE RIVERO",
  decanaTitle = "DECANA",
  academicHours = "480",
  period = "2-2022",
  startDate = "26/09/2022",
  endDate = "13/02/2023",
}) => {
  const tutor = data;
  const fullName = `${tutor.firstName} ${tutor.middleName || ""} ${tutor.lastName} ${tutor.secondLastName || ""}`.trim().toUpperCase();

  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleString("es-VE", { month: "long" }).toUpperCase();
  const year = today.getFullYear();

  return (
    <Document title={`CONSTANCIA TUTOR - ${tutor.identificationNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Marca de Agua */}
        <Image src="/pdfs-docs/logo.png" style={styles.watermark} />

        {/* Encabezado Institucional */}
        <View style={styles.institutionalHeader}>
          <Image src="/pdfs-docs/escudo.png" style={styles.headerImages} />
          <View style={styles.institutionalTextContainer}>
            <Text style={styles.institutionalText}>REPÚBLICA BOLIVARIANA DE VENEZUELA</Text>
            <Text style={styles.institutionalText}>MINISTERIO DEL PODER POPULAR PARA LA DEFENSA</Text>
            <Text style={styles.institutionalText}>UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA</Text>
            <Text style={styles.institutionalText}>DE LA FUERZA ARMADA NACIONAL BOLIVARIANA</Text>
            <Text style={styles.institutionalText}>VICERRECTORADO REGIÓN LOS LLANOS</Text>
            <Text style={styles.institutionalText}>NÚCLEO PORTUGUESA - EXTENSIÓN ACARIGUA</Text>
          </View>
          <Image src="/pdfs-docs/logo.png" style={styles.headerImages} />
        </View>

        {/* Título */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>CONSTANCIA</Text>
        </View>

        {/* Cuerpo de la Constancia */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.body}>
            Quien suscribe, <Text style={styles.bold}>{decanaName}</Text>, {decanaTitle} del Núcleo Portuguesa de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana (UNEFA), hace constar por medio de la presente, que el (la) ciudadano (a) <Text style={styles.bold}>{fullName}</Text>, titular de la Cédula de Identidad N° {tutor.identificationPrefix}-{tutor.identificationNumber}, <Text style={styles.bold}>{tutor.profession.toUpperCase()}</Text>, <Text style={styles.bold}>{tutor.condition.toUpperCase()}</Text>, a tiempo, <Text style={styles.bold}>{tutor.dedication.toUpperCase()}</Text>, se desempeñó como Tutor Académico de la asignatura Pasantía, cumpliendo un total de <Text style={styles.bold}>{academicHours} horas académicas</Text> efectuadas en el periodo académico <Text style={styles.bold}>{period}</Text>, comprendido entre las fechas <Text style={styles.bold}>{startDate}</Text> y <Text style={styles.bold}>{endDate}</Text>.
          </Text>

          <Text style={[styles.body, { marginTop: 30 }]}>
            Constancia que se expide a petición de parte interesada, en Guanare, a los {day} días del mes de {month.toLowerCase()} de {year}.
          </Text>
        </View>

        {/* Firmas */}
        <View style={styles.footer}>
          <View style={styles.signatureLine} />
          <Text style={styles.signerTitle}>MSc. {decanaName}</Text>
          <Text style={[styles.signerTitle, { fontWeight: "normal" }]}>{decanaTitle}</Text>
          <Text style={styles.signerSubtitle}>Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TutorCertificatePDF;
