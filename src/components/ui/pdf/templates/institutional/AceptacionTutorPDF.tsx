import { Text, View, StyleSheet, Document, Page, Image } from '@react-pdf/renderer';
import { formatNombreCompleto, formatFecha, getFechaParts, parseCI } from '@/features/reports/utils/reportFormatters';

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 45,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#000000',
  },
  // Encabezado Institucional con Logos
  institutionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  headerImages: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  institutionalTextContainer: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 15,
    paddingTop: 3,
  },
  institutionalText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 1.3,
    marginBottom: 0.5,
  },
  title: { 
    textAlign: 'center', 
    fontSize: 13, 
    fontWeight: 'bold', 
    marginBottom: 20,
    textDecoration: 'underline',
  },
  paragraph: { 
    marginBottom: 10, 
    textAlign: 'justify', 
    fontSize: 11, 
    lineHeight: 1.4,
  },
  textRed: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  dateSection: { 
    marginBottom: 30, 
    fontSize: 11,
  },
  firmaContainer: { 
    marginTop: 60, 
    alignItems: 'center',
  },
  firmaLine: { 
    width: 180, 
    borderBottomWidth: 1, 
    borderBottomColor: '#000000', 
    marginBottom: 5,
  },
  firmaLabel: { 
    marginBottom: 3, 
    fontSize: 10,
  },
  firmaNombre: { 
    fontWeight: 'bold', 
    fontSize: 11,
    marginBottom: 2,
    color: '#dc2626',
  },
  firmaData: { 
    fontSize: 11,
    marginBottom: 2,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 45,
    right: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  qrCode: {
    width: 50,
    height: 50,
  },
  validationText: {
    fontSize: 9,
    color: '#4a5568',
    textAlign: 'center',
  },
  pageNumber: {
    fontSize: 9,
    color: '#4a5568',
    textAlign: 'right',
  },
});

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
    tutor: {
      ci: string; titulo: string | null; primerNombre: string; segundoNombre?: string;
      primerApellido: string; segundoApellido?: string; telefono: string;
    } | null;
  };
  textos: Record<string, string>;
}

const getTutorTitle = (titulo: string | null): string => {
  if (!titulo) return 'Maestr';
  const lowerTitulo = titulo.toLowerCase();
  if (lowerTitulo.includes('ingeniero') || lowerTitulo.includes('ingeniera')) return 'Ing';
  if (lowerTitulo.includes('licenciado') || lowerTitulo.includes('licenciada')) return 'Lic';
  if (lowerTitulo.includes('maestro') || lowerTitulo.includes('maestra')) return 'Maestr';
  if (lowerTitulo.includes('doctor') || lowerTitulo.includes('doctora')) return 'Dr';
  return 'Maestr';
};

const formatCIForDocument = (ci: string): string => {
  const { prefix, number } = parseCI(ci);
  return `${prefix}-${number}`;
};

export function AceptacionTutorPDF({ data }: Props) {
  const fechaHoy = getFechaParts(null);
  
  const tutorTitle = data.tutor ? getTutorTitle(data.tutor.titulo) : 'Maestr';
  const tutorName = data.tutor ? formatNombreCompleto(data.tutor) : '';
  const tutorCI = data.tutor ? formatCIForDocument(data.tutor.ci) : '';
  const tutorTelefono = data.tutor?.telefono || '';
  
  const estudianteNombre = formatNombreCompleto(data.estudiante);
  const estudianteCI = formatCIForDocument(data.estudiante.ci);
  const carreraNombre = data.carrera.nombre;

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Document title="ACEPTACIÓN DEL TUTOR ACADÉMICO">
      <Page size="A4" style={styles.page}>
        {/* Encabezado Institucional con Logos */}
        <View style={styles.institutionalHeader}>
          <Image 
            src="/pdfs-docs/escudo.png" 
            style={styles.headerImages} 
          />
          <View style={styles.institutionalTextContainer}>
            <Text style={styles.institutionalText}>REPÚBLICA BOLIVARIANA DE VENEZUELA</Text>
            <Text style={styles.institutionalText}>MINISTERIO DEL PODER POPULAR PARA LA DEFENSA</Text>
            <Text style={styles.institutionalText}>UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA</Text>
            <Text style={styles.institutionalText}>DE LA FUERZA ARMADA NACIONAL BOLIVARIANA</Text>
            <Text style={styles.institutionalText}>VICERRECTORADO REGIÓN LOS LLANOS</Text>
            <Text style={styles.institutionalText}>NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA</Text>
            <Text style={styles.institutionalText}>COORDINACIÓN DE PRÁCTICAS PROFESIONALES</Text>
          </View>
          <Image 
            src="/pdfs-docs/logo.png" 
            style={styles.headerImages} 
          />
        </View>
        
        <Text style={styles.title}>ACEPTACIÓN DEL TUTOR ACADÉMICO</Text>
        
        <Text style={styles.paragraph}>
          Yo, <Text style={styles.textRed}>{tutorTitle}. {tutorName}</Text>, titular de la cédula de identidad <Text style={styles.textRed}>{tutorCI}</Text>, hago constar por medio de la presente que acepto la tutoría académica de la práctica profesional por parte de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional (UNEFA) del (la) bachiller <Text style={styles.textRed}>{estudianteNombre}</Text>, titular de la cédula de identidad <Text style={styles.textRed}>{estudianteCI}</Text> para optar al grado de <Text style={styles.textRed}>{carreraNombre}</Text>.
        </Text>
        
        <Text style={styles.paragraph}>
          Acepto asesorar al participante en calidad de tutor académico, durante la etapa de desarrollo del informe de pasantía.
        </Text>
        
        <Text style={styles.dateSection}>
          En Guanare, a los {fechaHoy.dia} días del mes de {fechaHoy.mes} del {fechaHoy.anio}.
        </Text>
        
        <View style={styles.firmaContainer}>
          <Text style={styles.firmaLabel}>Nombres y Apellidos</Text>
          <View style={styles.firmaLine} />
          <Text style={styles.firmaNombre}>{tutorTitle}. {tutorName}</Text>
          <Text style={styles.firmaData}>C.I.: {tutorCI}</Text>
          <Text style={styles.firmaData}>Teléfono: {tutorTelefono}</Text>
        </View>
        
        {/* Footer */}
        <View style={styles.footerContainer}>
          <Image 
            src="/pdfs-docs/qr.png" 
            style={styles.qrCode} 
          />
          <View style={{ flex: 1, marginHorizontal: 20 }}>
            <Text style={styles.validationText}>Generado el {formattedDate}.</Text>
            <Text style={styles.validationText}>Documento validado digitalmente por la Coordinación de Prácticas Profesionales</Text>
          </View>
          <Text style={styles.pageNumber}>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
}
