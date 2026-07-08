import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, formatFecha } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

/* ───────────────────────────────────────────
   Styles
   ─────────────────────────────────────────── */
const styles = StyleSheet.create({
  /* ────────────── Shared ────────────── */
  sectionTitle: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', marginBottom: 4, textDecoration: 'underline' },
  sectionSubtitle: { textAlign: 'center', fontSize: 12, fontWeight: 'bold', marginBottom: 18 },
  paragraph: { marginBottom: 16, textAlign: 'justify', fontSize: 10, lineHeight: 1.4 },
  label: { fontWeight: 'bold', fontSize: 9 },
  value: { fontSize: 9 },

  /* ────────────── Student info pseudo-table ────────────── */
  infoTable: { borderWidth: 1, borderColor: '#000', marginBottom: 14 },
  infoRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  infoRowLast: { flexDirection: 'row' },
  infoLabel: { width: 200, fontWeight: 'bold', fontSize: 9, paddingVertical: 5, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  infoLabelWide: { width: 280, fontWeight: 'bold', fontSize: 9, paddingVertical: 5, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  infoValue: { flex: 1, fontSize: 9, paddingVertical: 5, paddingHorizontal: 6 },

  /* ────────────── Committee table (Section 1) ────────────── */
  committeeTable: { borderWidth: 1, borderColor: '#000', marginBottom: 14 },
  committeeHeader: { flexDirection: 'row', backgroundColor: '#e8e8e8', borderBottomWidth: 1, borderBottomColor: '#000' },
  committeeRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  committeeRowLast: { flexDirection: 'row' },
  chRol: { flex: 1.5, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  chName: { flex: 2.5, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  chCi: { flex: 1.2, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4 },
  cdRol: { flex: 1.5, fontSize: 9, paddingVertical: 4, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  cdName: { flex: 2.5, fontSize: 9, paddingVertical: 4, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  cdCi: { flex: 1.2, fontSize: 9, textAlign: 'center', paddingVertical: 4, paddingHorizontal: 4 },

  /* ────────────── Criteria table (Sections 1, 2, 3) ────────────── */
  criteriaTable: { borderWidth: 1, borderColor: '#000', marginBottom: 10 },
  criteriaHeader: { flexDirection: 'row', backgroundColor: '#e8e8e8', borderBottomWidth: 1, borderBottomColor: '#000' },
  criteriaRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  criteriaRowLast: { flexDirection: 'row' },
  chNum: { width: 28, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 3, borderRightWidth: 1, borderRightColor: '#000' },
  chItem: { flex: 1, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  chRange: { width: 48, fontWeight: 'bold', fontSize: 8, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 2, borderRightWidth: 1, borderRightColor: '#000' },
  chScore: { width: 42, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 3 },
  cdNum: { width: 28, fontSize: 9, textAlign: 'center', paddingVertical: 4, paddingHorizontal: 3, borderRightWidth: 1, borderRightColor: '#000' },
  cdItem: { flex: 1, fontSize: 8, paddingVertical: 4, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  cdRange: { width: 48, fontSize: 8, textAlign: 'center', paddingVertical: 4, paddingHorizontal: 2, borderRightWidth: 1, borderRightColor: '#000', color: '#4a5568' },
  cdScore: { width: 42, fontSize: 9, textAlign: 'center', paddingVertical: 4, paddingHorizontal: 3 },

  totalScoreRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2, marginBottom: 4, paddingRight: 6 },
  totalScoreText: { fontSize: 10, fontWeight: 'bold' },

  avgRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#000', borderBottomWidth: 2, borderBottomColor: '#000' },
  avgText: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },

  observations: { fontSize: 9, marginBottom: 8, fontStyle: 'italic', color: '#4a5568' },

  /* ────────────── Signature area ────────────── */
  firmaContainer: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-around' },
  firmaBox: { alignItems: 'center', width: 200 },
  firmaLine: { marginBottom: 4, width: 180, borderBottomWidth: 1, borderBottomColor: '#000' },
  firmaText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  firmaRole: { fontSize: 9, color: '#4a5568', textAlign: 'center' },

  firmaGrid: { marginTop: 30 },
  firmaRow2: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  firmaBox2: { alignItems: 'center', width: '45%' },
  firmaLine2: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 4 },
  firmaName2: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  firmaRole2: { fontSize: 8, color: '#4a5568', textAlign: 'center' },
  firmaBottom: { alignItems: 'center', marginTop: 10 },

  /* ────────────── Section 4 – Weighted table ────────────── */
  weightTable: { borderWidth: 1, borderColor: '#000', marginBottom: 10 },
  weightHeaderRow: { flexDirection: 'row', backgroundColor: '#e8e8e8', borderBottomWidth: 1, borderBottomColor: '#000' },
  weightRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  weightRowLast: { flexDirection: 'row' },
  whDesc: { flex: 2.5, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  whPct: { flex: 1, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  whParcial: { flex: 1.2, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  whProp: { flex: 1.3, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4 },
  wdDesc: { flex: 2.5, fontSize: 9, paddingVertical: 5, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  wdPct: { flex: 1, fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  wdParcial: { flex: 1.2, fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  wdProp: { flex: 1.3, fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4 },
  wtTotalRow: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: '#000' },
  wtTotalEmpty: { flex: 1.2 },
  wtTotalLabel: { flex: 3.5, fontWeight: 'bold', fontSize: 10, textAlign: 'right', paddingVertical: 5, paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: '#000' },
  wtTotalValue: { flex: 1.3, fontWeight: 'bold', fontSize: 10, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4 },

  finalGradeBox: { marginTop: 15, alignItems: 'center', marginBottom: 15 },
  finalGradeText: { fontSize: 13, fontWeight: 'bold' },

  separator: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 8, borderStyle: 'dashed' },

  /* ────────────── Compact inline info (sections 2,3,4) ────────────── */
  compactRow: { flexDirection: 'row', marginBottom: 2 },
  compactLabel: { fontWeight: 'bold', fontSize: 9, marginRight: 2 },
  compactValue: { fontSize: 9 },
  compactBlock: { marginBottom: 10 },
  signatureLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 2 },
  signatureName: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  signatureRole: { fontSize: 9, color: '#4a5568', textAlign: 'center' },
  signatureItem: { alignItems: 'center', marginBottom: 20 },
  certLine: { width: 200, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 4 },
});

/* ───────────────────────────────────────────
   Types
   ─────────────────────────────────────────── */
interface Criterio {
  itemNumber: number;
  description: string;
  score: number;
}

interface Props {
  data: {
    practiceId: number;
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
    institucion: { nombre: string } | null;
    periodo: { description: string; startDate: string; endDate: string } | null;
    department: string | null;
    tutorInstitucional: { ci: string; titulo: string | null; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string } | null;
    tutorAcademico: { ci: string; titulo: string | null; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string } | null;
    coordinadorPP: { nombreCompleto: string; ci: string; cargo: string } | null;
    coordinadorCarrera: { nombreCompleto: string; ci: string; cargo: string } | null;
    evaluacionTutorInstitucional: { totalScore: number; observations: string; criterios: Criterio[] } | null;
    evaluacionTutorAcademico: { totalScore: number; observations: string; criterios: Criterio[] } | null;
    evaluacionesComite: { evaluationId: number; evaluatorName: string; totalScore: number; observations: string; criterios: Criterio[] }[];
    comiteTotalScore: number;
    evaluacionFinal: {
      weights: { institucional: number; academico: number; comite: number };
      parciales: { institucional: number | null; academico: number | null; comite: number | null };
      notaFinal: number;
    };
    practica: { startDate: string; endDate: string; grade: number };
  };
  textos: Record<string, string>;
}

/* ───────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────── */
const weightToPercent = (w: number) => Math.round(w * 100);

function calcProp(parcial: number, weight: number): string {
  return ((parcial * weightToPercent(weight)) / 100).toFixed(1);
}

function calcSubTotal(parciales: { institucional: number | null; academico: number | null; comite: number | null }, weights: { institucional: number; academico: number; comite: number }): string {
  let total = 0;
  if (parciales.institucional !== null) total += (parciales.institucional * weightToPercent(weights.institucional)) / 100;
  if (parciales.academico !== null) total += (parciales.academico * weightToPercent(weights.academico)) / 100;
  if (parciales.comite !== null) total += (parciales.comite * weightToPercent(weights.comite)) / 100;
  return total.toFixed(1);
}

/** Render a criteria table with header, rows, and subtotal. */
function renderCriteriaTable(criterios: Criterio[], showRange: boolean = true) {
  const subtotal = criterios.reduce((acc, c) => acc + (c.score || 0), 0);
  return (
    <View style={styles.criteriaTable}>
      {/* Header */}
      <View style={styles.criteriaHeader}>
        <Text style={styles.chNum}>N°</Text>
        <Text style={styles.chItem}>Ítems / Aspecto a evaluar</Text>
        {showRange && <Text style={styles.chRange}>Intervalo</Text>}
        <Text style={styles.chScore}>Calif.</Text>
      </View>
      {/* Rows */}
      {(criterios || []).map((c, idx) => {
        const isLast = idx === (criterios?.length || 0) - 1;
        return (
          <View style={isLast ? styles.criteriaRowLast : styles.criteriaRow} key={c.itemNumber}>
            <Text style={styles.cdNum}>{c.itemNumber}</Text>
            <Text style={styles.cdItem}>{c.description}</Text>
            {showRange && <Text style={styles.cdRange}>0-20</Text>}
            <Text style={styles.cdScore}>{c.score ?? '-'}</Text>
          </View>
        );
      })}
      {/* Subtotal */}
      <View style={styles.totalScoreRow}>
        <Text style={styles.totalScoreText}>
          Subtotal
        </Text>
      </View>
      <View style={styles.totalScoreRow}>
        <Text style={[styles.totalScoreText, { fontSize: 11 }]}>
          {subtotal.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

/** Format tutor name with title prefix. */
function formatTutorCompleto(tutor: { ci: string; titulo: string | null; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string } | null): string {
  if (!tutor) return 'No asignado';
  const title = tutor.titulo ? `${tutor.titulo}. ` : '';
  const nombre = formatNombreCompleto(tutor);
  return `${title}${nombre}`;
}

/* ───────────────────────────────────────────
   Sections
   ─────────────────────────────────────────── */

/** Section 1 – COMITÉ EVALUADOR */
function SectionComite({ data, textos }: Props) {
  const comiteCriterios = data.evaluacionesComite?.[0]?.criterios || [];
  const subtotal = comiteCriterios.reduce((acc, c) => acc + (c.score || 0), 0);
  const numItems = comiteCriterios.length || 15;

  const cuerpo = renderDocumentText(textos.encabezado || '', {
    estudianteNombreCompleto: formatNombreCompleto(data.estudiante),
    estudianteCi: formatCI(data.estudiante.ci),
    carrera: data.carrera.nombre,
    periodo: data.periodo?.description || '',
  });

  return (
    <View>
      <Text style={styles.sectionTitle}>EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE</Text>
      <Text style={styles.sectionSubtitle}>COMITÉ EVALUADOR</Text>

      {/* Student info — compact */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 10, marginBottom: 2 }}>
          <Text style={{ fontWeight: 'bold' }}>Apellidos y Nombres del Estudiante: </Text>
          <Text>{formatNombreCompleto(data.estudiante)}</Text>
        </Text>
        <Text style={{ fontSize: 10, marginBottom: 4 }}>
          <Text style={{ fontWeight: 'bold' }}>Cédula de Identidad del Estudiante: </Text>
          <Text>{formatCI(data.estudiante.ci)}</Text>
        </Text>
        <View style={{ flexDirection: 'row', fontSize: 10 }}>
          <Text>
            <Text style={{ fontWeight: 'bold' }}>Carrera: </Text>
            <Text>{data.carrera.nombre}</Text>
          </Text>
          <Text style={{ marginLeft: 30 }}>
            <Text style={{ fontWeight: 'bold' }}>Período Académico: </Text>
            <Text>{data.periodo?.description || ''}</Text>
          </Text>
        </View>
      </View>

      {/* Committee members table */}
      <View style={styles.committeeTable}>
        <View style={styles.committeeHeader}>
          <Text style={styles.chRol}>Comité Evaluador</Text>
          <Text style={styles.chName}>Apellidos y Nombres</Text>
          <Text style={styles.chCi}>Cédula de Identidad</Text>
        </View>
        <View style={styles.committeeRow}>
          <Text style={styles.cdRol}>Coordinador de Práctica Profesional</Text>
          <Text style={styles.cdName}>{data.coordinadorPP?.nombreCompleto || ''}</Text>
          <Text style={styles.cdCi}>{data.coordinadorPP ? formatCI(data.coordinadorPP.ci) : ''}</Text>
        </View>
        <View style={styles.committeeRow}>
          <Text style={styles.cdRol}>Coordinador de Carrera</Text>
          <Text style={styles.cdName}>{data.coordinadorCarrera?.nombreCompleto || ''}</Text>
          <Text style={styles.cdCi}>{data.coordinadorCarrera ? formatCI(data.coordinadorCarrera.ci) : ''}</Text>
        </View>
        <View style={styles.committeeRowLast}>
          <Text style={styles.cdRol}>Tutor Académico</Text>
          <Text style={styles.cdName}>{formatTutorCompleto(data.tutorAcademico)}</Text>
          <Text style={styles.cdCi}>{data.tutorAcademico ? formatCI(data.tutorAcademico.ci) : ''}</Text>
        </View>
      </View>

      {/* Criteria table */}
      {comiteCriterios.length > 0 ? (
        <View>
          {renderCriteriaTable(comiteCriterios, true)}
          <View style={styles.avgRow}>
            <Text style={styles.avgText}>
              Calificación final = (Subtotal / {numItems}): {subtotal.toFixed(1)}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={{ fontSize: 9, textAlign: 'center', color: '#718096', marginVertical: 10 }}>
          No hay criterios registrados para el comité evaluador.
        </Text>
      )}

      {/* Signatures */}
      <View style={styles.firmaContainer}>
        <View style={styles.firmaBox}>
          <View style={styles.firmaLine} />
          <Text style={styles.firmaText}>{data.coordinadorPP?.nombreCompleto || ''}</Text>
          <Text style={styles.firmaRole}>Coordinador de Práctica Profesional</Text>
        </View>
        <View style={styles.firmaBox}>
          <View style={styles.firmaLine} />
          <Text style={styles.firmaText}>{data.coordinadorCarrera?.nombreCompleto || ''}</Text>
          <Text style={styles.firmaRole}>Coordinador de Carrera</Text>
        </View>
        <View style={styles.firmaBox}>
          <View style={styles.firmaLine} />
          <Text style={styles.firmaText}>{formatTutorCompleto(data.tutorAcademico)}</Text>
          <Text style={styles.firmaRole}>Tutor Académico</Text>
        </View>
      </View>
    </View>
  );
}

/** Section 2 – TUTOR ACADÉMICO */
function SectionTutorAcademico({ data, textos }: Props) {
  const evaluacion = data.evaluacionTutorAcademico;
  const criterios = evaluacion?.criterios || [];
  const subtotal = criterios.reduce((acc, c) => acc + (c.score || 0), 0);
  const nombreTutor = formatTutorCompleto(data.tutorAcademico);
  const ciTutor = data.tutorAcademico ? formatCI(data.tutorAcademico.ci) : '';

  return (
    <View>
      <Text style={styles.sectionTitle}>EVALUACIÓN DEL TUTOR ACADÉMICO</Text>

      {/* Student info — compact inline */}
      <View style={styles.compactBlock}>
        <View style={styles.compactRow}>
          <Text style={{ fontSize: 9 }}>
            <Text style={{ fontWeight: 'bold' }}>Apellidos y Nombres del Estudiante: </Text>
            <Text>{formatNombreCompleto(data.estudiante)}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 20 }}>  Cédula de Identidad del Estudiante: </Text>
            <Text>{formatCI(data.estudiante.ci)}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 20 }}>  Carrera que cursa: </Text>
            <Text>{data.carrera.nombre}</Text>
          </Text>
        </View>
        <View style={styles.compactRow}>
          <Text style={{ fontSize: 9 }}>
            <Text style={{ fontWeight: 'bold' }}>Apellidos y Nombres del Tutor Académico: </Text>
            <Text>{nombreTutor}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 20 }}>  Cédula de Identidad del Tutor Académico: </Text>
            <Text>{ciTutor}</Text>
          </Text>
        </View>
        <View style={styles.compactRow}>
          <Text style={{ fontSize: 9 }}>
            <Text style={{ fontWeight: 'bold' }}>Fecha de Inicio de la PP: </Text>
            <Text>{formatFecha(data.practica.startDate)}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 20 }}>  Fecha de Culminación de la PP: </Text>
            <Text>{formatFecha(data.practica.endDate)}</Text>
          </Text>
        </View>
      </View>

      {/* Criteria table */}
      {criterios.length > 0 ? (
        <View>
          {renderCriteriaTable(criterios, true)}
          <View style={styles.avgRow}>
            <Text style={styles.avgText}>
              Calificación final = (Subtotal / {criterios.length}): {evaluacion ? evaluacion.totalScore.toFixed(1) : subtotal.toFixed(1)}
            </Text>
          </View>
          {evaluacion?.observations && (
            <Text style={styles.observations}>Observaciones: {evaluacion.observations}</Text>
          )}
        </View>
      ) : (
        <Text style={{ fontSize: 9, textAlign: 'center', color: '#718096', marginVertical: 10 }}>
          No hay evaluación registrada del Tutor Académico.
        </Text>
      )}

      {/* Signature */}
      <View style={styles.firmaContainer}>
        <View style={styles.firmaBox}>
          <View style={styles.firmaLine} />
          <Text style={styles.firmaText}>{nombreTutor}</Text>
          <Text style={styles.firmaRole}>Tutor Académico</Text>
        </View>
      </View>
    </View>
  );
}

/** Section 3 – TUTOR INSTITUCIONAL */
function SectionTutorInstitucional({ data, textos }: Props) {
  const evaluacion = data.evaluacionTutorInstitucional;
  const criterios = evaluacion?.criterios || [];
  const subtotal = criterios.reduce((acc, c) => acc + (c.score || 0), 0);
  const nombreTutorInst = formatTutorCompleto(data.tutorInstitucional);
  const ciTutorInst = data.tutorInstitucional ? formatCI(data.tutorInstitucional.ci) : '';

  return (
    <View>
      <Text style={styles.sectionTitle}>EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE</Text>
      <Text style={styles.sectionSubtitle}>TUTOR INSTITUCIONAL</Text>

      {/* Student info — compact inline */}
      <View style={styles.compactBlock}>
        <View style={styles.compactRow}>
          <Text style={{ fontSize: 9 }}>
            <Text style={{ fontWeight: 'bold' }}>Apellidos y Nombres: </Text>
            <Text>{formatNombreCompleto(data.estudiante)}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 12 }}>  Cédula de Identidad: </Text>
            <Text>{formatCI(data.estudiante.ci)}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 12 }}>  Período: </Text>
            <Text>{data.periodo?.description || ''}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 12 }}>  Carrera que cursa: </Text>
            <Text>{data.carrera.nombre}</Text>
          </Text>
        </View>
        <View style={styles.compactRow}>
          <Text style={{ fontSize: 9 }}>
            <Text style={{ fontWeight: 'bold' }}>Nombre de la Institución: </Text>
            <Text>{data.institucion?.nombre || 'No asignada'}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 12 }}>  Departamento donde se efectuó la PP: </Text>
            <Text>{data.department || 'No especificado'}</Text>
          </Text>
        </View>
        <View style={styles.compactRow}>
          <Text style={{ fontSize: 9 }}>
            <Text style={{ fontWeight: 'bold' }}>Apellidos y Nombres del Tutor(a) Institucional: </Text>
            <Text>{nombreTutorInst}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 12 }}>  C.I. del Tutor(a) Institucional: </Text>
            <Text>{ciTutorInst}</Text>
          </Text>
        </View>
        <View style={styles.compactRow}>
          <Text style={{ fontSize: 9 }}>
            <Text style={{ fontWeight: 'bold' }}>Fecha de Inicio de la PP: </Text>
            <Text>{formatFecha(data.practica.startDate)}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 12 }}>  Fecha de Culminación de la PP: </Text>
            <Text>{formatFecha(data.practica.endDate)}</Text>
          </Text>
        </View>
      </View>

      {/* Criteria table */}
      {criterios.length > 0 ? (
        <View>
          {renderCriteriaTable(criterios, true)}
          <View style={styles.avgRow}>
            <Text style={styles.avgText}>
              Calificación final = (Subtotal / {criterios.length}): {evaluacion ? evaluacion.totalScore.toFixed(1) : subtotal.toFixed(1)}
            </Text>
          </View>
          {evaluacion?.observations && (
            <Text style={styles.observations}>Observaciones: {evaluacion.observations}</Text>
          )}
        </View>
      ) : (
        <Text style={{ fontSize: 9, textAlign: 'center', color: '#718096', marginVertical: 10 }}>
          No hay evaluación registrada del Tutor Institucional.
        </Text>
      )}

      {/* Signature + Sello */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }}>
        <View style={{ alignItems: 'center', width: 200 }}>
          <View style={{ width: 180, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 4 }} />
          <Text style={{ fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>{nombreTutorInst}</Text>
          <Text style={{ fontSize: 9, color: '#4a5568', textAlign: 'center' }}>Tutor(a) Institucional</Text>
        </View>
        <View style={{ alignItems: 'center', width: 140 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>Sello de la Empresa:</Text>
          <View style={{ width: 120, height: 80, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' }} />
        </View>
      </View>
    </View>
  );
}

/** Section 4 – EVALUACIÓN FINAL */
function SectionEvaluacionFinal({ data, textos }: Props) {
  const { evaluacionFinal } = data;

  return (
    <View>
      <Text style={styles.sectionTitle}>EVALUACIÓN FINAL DE LA PRÁCTICA PROFESIONAL</Text>

      {/* Student info — compact inline */}
      <View style={styles.compactBlock}>
        <View style={styles.compactRow}>
          <Text style={{ fontSize: 9 }}>
            <Text style={{ fontWeight: 'bold' }}>APELLIDOS Y NOMBRES: </Text>
            <Text>{formatNombreCompleto(data.estudiante).toUpperCase()}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 16 }}>  CÉDULA DE IDENTIDAD: </Text>
            <Text>{formatCI(data.estudiante.ci)}</Text>
          </Text>
        </View>
        <View style={styles.compactRow}>
          <Text style={{ fontSize: 9 }}>
            <Text style={{ fontWeight: 'bold' }}>CARRERA QUE CURSA: </Text>
            <Text>{data.carrera.nombre.toUpperCase()}</Text>
          </Text>
        </View>
        <View style={styles.compactRow}>
          <Text style={{ fontSize: 9 }}>
            <Text style={{ fontWeight: 'bold' }}>NOMBRE DE LA INSTITUCIÓN DONDE REALIZÓ LA PP: </Text>
            <Text>{(data.institucion?.nombre || 'No asignada').toUpperCase()}</Text>
          </Text>
        </View>
        <View style={styles.compactRow}>
          <Text style={{ fontSize: 9 }}>
            <Text style={{ fontWeight: 'bold' }}>FECHA DE INICIO DE LA PP: </Text>
            <Text>{formatFecha(data.practica.startDate)}</Text>
            <Text style={{ fontWeight: 'bold', marginLeft: 16 }}>  FECHA DE CULMINACIÓN DE LA PP: </Text>
            <Text>{formatFecha(data.practica.endDate)}</Text>
          </Text>
        </View>
      </View>

      {/* Weighted evaluation table */}
      {evaluacionFinal && (
        <View style={styles.weightTable}>
          <View style={styles.weightHeaderRow}>
            <Text style={styles.whDesc}>Evaluación del (de la) Estudiante</Text>
            <Text style={styles.whPct}>Valor Porcentual</Text>
            <Text style={styles.whParcial}>Calificación Parcial Escala del 1 al 20</Text>
            <Text style={styles.whProp}>Calificación Parcial Proporcional al Porcentaje</Text>
          </View>

          {/* A. Tutor Institucional */}
          <View style={styles.weightRow}>
            <Text style={styles.wdDesc}>A. Por parte del (de la) Tutor(a) Institucional</Text>
            <Text style={styles.wdPct}>{weightToPercent(evaluacionFinal.weights.institucional)}%</Text>
            <Text style={styles.wdParcial}>{evaluacionFinal.parciales.institucional !== null ? evaluacionFinal.parciales.institucional.toFixed(1) : '-'}</Text>
            <Text style={styles.wdProp}>
              {evaluacionFinal.parciales.institucional !== null
                ? calcProp(evaluacionFinal.parciales.institucional, evaluacionFinal.weights.institucional)
                : '-'}
            </Text>
          </View>

          {/* B. Tutor Académico */}
          <View style={styles.weightRow}>
            <Text style={styles.wdDesc}>B. Por parte del (de la) Tutor(a) Académico</Text>
            <Text style={styles.wdPct}>{weightToPercent(evaluacionFinal.weights.academico)}%</Text>
            <Text style={styles.wdParcial}>{evaluacionFinal.parciales.academico !== null ? evaluacionFinal.parciales.academico.toFixed(1) : '-'}</Text>
            <Text style={styles.wdProp}>
              {evaluacionFinal.parciales.academico !== null
                ? calcProp(evaluacionFinal.parciales.academico, evaluacionFinal.weights.academico)
                : '-'}
            </Text>
          </View>

          {/* C. Comité Evaluador */}
          <View style={styles.weightRowLast}>
            <Text style={styles.wdDesc}>C. Por parte del Comité Evaluador</Text>
            <Text style={styles.wdPct}>{weightToPercent(evaluacionFinal.weights.comite)}%</Text>
            <Text style={styles.wdParcial}>{evaluacionFinal.parciales.comite !== null ? evaluacionFinal.parciales.comite.toFixed(1) : '-'}</Text>
            <Text style={styles.wdProp}>
              {evaluacionFinal.parciales.comite !== null
                ? calcProp(evaluacionFinal.parciales.comite, evaluacionFinal.weights.comite)
                : '-'}
            </Text>
          </View>

          {/* Sub Total */}
          <View style={styles.wtTotalRow}>
            <Text style={styles.wtTotalEmpty} />
            <Text style={styles.wtTotalLabel}>Sub Total</Text>
            <Text style={styles.wtTotalEmpty} />
            <Text style={styles.wtTotalValue}>
              {calcSubTotal(evaluacionFinal.parciales, evaluacionFinal.weights)}
            </Text>
          </View>
        </View>
      )}

      {/* Final grade */}
      <View style={styles.finalGradeBox}>
        <Text style={styles.finalGradeText}>
          Calificación final: {evaluacionFinal.notaFinal.toFixed(1)}
        </Text>
      </View>

      {/* Signatures — 5 vertical stacked */}
      <View style={{ marginTop: 30 }}>
        <View style={styles.signatureItem}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>XXXXXXXXXXXXXXXX</Text>
          <Text style={styles.signatureRole}>JEFA DEL EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES</Text>
        </View>
        <View style={styles.signatureItem}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>DRA. CARMEN MAGDALENA RANGEL DE ROJAS</Text>
          <Text style={styles.signatureRole}>JEFA DEL ÁREA ACADÉMICA</Text>
        </View>
        <View style={styles.signatureItem}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>LCDO. DANIEL JOSÉ ÁLVAREZ RIVAS</Text>
          <Text style={styles.signatureRole}>JEFE DEL ÁREA DE SECRETARIA</Text>
        </View>
        <View style={styles.signatureItem}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>DRA. MILAGROS DEL VALLE DABOIN VILLEGAS</Text>
          <Text style={styles.signatureRole}>JEFA DE LA UNIDAD DE GESTIÓN EDUCATIVA</Text>
        </View>
        <View style={styles.signatureItem}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>MSC. MARBELYS DEL VALLE RIVERO</Text>
          <Text style={styles.signatureRole}>DECANA DEL NÚCLEO PORTUGUESA</Text>
          <Text style={{ fontSize: 8, color: '#4a5568', textAlign: 'center' }}>Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022</Text>
        </View>
      </View>
    </View>
  );
}

/* ───────────────────────────────────────────
   Main component
   ─────────────────────────────────────────── */
export function EvaluacionConsolidadaPDF({ data, textos }: Props) {
  return (
    <PDFLayout
      title="EVALUACIÓN CONSOLIDADA DE LA PRÁCTICA PROFESIONAL"
      hideReportTitle={true}
    >
      {/* Section 1 – Comité Evaluador */}
      <View>
        <SectionComite data={data} textos={textos} />
      </View>

      {/* Section 2 – Tutor Académico */}
      <View break>
        <SectionTutorAcademico data={data} textos={textos} />
      </View>

      {/* Section 3 – Tutor Institucional */}
      <View break>
        <SectionTutorInstitucional data={data} textos={textos} />
      </View>

      {/* Section 4 – Evaluación Final */}
      <View break>
        <SectionEvaluacionFinal data={data} textos={textos} />
      </View>
    </PDFLayout>
  );
}
