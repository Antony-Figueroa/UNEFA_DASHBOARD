import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, formatFecha } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  title: { textAlign: 'center', fontSize: 16, marginBottom: 30 },
  paragraph: { marginBottom: 20, textAlign: 'justify', fontSize: 12, lineHeight: 1.5 },
  section: { marginBottom: 20 },
  sectionTitle: { marginBottom: 10, fontSize: 13 },
  table: { marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 4 },
  tableHeader: { width: 30 },
  tableDesc: { flex: 1 },
  tableScore: { width: 40, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
});

interface Criterio {
  itemNumber: number;
  description: string;
  score: number;
}

function formatScore(v: number | null | undefined): string {
  if (v === null || v === undefined) return '';
  if (Number.isInteger(v)) return v.toString();
  return v.toFixed(2);
}

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
    tutorAcademico: { ci: string; titulo: string | null; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string } | null;
    periodo: { description: string; startDate: string; endDate: string } | null;
    evaluacion: { totalScore: number; observations: string; criterios: Criterio[] } | null;
  };
  textos: Record<string, string>;
}

export function EvaluacionTutorAcademicoPDF({ data, textos }: Props) {
  const tutorAcadName = data.tutorAcademico
    ? formatNombreCompleto(data.tutorAcademico)
    : 'No asignado';

  const cuerpo = renderDocumentText(textos.encabezado || '', {
    estudianteNombreCompleto: formatNombreCompleto(data.estudiante),
    estudianteCi: formatCI(data.estudiante.ci),
    carrera: data.carrera.nombre,
    periodo: data.periodo?.description || '',
    tutorAcademicoNombre: tutorAcadName,
    tutorAcademicoCi: data.tutorAcademico ? formatCI(data.tutorAcademico.ci) : '',
    fechaInicio: data.periodo ? formatFecha(data.periodo.startDate) : '',
    fechaFin: data.periodo ? formatFecha(data.periodo.endDate) : '',
  });

  return (
    <PDFLayout title="EVALUACIÓN DEL TUTOR ACADÉMICO">
      <Text style={styles.title}>EVALUACIÓN DEL TUTOR ACADÉMICO</Text>
      <Text style={styles.paragraph}>{cuerpo}</Text>
      {data.evaluacion && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Criterios Evaluados</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, { backgroundColor: '#f0f0f0' }]}>
              <Text style={styles.tableHeader}>N°</Text>
              <Text style={styles.tableDesc}>Criterio</Text>
              <Text style={styles.tableScore}>Ptje.</Text>
            </View>
            {data.evaluacion.criterios.map((c: Criterio) => (
              <View style={styles.tableRow} key={c.itemNumber}>
                <Text style={styles.tableHeader}>{c.itemNumber}</Text>
                <Text style={styles.tableDesc}>{c.description}</Text>
                <Text style={styles.tableScore}>{formatScore(c.score)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Text>Total: {formatScore(data.evaluacion.totalScore)} / 100</Text>
          </View>
          {data.evaluacion.observations && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.sectionTitle}>Observaciones</Text>
              <Text>{data.evaluacion.observations}</Text>
            </View>
          )}
        </View>
      )}
    </PDFLayout>
  );
}
