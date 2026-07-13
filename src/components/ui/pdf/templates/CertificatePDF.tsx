import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { CulminationRecord } from '../../../../features/culmination/services/culminationService';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  unefaText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
    textDecoration: 'underline',
  },
  content: {
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 150,
    color: '#4a5568',
  },
  value: {
    fontSize: 12,
    color: '#2d3748',
    flex: 1,
  },
  paragraph: {
    marginBottom: 15,
  },
  paragraphLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: 5,
  },
  paragraphText: {
    fontSize: 11,
    color: '#2d3748',
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#718096',
    marginBottom: 5,
  },
  signature: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 50,
  },
  signatureBox: {
    width: 150,
    textAlign: 'center',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e0',
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
    color: '#4a5568',
  },
  seal: {
    position: 'absolute',
    bottom: 80,
    right: 50,
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#c53030',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  sealText: {
    fontSize: 8,
    color: '#c53030',
    textAlign: 'center',
  },
  certificateNumber: {
    position: 'absolute',
    top: 30,
    right: 50,
    fontSize: 8,
    color: '#a0aec0',
  },
});

interface CertificatePDFProps {
  data: CulminationRecord;
  certificateNumber: string;
  issueDate: string;
}

export function CertificatePDF({ data, certificateNumber, issueDate }: CertificatePDFProps) {
  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.unefaText}>UNIVERSIDAD NACIONAL EXPERIMENTAL</Text>
          <Text style={styles.unefaText}>DE LA FUERZA ARMADA</Text>
          <Text style={styles.subtitle}>NÚCLEO CARABOBO</Text>
          <Text style={styles.subtitle}>COORDINACIÓN DE PRÁCTICAS PROFESIONALES</Text>
        </View>

        <Text style={styles.title}>CERTIFICADO DE PRÁCTICAS PROFESIONALES</Text>

        <Text style={styles.certificateNumber}>N° {certificateNumber}</Text>

        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre del Bachiller:</Text>
            <Text style={styles.value}>{data.studentName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Cédula de Identidad:</Text>
            <Text style={styles.value}>{data.studentCi}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Carrera:</Text>
            <Text style={styles.value}>{data.careerName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Institución:</Text>
            <Text style={styles.value}>{data.institutionName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Período Académico:</Text>
            <Text style={styles.value}>{data.period}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Horas Cumplidas:</Text>
            <Text style={styles.value}>{data.totalHours} horas</Text>
          </View>

          <View style={styles.paragraph}>
            <Text style={styles.paragraphLabel}>OBSERVACIONES:</Text>
            <Text style={styles.paragraphText}>
              El presente certificado se emite a petición del interesado, certificando que el(la) bachiller{' '}
              {data.studentName}, portador(a) de la cédula de identidad V-{data.studentCi.replace('V-', '')}, 
              ha completado {data.totalHours} horas de prácticas profesionales en la institución {data.institutionName}, 
              durante el período académico {data.period}, cumpliendo con todos los requisitos establecidos por la 
              Universidad Nacional Experimental de la Fuerza Armada (UNEFA).
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Este certificado tiene carácter oficial y fue expedido el {issueDate}
          </Text>
          <Text style={styles.footerText}>
            Sistema de Gestión de Prácticas Profesionales - UNEFA
          </Text>
        </View>

        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Coordinador de Prácticas</Text>
            <Text style={styles.signatureText}>UNEFA Núcleo Carabobo</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Tutor Académico</Text>
            <Text style={styles.signatureText}>Carrera de {data.careerName}</Text>
          </View>
        </View>

        <View style={styles.seal}>
          <Text style={styles.sealText}>UNEFA</Text>
          <Text style={styles.sealText}>CARABOBO</Text>
          <Text style={styles.sealText}>OFICIAL</Text>
        </View>
      </Page>
    </Document>
  );
}

export const generateCertificatePDF = async (data: CulminationRecord, certificateNumber: string) => {
  const issueDate = new Date().toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const blob = await pdf(<CertificatePDF data={data} certificateNumber={certificateNumber} issueDate={issueDate} />).toBlob();
  return blob;
};

export default CertificatePDF;
