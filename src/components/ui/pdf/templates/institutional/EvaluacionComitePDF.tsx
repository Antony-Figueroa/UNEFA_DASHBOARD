import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatNombreCompleto, formatCI } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 11, lineHeight: 1.4 },
  title: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', marginBottom: 25, textDecoration: 'underline' },
  paragraph: { marginBottom: 20, textAlign: 'justify' },
  section: { marginBottom: 20 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8, fontSize: 12 },
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

  criteriaTable: { marginTop: 10, marginBottom: 15 },
  criteriaHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', borderTopWidth: 1, borderTopColor: '#000', backgroundColor: '#f5f5f5', paddingVertical: 4 },
  criteriaRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 3, alignItems: 'flex-start' },
  crNum: { width: 25, fontSize: 9, textAlign: 'center' },
  crDesc: { flex: 1, fontSize: 9, paddingLeft: 2 },
  crRange: { width: 55, fontSize: 8, textAlign: 'center', color: '#718096' },
  crScore: { width: 40, fontSize: 9, textAlign: 'center' },
  hNum: { width: 25, fontWeight: 'bold', fontSize: 9, textAlign: 'center' },
  hDesc: { flex: 1, fontWeight: 'bold', fontSize: 9, textAlign: 'center' },
  hRange: { width: 55, fontWeight: 'bold', fontSize: 9, textAlign: 'center' },
  hScore: { width: 40, fontWeight: 'bold', fontSize: 9, textAlign: 'center' },

  totalScoreRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5, paddingRight: 10 },
  totalScoreText: { fontWeight: 'bold', fontSize: 11 },

  firmaContainer: { marginTop: 50, flexDirection: 'row', justifyContent: 'space-around' },
  firmaBox: { alignItems: 'center', width: 200 },
  firmaLine: { marginBottom: 5, width: 180, borderBottomWidth: 1, borderBottomColor: '#000' },
});

interface Criterio {
  itemNumber: number;
  description: string;
  score: number;
}

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
    tutorAcademico: { titulo: string | null; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string } | null;
    periodo: { description: string } | null;
    coordinadorPP: { nombreCompleto: string; ci: string; cargo: string } | null;
    coordinadorCarrera: { nombreCompleto: string; ci: string; cargo: string } | null;
    evaluacion: {
      totalScore: number;
      observations: string;
      criterios: Criterio[];
    } | null;
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

        {/* Evaluation criteria table */}
        {data.evaluacion && data.evaluacion.criterios && data.evaluacion.criterios.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evaluación del Desempeño del Estudiante</Text>
            <View style={styles.criteriaTable}>
              <View style={styles.criteriaHeader}>
                <Text style={styles.hNum}>N°</Text>
                <Text style={styles.hDesc}>Aspecto a evaluar</Text>
                <Text style={styles.hRange}>Intervalo</Text>
                <Text style={styles.hScore}>Calif.</Text>
              </View>
              {data.evaluacion.criterios.map((c: Criterio) => (
                <View style={styles.criteriaRow} key={c.itemNumber}>
                  <Text style={styles.crNum}>{c.itemNumber}</Text>
                  <Text style={styles.crDesc}>{c.description}</Text>
                  <Text style={styles.crRange}>0-20</Text>
                  <Text style={styles.crScore}>{c.score}</Text>
                </View>
              ))}
            </View>
            <View style={styles.totalScoreRow}>
              <Text style={styles.totalScoreText}>
                Calificación final = (Subtotal / {data.evaluacion.criterios.length}): {data.evaluacion.totalScore.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.firmaContainer}>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={{ fontSize: 10, textAlign: 'center' }}>
              {data.coordinadorPP?.nombreCompleto || ''}
            </Text>
            <Text style={{ fontSize: 9, color: '#4a5568', textAlign: 'center' }}>
              {data.coordinadorPP?.cargo || 'Coordinador de Práctica Profesional'}
            </Text>
            {data.coordinadorPP?.ci && (
              <Text style={{ fontSize: 8, color: '#718096', textAlign: 'center' }}>
                CI: {formatCI(data.coordinadorPP.ci)}
              </Text>
            )}
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={{ fontSize: 10, textAlign: 'center' }}>
              {data.coordinadorCarrera?.nombreCompleto || ''}
            </Text>
            <Text style={{ fontSize: 9, color: '#4a5568', textAlign: 'center' }}>
              {data.coordinadorCarrera?.cargo || 'Coordinador de Carrera'}
            </Text>
            {data.coordinadorCarrera?.ci && (
              <Text style={{ fontSize: 8, color: '#718096', textAlign: 'center' }}>
                CI: {formatCI(data.coordinadorCarrera.ci)}
              </Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
