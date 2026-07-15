import { Text, View, StyleSheet, Document, Page, Image } from '@react-pdf/renderer';
import { formatNombreCompleto, formatFecha, getFechaParts, formatCI } from '@/features/reports/utils/reportFormatters';

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 50,
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
  placeDate: { 
    marginBottom: 15, 
    fontSize: 11, 
    textAlign: 'right',
    fontWeight: 'normal',
  },
  leftSection: {
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  destinatario: { 
    marginBottom: 2, 
    fontWeight: 'bold', 
    fontSize: 11,
  },
  destinatarioRed: {
    marginBottom: 2, 
    fontWeight: 'bold', 
    fontSize: 11,
    color: '#000000',
  },
  paragraph: { 
    marginBottom: 10, 
    textAlign: 'justify', 
    fontSize: 11, 
    lineHeight: 1.4,
  },
  textRed: {
    color: '#000000',
    fontWeight: 'bold',
  },
  firmaContainer: { 
    marginTop: 30, 
    alignItems: 'flex-start',
  },
  atentamente: {
    marginBottom: 20,
    fontSize: 11,
  },
  firmaNombre: { 
    fontWeight: 'bold', 
    fontSize: 11,
    marginBottom: 2,
  },
  firmaCargo: { 
    fontSize: 11,
    marginBottom: 2,
  },
  firmaOrden: { 
    fontSize: 10, 
    color: '#000000',
  },
  centeredContainer: {
    marginTop: 30,
    alignItems: 'center',
    textAlign: 'center',
  },
  centeredParagraph: { 
    marginBottom: 10, 
    textAlign: 'center', 
    fontSize: 11, 
    lineHeight: 1.4,
  },
  centeredAtentamente: {
    marginBottom: 20,
    fontSize: 11,
    textAlign: 'center',
  },
  centeredFirmaNombre: { 
    fontWeight: 'bold', 
    fontSize: 11,
    marginBottom: 2,
    textAlign: 'center',
  },
  centeredFirmaCargo: { 
    fontSize: 11,
    marginBottom: 2,
    textAlign: 'center',
  },
  centeredFirmaOrden: { 
    fontSize: 10, 
    color: '#000000',
    textAlign: 'center',
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
    institucion: { nombre: string } | null;
    periodo: { description: string; startDate: string; endDate: string } | null;
  };
  textos: Record<string, string>;
  verificationHash?: string;
  qrCodeDataUri?: string;
}

export function SolicitudInstitucionPDF({ data, textos, verificationHash, qrCodeDataUri }: Props) {
  const fechaHoy = getFechaParts(null);

  const estudianteNombre = formatNombreCompleto(data.estudiante);
  const estudianteCI = formatCI(data.estudiante.ci);
  const carreraNombre = data.carrera.nombre;
  const lapsoInicio = data.periodo ? formatFecha(data.periodo.startDate) : '________________________';
  const lapsoFin = data.periodo ? formatFecha(data.periodo.endDate) : '________________________';

  const firmaNombre = textos.firmaNombre || 'MSc. Marbelys del Valle Rivero';
  const firmaCargo = textos.firmaCargo || 'Decana del Núcleo Portuguesa';
  const firmaOrden = textos.firmaOrden || textos.orden || 'Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022';

  return (
    <Document title="SOLICITUD DE INSTITUCIÓN">
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
          </View>
          <Image 
            src="/pdfs-docs/logo.png" 
            style={styles.headerImages} 
          />
        </View>
        
        {/* Fecha alineada a la derecha */}
        <Text style={styles.placeDate}>Guanare, {fechaHoy.dia} de {fechaHoy.mes} del {fechaHoy.anio}</Text>
        
        {/* Sección izquierda: Señores, Institución, Presente */}
        <View style={styles.leftSection}>
          <Text style={styles.destinatario}>Señores:</Text>
          <Text style={styles.destinatarioRed}>{data.institucion?.nombre || '________________________'}</Text>
          <Text style={styles.destinatario}>Presente</Text>
        </View>
        
        {/* Sección derecha: Atte y Cargo */}
        <View style={styles.rightSection}>
          <Text style={styles.destinatario}>Atte: {textos.destinatario || 'MSc. Marbelys del Valle Rivero'}</Text>
          <Text style={styles.destinatario}>{textos.cargo || 'Decana del Núcleo Portuguesa'}</Text>
        </View>
        
        {/* Cuerpo del texto */}
        <Text style={styles.paragraph}>
          Tengo el agrado de dirigirme a usted, en la oportunidad de presentarle a el Bachiller <Text style={styles.textRed}>{estudianteNombre}</Text>, titular de la cédula de identidad <Text style={styles.textRed}>({estudianteCI})</Text>, estudiante de la carrera <Text style={styles.textRed}>{carreraNombre}</Text>, el mencionado Bachiller está autorizado para realizar trámites en la Organización que usted representa, relacionados con la posibilidad de desarrollar en su práctica profesional un proyecto con un mínimo de 480 horas laborales, comprendidas desde <Text style={styles.textRed}>{lapsoInicio}</Text> hasta <Text style={styles.textRed}>{lapsoFin}</Text>.
        </Text>
        
        <Text style={styles.paragraph}>
          Es necesario señalar que, el estudiante que obtenga de usted la autorización para realizar la práctica profesional, reciba de la organización la carta de aceptación, plan de trabajo, resumen curricular del tutor institucional, los recursos y el asesoramiento requerido para el cumplimiento de las actividades asignadas. Así mismo, es importante destacar que la Organización se compromete a entregar la evaluación realizada por el tutor institucional y el certificado de culminación el último día de las prácticas.
        </Text>
        
        <Text style={styles.paragraph}>
          Por otra parte, el bachiller será supervisado durante dos (2) oportunidades por un docente, debidamente autorizado por la UNEFA, Anexo a esta carta, se facilita el perfil del egresado del estudiante.
        </Text>
        
        <Text style={styles.centeredParagraph}>
          Agradeciendo la atención sobre este particular, quedo de usted.
        </Text>
        
        <Text style={styles.centeredAtentamente}>Atentamente,</Text>
        
        <View style={styles.centeredContainer}>
          <Text style={styles.centeredFirmaNombre}>{firmaNombre}</Text>
          <Text style={styles.centeredFirmaCargo}>{firmaCargo}</Text>
          <Text style={styles.centeredFirmaOrden}>{firmaOrden}</Text>
        </View>
        
        {/* Footer */}
        <View style={styles.footerContainer}>
          {qrCodeDataUri && (
            <Image 
              src={qrCodeDataUri}
              style={styles.qrCode} 
            />
          )}
          <View style={{ flex: 1, marginHorizontal: 20 }}>
            <Text style={styles.validationText}>Documento validado digitalmente por la Coordinación de Prácticas Profesionales</Text>
          </View>
          <Text style={styles.pageNumber}>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
}