import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, getTutorTitle } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  title: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 30, textDecoration: 'underline' },
  paragraph: { marginBottom: 20, textAlign: 'justify', fontSize: 12, lineHeight: 1.5 },
  firmaContainer: { marginTop: 60, alignItems: 'center' },
  firmaLine: { marginBottom: 5, fontSize: 11 },
  firmaNombre: { fontWeight: 'bold', fontSize: 11 },
  firmaRol: { fontSize: 10, color: '#4a5568' },
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

export function AceptacionTutorPDF({ data, textos }: Props) {
  const tutorName = data.tutor ? getTutorTitle(data.tutor.titulo) + '. ' + formatNombreCompleto(data.tutor) : 'N/A';
  const cuerpo = renderDocumentText(textos.encabezado || '', {
    tutorTitulo: getTutorTitle(data.tutor?.titulo ?? null),
    tutorNombreCompleto: data.tutor ? formatNombreCompleto(data.tutor) : 'N/A',
    tutorCi: data.tutor ? formatCI(data.tutor.ci) : 'N/A',
    tutorTelefono: data.tutor?.telefono || '',
    estudianteNombreCompleto: formatNombreCompleto(data.estudiante),
    estudianteCi: formatCI(data.estudiante.ci),
    carrera: data.carrera.nombre,
  });
  const firma = renderDocumentText(textos.firma || '', {});

  return (
    <PDFLayout title="ACEPTACIÓN DEL TUTOR ACADÉMICO">
      <Text style={styles.title}>ACEPTACIÓN DEL TUTOR ACADÉMICO</Text>
      <Text style={styles.paragraph}>{cuerpo}</Text>
      <View style={styles.firmaContainer}>
        <Text style={styles.firmaLine}>___________________________________</Text>
        <Text style={styles.firmaNombre}>{tutorName}</Text>
        <Text style={styles.firmaRol}>Tutor(a) Académico(a)</Text>
        <Text style={styles.firmaRol}>C.I.: {data.tutor ? formatCI(data.tutor.ci) : 'N/A'}</Text>
        <Text style={styles.firmaRol}>Teléfono: {data.tutor?.telefono || ''}</Text>
      </View>
      <View style={styles.firmaContainer}>
        <Text style={styles.firmaLine}>___________________________________</Text>
        <Text style={styles.firmaNombre}>MSc. Marbelys del Valle Rivero</Text>
        <Text style={styles.firmaRol}>Decana del Núcleo Portuguesa</Text>
        <Text style={styles.firmaRol}>Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022</Text>
      </View>
    </PDFLayout>
  );
}
