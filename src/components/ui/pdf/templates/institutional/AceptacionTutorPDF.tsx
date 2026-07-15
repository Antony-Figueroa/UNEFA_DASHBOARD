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
  
  const tutorTitle = data.tutor ? getTutorTitle(data.tutor.titulo, data.tutor.tituloAbrev) : 'MAESTR';
  const tutorName = data.tutor ? formatNombreCompleto(data.tutor).toUpperCase() : '';
  const tutorCI = data.tutor ? formatCI(data.tutor.ci) : '';
  const estudianteNombre = formatNombreCompleto(data.estudiante).toUpperCase();
  const estudianteCI = formatCI(data.estudiante.ci);
  const carreraNombre = data.carrera.nombre;

  return (
    <PDFLayout title="ACEPTACIÓN DEL TUTOR ACADÉMICO" verificationHash={verificationHash} qrCodeDataUri={qrCodeDataUri}>
      <Text style={styles.paragraph}>
        Yo, {tutorTitle}. {tutorName}, titular de la cedula de identidad {tutorCI}, hago constar por medio de la presente que acepto la tutoría académica de la práctica profesional por parte de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana (UNEFA) del (la) bachiller {estudianteNombre}, titular de la cedula de identidad {estudianteCI} para optar al grado de {carreraNombre}
      </Text>
      
      <Text style={styles.paragraph}>
        Acepto asesorar al participante en calidad de tutor académico, durante la etapa de desarrollo del informe de pasantía
      </Text>
      
      <Text style={styles.dateSection}>
        En Araure a los {fechaHoy.dia} días del mes de {fechaHoy.mes} del {fechaHoy.anio}.
      </Text>
      
      <View style={styles.firmaContainer}>
        <View style={styles.firmaLine} />
        <Text style={styles.firmaLabel}>Nombres y Apellidos</Text>
        <Text style={styles.firmaData}>{tutorTitle}. {tutorName}</Text>
        <Text style={styles.firmaData}>C.I.: {tutorCI}</Text>
      </View>
    </PDFLayout>
  );
}