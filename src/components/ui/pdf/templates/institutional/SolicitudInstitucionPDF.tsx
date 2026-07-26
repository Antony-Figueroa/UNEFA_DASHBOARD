import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, getFechaParts, formatCI } from '@/features/reports/utils/reportFormatters';

const styles = StyleSheet.create({

  placeDate: { 
    marginBottom: 4, 
    fontSize: 11, 
    textAlign: 'right',
    fontFamily: 'Times-Roman',
  },
  leftSection: {
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  destinatario: { 
    marginBottom: 2, 
    fontSize: 11,
    fontFamily: 'Times-Bold',
  },
  destinatarioRed: {
    marginBottom: 2, 
    fontSize: 11,
    color: '#000000',
    fontFamily: 'Times-Bold',
  },
  paragraph: { 
    marginBottom: 10, 
    textAlign: 'justify', 
    fontSize: 11, 
    lineHeight: 1.4,
    textIndent: 30,
    fontFamily: 'Times-Roman',
  },
  textRed: {
    color: '#000000',
    fontFamily: 'Times-Bold',
  },
  textNormal: {
    color: '#000000',
    fontFamily: 'Times-Roman',
  },

  centeredContainer: {
    marginTop: 30,
    alignItems: 'center',
    textAlign: 'center',
  },
  leftParagraph: { 
    marginBottom: 10, 
    textAlign: 'justify', 
    fontSize: 11, 
    lineHeight: 1.4,
    textIndent: 30,
    fontFamily: 'Times-Roman',
  },
  centeredAtentamente: {
    marginBottom: 20,
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Times-Roman',
  },
  centeredFirmaNombre: { 
    fontSize: 11,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Times-Bold',
  },
  centeredFirmaCargo: { 
    fontSize: 11,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Times-Bold',
  },
  centeredFirmaOrden: { 
    fontSize: 10, 
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Times-Roman',
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

  const estudianteNombre = formatNombreCompleto(data.estudiante).toUpperCase();
  const estudianteCI = formatCI(data.estudiante.ci).toUpperCase();
  const carreraNombre = data.carrera.nombre.toUpperCase();
  const lapsoInicio = data.periodo ? (() => { const p = getFechaParts(data.periodo.startDate); return `${p.dia} de ${p.mes.toLowerCase()} del ${p.anio}`; })() : '________________________';
  const lapsoFin = data.periodo ? (() => { const p = getFechaParts(data.periodo.endDate); return `${p.dia} de ${p.mes.toLowerCase()} del ${p.anio}`; })() : '________________________';

  const firmaNombre = textos.firmaNombre || 'MSc. Marbelys del Valle Rivero';
  const firmaCargo = textos.firmaCargo || 'Decana del Núcleo Portuguesa';
  const firmaOrden = textos.firmaOrden || textos.orden || 'Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022';

  // Textos editables desde la configuración
  const senoresTexto = textos.senores || 'Señores:';
  const presenteTexto = textos.presente || 'Presente';
  const destinatarioNombre = textos.destinatarioNombre || data.institucion?.nombre?.toUpperCase() || '________________________';
  const destinatarioAtte = textos.destinatario || 'MSc. Marbelys del Valle Rivero';
  const destinatarioCargo = textos.cargo || 'Decana del Núcleo Portuguesa';

  return (
    <PDFLayout
      title=""
      verificationHash={verificationHash}
      qrCodeDataUri={qrCodeDataUri}
      hideReportTitle
      hideEquipoTrabajo
    >
      {/* Fecha inmediatamente debajo del membrete */}
        <Text style={styles.placeDate}>Guanare, {fechaHoy.dia} de {fechaHoy.mes} del {fechaHoy.anio}</Text>
        
        {/* Sección izquierda: Señores, Institución, Presente (editables) */}
        <View style={styles.leftSection}>
          <Text style={styles.destinatario}>{senoresTexto}</Text>
          <Text style={styles.destinatarioRed}>{destinatarioNombre}</Text>
          <Text style={styles.destinatario}>{presenteTexto}</Text>
        </View>
        
        {/* Sección derecha: Atte y Cargo */}
        <View style={styles.rightSection}>
          <Text style={styles.destinatario}>Atte: {destinatarioAtte}</Text>
          <Text style={styles.destinatario}>{destinatarioCargo}</Text>
        </View>
        
        {/* Cuerpo del texto con datos en mayúsculas */}
        <Text style={styles.paragraph}>
          Tengo el agrado de dirigirme a usted, en la oportunidad de presentarle a el/la Bachiller <Text style={styles.textRed}>{estudianteNombre}</Text>, titular de la cédula de identidad <Text style={styles.textRed}>{estudianteCI}</Text>, estudiante de la carrera <Text style={styles.textRed}>{carreraNombre}</Text>, el mencionado Bachiller está autorizado para realizar trámites en la Organización que usted representa, relacionados con la posibilidad de desarrollar en su práctica profesional un proyecto con un mínimo de 480 horas laborales, comprendidas desde <Text style={styles.textNormal}>{lapsoInicio}</Text> hasta <Text style={styles.textNormal}>{lapsoFin}</Text>.
        </Text>
        
        <Text style={styles.paragraph}>
          Es necesario señalar que, el estudiante que obtenga de usted la autorización para realizar la práctica profesional, reciba de la organización la carta de aceptación, plan de trabajo, resumen curricular del tutor institucional, los recursos y el asesoramiento requerido para el cumplimiento de las actividades asignadas. Así mismo, es importante destacar que la Organización se compromete a entregar la evaluación realizada por el tutor institucional y el certificado de culminación el último día de las prácticas.
        </Text>
        
        <Text style={styles.paragraph}>
          Por otra parte, el bachiller será supervisado durante dos (2) oportunidades por un docente, debidamente autorizado por la UNEFA. Anexo a esta carta, se facilita el perfil del egresado del estudiante.
        </Text>
        
        {/* Despedida alineada a la derecha */}
        <Text style={styles.leftParagraph}>
          Agradeciendo la atención prestada sobre este particular, quedo de usted.
        </Text>
        
        <Text style={styles.centeredAtentamente}>Atentamente,</Text>
        
        <View style={styles.centeredContainer}>
          <Text style={styles.centeredFirmaNombre}>{firmaNombre}</Text>
          <Text style={styles.centeredFirmaCargo}>{firmaCargo}</Text>
          <Text style={styles.centeredFirmaOrden}>{firmaOrden}</Text>
        </View>
    </PDFLayout>
  );
}