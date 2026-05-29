import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatNombreCompleto, formatCI, getTutorTitle } from '../../../../features/reports/utils/reportFormatters';
import { renderDocumentText } from '../../../../features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 12, lineHeight: 1.5 },
  title: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 30, textDecoration: 'underline' },
  paragraph: { marginBottom: 20, textAlign: 'justify' },
  firmaContainer: { marginTop: 60, alignItems: 'center' },
  firmaLine: { marginBottom: 5 },
  firmaNombre: { fontWeight: 'bold', fontSize: 11 },
  firmaRol: { fontSize: 10, color: '#4a5568' },
});

interface Props {
  data: {
    tutor: {
      ci: string; titulo: string | null; primerNombre: string; segundoNombre?: string;
      primerApellido: string; segundoApellido?: string;
      condicion: string; dedicacion: string;
    };
    totalHours: number;
    periodo: { description: string; startDate: string; endDate: string } | null;
  };
  textos: Record<string, string>;
}

export function ConstanciaTutorAcademicoPDF({ data, textos }: Props) {
  const cuerpo = renderDocumentText(textos.cuerpo || '', {
    tutorTitulo: getTutorTitle(data.tutor.titulo),
    tutorNombreCompleto: formatNombreCompleto(data.tutor),
    tutorCi: formatCI(data.tutor.ci),
    tutorCondicion: data.tutor.condicion,
    tutorDedicacion: data.tutor.dedicacion,
    totalHours: String(data.totalHours),
    periodo: data.periodo?.description || '',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CONSTANCIA DE TUTOR ACADÉMICO</Text>
        <Text style={styles.paragraph}>{cuerpo}</Text>
        <View style={styles.firmaContainer}>
          <Text style={styles.firmaLine}>___________________________________</Text>
          <Text style={styles.firmaNombre}>MSc. Marbelys del Valle Rivero</Text>
          <Text style={styles.firmaRol}>Decana del Núcleo Portuguesa</Text>
          <Text style={styles.firmaRol}>Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022</Text>
        </View>
      </Page>
    </Document>
  );
}
