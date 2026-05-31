import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatNombreCompleto, formatCI, getTutorTitle } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 12, lineHeight: 1.5 },
  title: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 30, textDecoration: 'underline' },
  paragraph: { marginBottom: 20, textAlign: 'justify' },
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
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ACEPTACIÓN DEL TUTOR ACADÉMICO</Text>
        <Text style={styles.paragraph}>{cuerpo}</Text>
        <View style={styles.firmaContainer}>
          <Text style={styles.firmaLine}>___________________________________</Text>
          <Text style={styles.firmaNombre}>{tutorName}</Text>
          <Text style={styles.firmaRol}>Tutor(a) Académico(a)</Text>
          <Text style={styles.firmaRol}>C.I.: {data.tutor ? formatCI(data.tutor.ci) : 'N/A'}</Text>
          <Text style={styles.firmaRol}>Teléfono: {data.tutor?.telefono || ''}</Text>
        </View>
      </Page>
    </Document>
  );
}
