import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  title: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', marginBottom: 25, textDecoration: 'underline' },
  jurorTitle: { textAlign: 'center', fontSize: 12, fontWeight: 'bold', marginBottom: 12, marginTop: 15, backgroundColor: '#f0f0f0', padding: 6 },
  paragraph: { marginBottom: 20, textAlign: 'justify' },
  section: { marginBottom: 20 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8, fontSize: 12 },
  evaluatorName: { fontSize: 11, fontWeight: 'bold', marginBottom: 8, color: '#000000' },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { fontWeight: 'bold', width: 180, fontSize: 10 },
  value: { flex: 1, fontSize: 10 },

  committeeTable: { marginTop: 5, marginBottom: 15 },
  committeeHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', borderTopWidth: 1, borderTopColor: '#000', backgroundColor: '#f5f5f5', paddingVertical: 4 },
  committeeRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 3 },
  commRol: { flex: 1.5, fontWeight: 'bold', fontSize: 9, paddingLeft: 4 },
  commName: { flex: 2, fontSize: 9 },
  commCi: { flex: 1, fontSize: 9, textAlign: 'center' },
  commHeaderRol: { flex: 1.5, fontWeight: 'bold', fontSize: 9, textAlign: 'center' },
  commHeaderName: { flex: 2, fontWeight: 'bold', fontSize: 9, textAlign: 'center' },
  commHeaderCi: { flex: 1, fontWeight: 'bold', fontSize: 9, textAlign: 'center' },

  criteriaTable: { marginTop: 8, marginBottom: 12 },
  criteriaHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', borderTopWidth: 1, borderTopColor: '#000', backgroundColor: '#f5f5f5', paddingVertical: 4 },
  criteriaRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 3, alignItems: 'flex-start' },
  crNum: { width: 25, fontSize: 9, textAlign: 'center' },
  crDesc: { flex: 1, fontSize: 9, paddingLeft: 2 },
  crRange: { width: 55, fontSize: 8, textAlign: 'center', color: '#000000' },
  crScore: { width: 40, fontSize: 9, textAlign: 'center' },
  hNum: { width: 25, fontWeight: 'bold', fontSize: 9, textAlign: 'center' },
  hDesc: { flex: 1, fontWeight: 'bold', fontSize: 9, textAlign: 'center' },
  hRange: { width: 55, fontWeight: 'bold', fontSize: 9, textAlign: 'center' },
  hScore: { width: 40, fontWeight: 'bold', fontSize: 9, textAlign: 'center' },

  totalScoreRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5, paddingRight: 10 },
  totalScoreText: { fontWeight: 'bold', fontSize: 11 },

  avgRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#000', borderBottomWidth: 2, borderBottomColor: '#000' },
  avgText: { fontWeight: 'bold', fontSize: 13 },

  separator: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 10, borderStyle: 'dashed' },

  firmaContainer: { marginTop: 50, flexDirection: 'row', justifyContent: 'space-around' },
  firmaBox: { alignItems: 'center', width: 200 },
  firmaLine: { marginBottom: 5, width: 180, borderBottomWidth: 1, borderBottomColor: '#000' },
});

interface Criterio {
  itemNumber: number;
  description: string;
  score: number;
}

interface EvaluacionComite {
  evaluationId: number;
  evaluatorName: string;
  totalScore: number;
  observations: string;
  criterios: Criterio[];
}

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
    tutorAcademico: { titulo: string | null; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string; ci?: string } | null;
    periodo: { description: string } | null;
    coordinadorPP: { nombreCompleto: string; ci: string; cargo: string } | null;
    coordinadorCarrera: { nombreCompleto: string; ci: string; cargo: string } | null;
    evaluacionesComite: EvaluacionComite[];
    comiteTotalScore: number;
  };
  textos: Record<string, string>;
}

function formatScore(v: number | null | undefined): string {
  if (v === null || v === undefined) return '';
  if (Number.isInteger(v)) return v.toString();
  return v.toFixed(2);
}

/** Renderiza la tabla de criterios para una evaluación de jurado */
function renderCriterios(evalucion: EvaluacionComite) {
  return (
    <View style={styles.criteriaTable}>
      <View style={styles.criteriaHeader}>
        <Text style={styles.hNum}>N°</Text>
        <Text style={styles.hDesc}>Aspecto a evaluar</Text>
        <Text style={styles.hRange}>Intervalo</Text>
        <Text style={styles.hScore}>Calif.</Text>
      </View>
      {evalucion.criterios.map((c: Criterio) => (
        <View style={styles.criteriaRow} key={c.itemNumber}>
          <Text style={styles.crNum}>{c.itemNumber}</Text>
          <Text style={styles.crDesc}>{c.description}</Text>
          <Text style={styles.crRange}>0-20</Text>
          <Text style={styles.crScore}>{formatScore(c.score)}</Text>
        </View>
      ))}
      <View style={styles.totalScoreRow}>
        <Text style={styles.totalScoreText}>
          Subtotal / {evalucion.criterios.length}: {formatScore(evalucion.totalScore)} pts
        </Text>
      </View>
    </View>
  );
}

export function EvaluacionComitePDF({ data, textos }: Props) {
  const cuerpo = renderDocumentText(textos.encabezado || '', {
    estudianteNombreCompleto: formatNombreCompleto(data.estudiante),
    estudianteCi: formatCI(data.estudiante.ci),
    carrera: data.carrera.nombre,
    periodo: data.periodo?.description || '',
  });

  return (
    <PDFLayout title="EVALUACIÓN DEL COMITÉ EVALUADOR">
      <Text style={styles.title}>EVALUACIÓN DEL COMITÉ EVALUADOR</Text>
      <Text style={styles.paragraph}>{cuerpo}</Text>

      {/* Student info */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Apellidos y Nombres del Estudiante:</Text>
          <Text style={styles.value}>{formatNombreCompleto(data.estudiante)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cédula de Identidad:</Text>
          <Text style={styles.value}>{formatCI(data.estudiante.ci)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Carrera:</Text>
          <Text style={styles.value}>{data.carrera.nombre}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Periodo Académico:</Text>
          <Text style={styles.value}>{data.periodo?.description || ''}</Text>
        </View>
      </View>

      {/* Committee members table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comité Evaluador</Text>
        <View style={styles.committeeTable}>
          <View style={styles.committeeHeader}>
            <Text style={styles.commHeaderRol}>Rol</Text>
            <Text style={styles.commHeaderName}>Apellidos y Nombres</Text>
            <Text style={styles.commHeaderCi}>Cédula de Identidad</Text>
          </View>
          {data.coordinadorPP && (
            <View style={styles.committeeRow}>
              <Text style={styles.commRol}>Coordinador PP</Text>
              <Text style={styles.commName}>{data.coordinadorPP.nombreCompleto}</Text>
              <Text style={styles.commCi}>{formatCI(data.coordinadorPP.ci)}</Text>
            </View>
          )}
          {data.coordinadorCarrera && (
            <View style={styles.committeeRow}>
              <Text style={styles.commRol}>Coordinador Carrera</Text>
              <Text style={styles.commName}>{data.coordinadorCarrera.nombreCompleto}</Text>
              <Text style={styles.commCi}>{formatCI(data.coordinadorCarrera.ci)}</Text>
            </View>
          )}
          {data.tutorAcademico && (
            <View style={styles.committeeRow}>
              <Text style={styles.commRol}>Tutor Académico</Text>
              <Text style={styles.commName}>{formatNombreCompleto(data.tutorAcademico)}</Text>
              <Text style={styles.commCi}>{formatCI(data.tutorAcademico.ci || '')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Evaluaciones de cada jurado */}
      {data.evaluacionesComite && data.evaluacionesComite.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evaluación del Desempeño del Estudiante por Jurado</Text>

          {data.evaluacionesComite.map((ev, idx) => (
            <View key={ev.evaluationId}>
              {idx > 0 && <View style={styles.separator} />}
              <Text style={styles.jurorTitle}>
                JURADO N° {idx + 1} — {ev.evaluatorName || `Miembro del Comité`}
              </Text>
{ev.observations && (
                  <Text style={{ fontSize: 10, marginBottom: 6 }}>
                    Observaciones: {ev.observations}
                  </Text>
                )}
              {renderCriterios(ev)}
            </View>
          ))}

          {/* Promedio final del comité */}
          <View style={styles.avgRow}>
            <Text style={styles.avgText}>
              Calificación Promedio del Comité Evaluador: {formatScore(data.comiteTotalScore)} / 20 pts
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={{ fontSize: 10, textAlign: 'center', color: '#000000' }}>
            No hay evaluaciones registradas del comité evaluador.
          </Text>
        </View>
      )}

      {/* Signatures */}
      <View style={styles.firmaContainer}>
        <View style={styles.firmaBox}>
          <View style={styles.firmaLine} />
          <Text style={{ fontSize: 10, textAlign: 'center' }}>
            {data.coordinadorPP?.nombreCompleto || ''}
          </Text>
          <Text style={{ fontSize: 9, color: '#000000', textAlign: 'center' }}>
            {data.coordinadorPP?.cargo || 'Coordinador de Práctica Profesional'}
          </Text>
          {data.coordinadorPP?.ci && (
            <Text style={{ fontSize: 8, color: '#000000', textAlign: 'center' }}>
              CI: {formatCI(data.coordinadorPP.ci)}
            </Text>
          )}
        </View>
        <View style={styles.firmaBox}>
          <View style={styles.firmaLine} />
          <Text style={{ fontSize: 10, textAlign: 'center' }}>
            {data.coordinadorCarrera?.nombreCompleto || ''}
          </Text>
          <Text style={{ fontSize: 9, color: '#000000', textAlign: 'center' }}>
            {data.coordinadorCarrera?.cargo || 'Coordinador de Carrera'}
          </Text>
          {data.coordinadorCarrera?.ci && (
            <Text style={{ fontSize: 8, color: '#000000', textAlign: 'center' }}>
              CI: {formatCI(data.coordinadorCarrera.ci)}
            </Text>
          )}
        </View>
      </View>
    </PDFLayout>
  );
}
