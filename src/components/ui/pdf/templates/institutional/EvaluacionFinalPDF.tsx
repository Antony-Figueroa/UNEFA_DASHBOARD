import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatNombreCompleto, formatCI, formatFecha } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 12, lineHeight: 1.5 },
  title: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 30, textDecoration: 'underline' },
  paragraph: { marginBottom: 20, textAlign: 'justify' },
  row: { flexDirection: 'row', marginBottom: 10 },
  label: { fontWeight: 'bold', width: 150 },
  value: { flex: 1 },
  gradeContainer: { marginTop: 30, alignItems: 'center' },
  gradeText: { fontSize: 14, fontWeight: 'bold' },
});

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
    institucion: { nombre: string } | null;
    practica: { startDate: string; endDate: string; grade: number };
  };
  textos: Record<string, string>;
}

export function EvaluacionFinalPDF({ data, textos }: Props) {
  const cuerpo = renderDocumentText(textos.encabezado || '', {
    estudianteNombreCompleto: formatNombreCompleto(data.estudiante),
    estudianteCi: formatCI(data.estudiante.ci),
    carrera: data.carrera.nombre,
    institucionNombre: data.institucion?.nombre || 'No asignada',
    fechaInicio: formatFecha(data.practica.startDate),
    fechaFin: formatFecha(data.practica.endDate),
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>EVALUACIÓN FINAL DE LA PRÁCTICA PROFESIONAL</Text>
        <Text style={styles.paragraph}>{cuerpo}</Text>
        <View style={styles.gradeContainer}>
          <Text style={styles.gradeText}>Nota Final: {data.practica.grade}/20</Text>
        </View>
      </Page>
    </Document>
  );
}
