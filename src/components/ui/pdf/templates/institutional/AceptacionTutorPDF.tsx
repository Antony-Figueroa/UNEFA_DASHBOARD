import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, getFechaParts, getTutorTitle } from '@/features/reports/utils/reportFormatters';

const styles = StyleSheet.create({
  paragraph: { 
    marginBottom: 10, 
    textAlign: 'justify', 
    fontSize: 11, 
    lineHeight: 1.5,
    textIndent: 30,
  },
  dateSection: { 
    marginTop: 5,
    marginBottom: 40, 
    fontSize: 11,
    textIndent: 30,
  },
  firmaContainer: { 
    marginTop: 40, 
    alignItems: 'center',
  },
  firmaLine: { 
    width: 220, 
    borderBottomWidth: 1, 
    borderBottomColor: '#000000', 
    marginBottom: 5,
  },
  firmaLabel: { 
    marginBottom: 3, 
    fontSize: 11,
  },
  firmaData: {
    fontSize: 11,
    marginBottom: 3,
  },
  bold: {
    fontWeight: 'bold',
  },
});

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
    tutor: {
      ci: string; titulo: string | null; tituloAbrev?: string | null; primerNombre: string; segundoNombre?: string;
      primerApellido: string; segundoApellido?: string; telefono: string;
    } | null;
  };
  textos: Record<string, string>;
  verificationHash?: string;
  qrCodeDataUri?: string;
}

export function AceptacionTutorPDF({ data, verificationHash, qrCodeDataUri }: Props) {
  const fechaHoy = getFechaParts(null);
  
  const tutorTitle = data.tutor ? getTutorTitle(data.tutor.titulo, data.tutor.tituloAbrev).toUpperCase() : 'MAESTR';
  const tutorName = data.tutor ? formatNombreCompleto(data.tutor).toUpperCase() : '';
  const tutorCI = data.tutor ? formatCI(data.tutor.ci).toUpperCase() : '';
  const estudianteNombre = formatNombreCompleto(data.estudiante).toUpperCase();
  const estudianteCI = formatCI(data.estudiante.ci).toUpperCase();
  const carreraNombre = data.carrera.nombre.toUpperCase();

  return (
    <PDFLayout title="ACEPTACIÓN DEL TUTOR ACADÉMICO" verificationHash={verificationHash} qrCodeDataUri={qrCodeDataUri}>
      <Text style={styles.paragraph}>
        Yo, <Text style={styles.bold}>{tutorTitle}</Text>. <Text style={styles.bold}>{tutorName}</Text>, titular de la cedula de identidad <Text style={styles.bold}>{tutorCI}</Text>, hago constar por medio de la presente que acepto la tutoría académica de la práctica profesional por parte de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana (UNEFA) del (la) bachiller <Text style={styles.bold}>{estudianteNombre}</Text>, titular de la cedula de identidad <Text style={styles.bold}>{estudianteCI}</Text> para optar al grado de <Text style={styles.bold}>{carreraNombre}</Text>
      </Text>
      
      <Text style={styles.paragraph}>
        Acepto asesorar al participante en calidad de tutor académico, durante la etapa de desarrollo del informe de pasantía
      </Text>
      
      <Text style={styles.dateSection}>
        En Araure a los {fechaHoy.dia} días del mes de {fechaHoy.mes} del {fechaHoy.anio}.
      </Text>
      
      <View style={styles.firmaContainer}>
        <View style={styles.firmaLine} />
        <Text style={[styles.firmaLabel, styles.bold]}>Nombres y Apellidos</Text>
        <Text style={[styles.firmaData, styles.bold]}>{tutorTitle}. {tutorName}</Text>
        <Text style={[styles.firmaData, styles.bold]}>C.I.: {tutorCI}</Text>
      </View>
    </PDFLayout>
  );
}