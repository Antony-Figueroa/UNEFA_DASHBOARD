import { Document, Page, Text, StyleSheet } from '@react-pdf/renderer';
import { formatNombreCompleto, formatCI } from '../../../../features/reports/utils/reportFormatters';
import { renderDocumentText } from '../../../../features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 12, lineHeight: 1.5 },
  title: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 30, textDecoration: 'underline' },
  paragraph: { marginBottom: 20, textAlign: 'justify' },
});

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
  };
  textos: Record<string, string>;
}

export function ActaValidacionPDF({ data, textos }: Props) {
  const cuerpo = renderDocumentText(textos.cuerpo || '', {
    estudianteNombreCompleto: formatNombreCompleto(data.estudiante),
    estudianteCi: formatCI(data.estudiante.ci),
    carrera: data.carrera.nombre,
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ACTA DE VALIDACIÓN</Text>
        <Text style={styles.paragraph}>{cuerpo}</Text>
      </Page>
    </Document>
  );
}
