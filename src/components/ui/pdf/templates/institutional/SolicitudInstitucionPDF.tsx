import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, formatFecha } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  title: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 30, textDecoration: 'underline' },
  destinatario: { marginBottom: 5, fontWeight: 'bold', fontSize: 12 },
  cargo: { marginBottom: 5, fontSize: 12 },
  orden: { marginBottom: 20, fontStyle: 'italic', fontSize: 10 },
  paragraph: { marginBottom: 20, textAlign: 'justify', fontSize: 12, lineHeight: 1.5 },
  firmaContainer: { marginTop: 60, alignItems: 'center' },
  firmaLine: { marginBottom: 5 },
  firmaNombre: { fontWeight: 'bold', fontSize: 11 },
  firmaRol: { fontSize: 10, color: '#4a5568' },
});

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
    institucion: { nombre: string } | null;
    periodo: { description: string; startDate: string; endDate: string } | null;
  };
  textos: Record<string, string>;
}

export function SolicitudInstitucionPDF({ data, textos }: Props) {
  const cuerpo = renderDocumentText(textos.cuerpo || '', {
    estudianteNombreCompleto: formatNombreCompleto(data.estudiante),
    estudianteCi: formatCI(data.estudiante.ci),
    carrera: data.carrera.nombre,
    institucionNombre: data.institucion?.nombre || 'No asignada',
    lapsoInicio: data.periodo ? formatFecha(data.periodo.startDate) : '',
    lapsoFin: data.periodo ? formatFecha(data.periodo.endDate) : '',
  });
  const firma = textos.firma || '';

  return (
    <PDFLayout title="SOLICITUD DE INSTITUCIÓN">
      <Text style={styles.title}>SOLICITUD DE INSTITUCIÓN</Text>
      <Text style={styles.destinatario}>{textos.destinatario || 'MSc. Marbelys del Valle Rivero'}</Text>
      <Text style={styles.cargo}>{textos.cargo || 'Decana del Núcleo Portuguesa'}</Text>
      <Text style={styles.orden}>{textos.orden || ''}</Text>
      <Text style={styles.paragraph}>{cuerpo}</Text>
      <View style={styles.firmaContainer}>
        <Text style={styles.firmaLine}>___________________________________</Text>
        <Text style={styles.firmaNombre}>MSc. Marbelys del Valle Rivero</Text>
        <Text style={styles.firmaRol}>Decana del Núcleo Portuguesa</Text>
        <Text style={styles.firmaRol}>{textos.orden || 'Según Orden administrativa N° 0005'}</Text>
      </View>
    </PDFLayout>
  );
}
