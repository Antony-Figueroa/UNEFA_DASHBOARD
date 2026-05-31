import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatNombreCompleto, formatCI } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 12, lineHeight: 1.5 },
  title: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 30, textDecoration: 'underline' },
  paragraph: { marginBottom: 20, textAlign: 'justify' },
  section: { marginBottom: 20 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 10, fontSize: 13 },
  row: { flexDirection: 'row', marginBottom: 5 },
  label: { fontWeight: 'bold', width: 150 },
  value: { flex: 1 },
  firmaContainer: { marginTop: 50, flexDirection: 'row', justifyContent: 'space-around' },
  firmaBox: { alignItems: 'center', width: 200 },
  firmaLine: { marginBottom: 5, width: 180, borderBottomWidth: 1, borderBottomColor: '#000' },
});

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
    tutorAcademico: { titulo: string | null; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string } | null;
    periodo: { description: string } | null;
    coordinadorPP: { nombreCompleto: string; ci: string; cargo: string } | null;
    coordinadorCarrera: { nombreCompleto: string; ci: string; cargo: string } | null;
  };
  textos: Record<string, string>;
}

export function EvaluacionComitePDF({ data, textos }: Props) {
  const cuerpo = renderDocumentText(textos.encabezado || '', {
    estudianteNombreCompleto: formatNombreCompleto(data.estudiante),
    estudianteCi: formatCI(data.estudiante.ci),
    carrera: data.carrera.nombre,
    periodo: data.periodo?.description || '',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>EVALUACIÓN DEL COMITÉ EVALUADOR</Text>
        <Text style={styles.paragraph}>{cuerpo}</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Miembros del Comité</Text>
          {data.coordinadorPP && (
            <>
              <Text style={styles.label}>Coordinador PP:</Text>
              <Text style={styles.value}>{data.coordinadorPP.nombreCompleto}</Text>
            </>
          )}
          {data.coordinadorCarrera && (
            <>
              <Text style={styles.label}>Coordinador Carrera:</Text>
              <Text style={styles.value}>{data.coordinadorCarrera.nombreCompleto}</Text>
            </>
          )}
          {data.tutorAcademico && (
            <>
              <Text style={styles.label}>Tutor Académico:</Text>
              <Text style={styles.value}>{formatNombreCompleto(data.tutorAcademico)}</Text>
            </>
          )}
        </View>
        <View style={styles.firmaContainer}>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={{ fontSize: 10, textAlign: 'center' }}>
              {data.coordinadorPP?.nombreCompleto || ''}
            </Text>
            <Text style={{ fontSize: 9, color: '#4a5568', textAlign: 'center' }}>
              {data.coordinadorPP?.cargo || 'Coordinador PP'}
            </Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={{ fontSize: 10, textAlign: 'center' }}>
              {data.coordinadorCarrera?.nombreCompleto || ''}
            </Text>
            <Text style={{ fontSize: 9, color: '#4a5568', textAlign: 'center' }}>
              {data.coordinadorCarrera?.cargo || 'Coordinador Carrera'}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
