import { Text, View, StyleSheet, Document, Page, Image } from '@react-pdf/renderer';
import { formatNombreCompleto, formatCI, formatFecha } from '@/features/reports/utils/reportFormatters';

/* ───────────────────────────────────────────
   Estilos Exactos del Documento
   ─────────────────────────────────────────── */
const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 45,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000000',
  },
  pageBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerImg: {
    width: 60,
    height: 60,
  },
  headerTextCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerText: {
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 1.3,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },

  // Info boxes
  infoBox: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  infoRowLast: {
    flexDirection: 'row',
  },
  infoCellHeader: {
    fontWeight: 'bold',
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: '#000',
    backgroundColor: '#f9f9f9',
    fontSize: 7.5,
  },
  infoCellData: {
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontSize: 7.5,
  },
  infoCellDataLast: {
    padding: 3,
    fontSize: 7.5,
  },

  // Criteria table
  table: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 6,
  },
  tHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
  },
  tRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tRowLast: {
    flexDirection: 'row',
  },
  colNum: { width: '6%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center', fontSize: 7.5 },
  colAspect: { width: '62%', borderRightWidth: 1, borderColor: '#000', padding: 3, fontSize: 7.5 },
  colRange: { width: '16%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center', fontSize: 7.5 },
  colScore: { width: '16%', padding: 3, textAlign: 'center', fontSize: 7.5 },
  colNumH: { width: '6%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center', fontWeight: 'bold', fontSize: 8 },
  colAspectH: { width: '62%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center', fontWeight: 'bold', fontSize: 8 },
  colRangeH: { width: '16%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center', fontWeight: 'bold', fontSize: 8 },
  colScoreH: { width: '16%', padding: 3, textAlign: 'center', fontWeight: 'bold', fontSize: 8 },

  // Totals
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#000',
  },
  subtotalLabel: {
    width: '84%',
    textAlign: 'right',
    padding: 3,
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderColor: '#000',
    fontSize: 8,
  },
  subtotalValue: {
    width: '16%',
    textAlign: 'center',
    padding: 3,
    fontWeight: 'bold',
    fontSize: 8,
  },
  finalCalcText: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 6,
  },

  // Signatures
  firmaContainer3: { flexDirection: 'row', justifyContent: 'space-between' },
  firmaContainer1: { alignItems: 'center' },
  firmaBox: { alignItems: 'center', width: '30%' },
  firmaBoxWide: { alignItems: 'center', width: '40%' },
  firmaLine: { width: '100%', borderBottomWidth: 1, borderColor: '#000', marginBottom: 3 },
  firmaName: { fontSize: 8, fontWeight: 'bold', textAlign: 'center', marginBottom: 1 },
  firmaRole: { fontSize: 7.5, textAlign: 'center' },

  // Final signature grid
  firmaFinalContainer: { marginTop: 14 },
  firmaFinalCol: { alignItems: 'center', width: '48%' },
  firmaFinalSingle: { alignItems: 'center', width: '48%', alignSelf: 'center', marginTop: 12 },
  firmaFinalName: { fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
  firmaFinalRole: { fontSize: 7, textAlign: 'center' },
  firmaFinalLine: { width: '100%', borderBottomWidth: 1, borderColor: '#000', marginBottom: 3 },

  // Grid de Información (Página 4)
  gridContainer: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  gridCell: {
    padding: 4,
    minHeight: 45,
  },
  cellHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cellData: {
    fontSize: 10,
  },

  // Tabla Final (Página 4)
  tableFinal: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 30,
  },
  tRowFinal: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  colA: { width: '45%', borderRightWidth: 1, borderColor: '#000', padding: 5, fontSize: 9, justifyContent: 'center' },
  colB: { width: '15%', borderRightWidth: 1, borderColor: '#000', padding: 5, fontSize: 9, textAlign: 'center', justifyContent: 'center' },
  colC: { width: '20%', borderRightWidth: 1, borderColor: '#000', padding: 5, fontSize: 9, textAlign: 'center', justifyContent: 'center' },
  colD: { width: '20%', padding: 5, fontSize: 9, textAlign: 'center', justifyContent: 'center' },

  colMergedLeft: { width: '60%', borderRightWidth: 1, borderColor: '#000', padding: 5 },

  // Firmas Página 4
  firmaRowCenter: { alignItems: 'center', marginBottom: 40 },
  firmaRowSplit: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  firmaBoxFinal: { alignItems: 'center', width: '45%' },
  firmaLineFinal: { width: 220, borderBottomWidth: 1, borderColor: '#000', marginBottom: 4 },
  firmaNameFinal: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  firmaRoleFinal: { fontSize: 9, textAlign: 'center' },
});

/* ───────────────────────────────────────────
   Tipos
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
  return ((parcial * weightToPercent(weight)) / 100).toFixed(2);
}

function calcSubTotal(parciales: any, weights: any): string {
  let total = 0;
  if (parciales.institucional !== null) total += (parciales.institucional * weightToPercent(weights.institucional)) / 100;
  if (parciales.academico !== null) total += (parciales.academico * weightToPercent(weights.academico)) / 100;
  if (parciales.comite !== null) total += (parciales.comite * weightToPercent(weights.comite)) / 100;
  return total.toFixed(2);
}

function formatTutorCompleto(tutor: any): string {
  if (!tutor) return 'No asignado';
  const title = tutor.titulo ? `${tutor.titulo}. ` : '';
  return `${title}${formatNombreCompleto(tutor)}`.toUpperCase();
}

function formatTutorNombre(tutor: any): string {
  if (!tutor) return 'No asignado';
  return formatNombreCompleto(tutor).toUpperCase();
}

/* ───────────────────────────────────────────
   Encabezado reusable con Escudo + Logo
   ─────────────────────────────────────────── */
const MembreteImagen = ({ isPracticas = false }) => (
  <View style={styles.headerRow}>
    <Image src="/pdfs-docs/escudo.png" style={styles.headerImg} />
    <View style={styles.headerTextCol}>
      <Text style={styles.headerText}>REPÚBLICA BOLIVARIANA DE VENEZUELA</Text>
      <Text style={styles.headerText}>MINISTERIO DEL PODER POPULAR PARA LA DEFENSA</Text>
      <Text style={styles.headerText}>UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA</Text>
      <Text style={styles.headerText}>DE LA FUERZA ARMADA BOLIVARIANA</Text>
      <Text style={styles.headerText}>VICERRECTORADO REGIÓN LOS LLANOS</Text>
      <Text style={styles.headerText}>NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA</Text>
      <Text style={styles.headerText}>COORDINACIÓN DE PRÁCTICA{isPracticas ? 'S' : ''} PROFESIONAL{isPracticas ? 'ES' : ''}</Text>
    </View>
    <Image src="/pdfs-docs/logo.png" style={styles.headerImg} />
  </View>
);

/* ───────────────────────────────────────────
   Encabezado Específico para Página 4 (Evaluación Final)
   ─────────────────────────────────────────── */
const HeaderFinal = () => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
    <Image src="/pdfs-docs/escudo.png" style={{ width: 60, height: 60, objectFit: 'contain' }} />
    <View style={{ flex: 1, textAlign: 'center', paddingHorizontal: 10 }}>
      <Text style={{ fontSize: 10, fontWeight: 'bold', lineHeight: 1.2 }}>REPÚBLICA BOLIVARIANA DE VENEZUELA</Text>
      <Text style={{ fontSize: 10, fontWeight: 'bold', lineHeight: 1.2 }}>MINISTERIO DEL PODER POPULAR PARA LA DEFENSA</Text>
      <Text style={{ fontSize: 10, fontWeight: 'bold', lineHeight: 1.2 }}>UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA</Text>
      <Text style={{ fontSize: 10, fontWeight: 'bold', lineHeight: 1.2 }}>DE LA FUERZA ARMADA BOLIVARIANA</Text>
      <Text style={{ fontSize: 10, fontWeight: 'bold', lineHeight: 1.2 }}>VICERRECTORADO REGIÓN LOS LLANOS</Text>
      <Text style={{ fontSize: 10, fontWeight: 'bold', lineHeight: 1.2 }}>NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA</Text>
      <Text style={{ fontSize: 10, fontWeight: 'bold', lineHeight: 1.2 }}>COORDINACIÓN DE PRÁCTICAS PROFESIONALES</Text>
    </View>
    <Image src="/pdfs-docs/logo.png" style={{ width: 60, height: 60, objectFit: 'contain' }} />
  </View>
);

/* ───────────────────────────────────────────
   Página 1: COMITÉ EVALUADOR
   ─────────────────────────────────────────── */
const TOTAL_COMITE = 15;

function PageComite({ data, textos }: Props) {
  const criterios = data.evaluacionesComite?.[0]?.criterios || [];
  const subtotal = criterios.reduce((acc, c) => acc + (c.score || 0), 0);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.pageBody}>
        <View>
          <MembreteImagen />
          <Text style={styles.title}>EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE</Text>
          <Text style={styles.subtitle}>COMITÉ EVALUADOR</Text>

          {/* Datos del estudiante */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoCellHeader, { width: '32%' }]}>Apellidos y Nombres del Estudiante:</Text>
              <Text style={[styles.infoCellData, { width: '68%' }]}>{formatNombreCompleto(data.estudiante).toUpperCase()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoCellHeader, { width: '32%' }]}>Cédula de Identidad del Estudiante:</Text>
              <Text style={[styles.infoCellData, { width: '68%' }]}>{formatCI(data.estudiante.ci)}</Text>
            </View>
            <View style={styles.infoRowLast}>
              <Text style={[styles.infoCellHeader, { width: '14%' }]}>Carrera:</Text>
              <Text style={[styles.infoCellData, { width: '46%' }]}>{data.carrera.nombre.toUpperCase()}</Text>
              <Text style={[styles.infoCellHeader, { width: '20%' }]}>Período Académico:</Text>
              <Text style={[styles.infoCellDataLast, { width: '20%' }]}>{data.periodo?.description}</Text>
            </View>
          </View>

          {/* Comité Evaluador */}
          <View style={styles.infoBox}>
            <View style={[styles.infoRow, { backgroundColor: '#D9D9D9' }]}>
              <Text style={[styles.infoCellHeader, { width: '36%', textAlign: 'center', backgroundColor: '#D9D9D9', borderRightWidth: 1 }]}>Comité Evaluador</Text>
              <Text style={[styles.infoCellHeader, { width: '44%', textAlign: 'center', backgroundColor: '#D9D9D9', borderRightWidth: 1 }]}>Apellidos y Nombres</Text>
              <Text style={[styles.infoCellHeader, { width: '20%', textAlign: 'center', backgroundColor: '#D9D9D9', borderRightWidth: 0 }]}>Cédula de Identidad</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoCellData, { width: '36%' }]}>Coordinador de Práctica Profesional</Text>
              <Text style={[styles.infoCellData, { width: '44%' }]}>{data.coordinadorPP?.nombreCompleto.toUpperCase() || ''}</Text>
              <Text style={[styles.infoCellDataLast, { width: '20%', textAlign: 'center' }]}>{data.coordinadorPP ? formatCI(data.coordinadorPP.ci) : ''}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoCellData, { width: '36%' }]}>Coordinador de Carrera</Text>
              <Text style={[styles.infoCellData, { width: '44%' }]}>{data.coordinadorCarrera?.nombreCompleto.toUpperCase() || ''}</Text>
              <Text style={[styles.infoCellDataLast, { width: '20%', textAlign: 'center' }]}>{data.coordinadorCarrera ? formatCI(data.coordinadorCarrera.ci) : ''}</Text>
            </View>
            <View style={styles.infoRowLast}>
              <Text style={[styles.infoCellData, { width: '36%' }]}>Tutor Académico</Text>
              <Text style={[styles.infoCellData, { width: '44%' }]}>{formatTutorNombre(data.tutorAcademico)}</Text>
              <Text style={[styles.infoCellDataLast, { width: '20%', textAlign: 'center' }]}>{data.tutorAcademico ? formatCI(data.tutorAcademico.ci) : ''}</Text>
            </View>
          </View>

          {/* Tabla de criterios */}
          <View style={styles.table}>
            <View style={styles.tHeader}>
              <Text style={styles.colNumH}>Nº</Text>
              <Text style={styles.colAspectH}>Aspecto a evaluar</Text>
              <Text style={styles.colRangeH}>Intervalo de Ponderación</Text>
              <Text style={styles.colScoreH}>Calificación Parcial</Text>
            </View>
            {criterios.map((c, idx) => (
              <View style={idx === criterios.length - 1 ? styles.tRowLast : styles.tRow} key={c.itemNumber}>
                <Text style={styles.colNum}>{c.itemNumber}</Text>
                <Text style={styles.colAspect}>{c.description}</Text>
                <Text style={styles.colRange}>0-20</Text>
                <Text style={styles.colScore}>{c.score ?? ''}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.subtotalLabel}>Subtotal ({TOTAL_COMITE})</Text>
              <Text style={styles.subtotalValue}>{subtotal.toFixed(2)}</Text>
            </View>
          </View>

          <Text style={styles.finalCalcText}>Calificación final = (Subtotal/{TOTAL_COMITE}): {(subtotal / TOTAL_COMITE).toFixed(2)}</Text>
        </View>

        {/* Firmas al fondo */}
        <View style={styles.firmaContainer3}>
          <View style={styles.firmaBox}>
            {textos.comiteFirma1Nombre ? <Text style={styles.firmaName}>{textos.comiteFirma1Nombre}</Text> : null}
            <View style={styles.firmaLine} />
            <Text style={styles.firmaRole}>Coordinador de Práctica Profesional</Text>
          </View>
          <View style={styles.firmaBox}>
            {textos.comiteFirma2Nombre ? <Text style={styles.firmaName}>{textos.comiteFirma2Nombre}</Text> : null}
            <View style={styles.firmaLine} />
            <Text style={styles.firmaRole}>Coordinador de Carrera</Text>
          </View>
          <View style={styles.firmaBox}>
            {textos.comiteFirma3Nombre ? <Text style={styles.firmaName}>{textos.comiteFirma3Nombre}</Text> : null}
            <View style={styles.firmaLine} />
            <Text style={styles.firmaRole}>Tutor Académico</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

/* ───────────────────────────────────────────
   Página 2: TUTOR ACADÉMICO
   ─────────────────────────────────────────── */
const TOTAL_ACADEMICO = 20;

function PageTutorAcademico({ data, textos }: Props) {
  const criterios = data.evaluacionTutorAcademico?.criterios || [];
  const subtotal = criterios.reduce((acc, c) => acc + (c.score || 0), 0);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.pageBody}>
        <View>
          <MembreteImagen />
          <Text style={[styles.title, { marginBottom: 10 }]}>EVALUACIÓN DEL TUTOR ACADÉMICO</Text>

          {/* Info box */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoCellHeader, { width: '32%' }]}>Apellidos y Nombres del Estudiante:</Text>
              <Text style={[styles.infoCellData, { width: '68%' }]}>{formatNombreCompleto(data.estudiante).toUpperCase()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoCellHeader, { width: '32%' }]}>Cedula de Identidad del Estudiante:</Text>
              <Text style={[styles.infoCellData, { width: '68%' }]}>{formatCI(data.estudiante.ci)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoCellHeader, { width: '32%' }]}>Carrera que cursa:</Text>
              <Text style={[styles.infoCellData, { width: '68%' }]}>{data.carrera.nombre.toUpperCase()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoCellHeader, { width: '32%' }]}>Apellidos y Nombres del Tutor Académico:</Text>
              <Text style={[styles.infoCellData, { width: '38%' }]}>{formatTutorNombre(data.tutorAcademico)}</Text>
              <Text style={[styles.infoCellHeader, { width: '16%' }]}>Cedula de identidad:</Text>
              <Text style={[styles.infoCellDataLast, { width: '14%' }]}>{data.tutorAcademico ? formatCI(data.tutorAcademico.ci) : ''}</Text>
            </View>
            <View style={styles.infoRowLast}>
              <Text style={[styles.infoCellHeader, { width: '24%' }]}>Fecha de Inicio de la PP:</Text>
              <Text style={[styles.infoCellData, { width: '24%' }]}>{formatFecha(data.practica.startDate)}</Text>
              <Text style={[styles.infoCellHeader, { width: '26%' }]}>Fecha de Culminación de la PP:</Text>
              <Text style={[styles.infoCellDataLast, { width: '26%' }]}>{formatFecha(data.practica.endDate)}</Text>
            </View>
          </View>

          {/* Tabla de criterios */}
          <View style={styles.table}>
            <View style={styles.tHeader}>
              <Text style={styles.colNumH}>N°</Text>
              <Text style={styles.colAspectH}>Aspecto Evaluado</Text>
              <Text style={styles.colRangeH}>Intervalo de Ponderación</Text>
              <Text style={styles.colScoreH}>Calificación Parcial</Text>
            </View>
            {criterios.map((c, idx) => (
              <View style={idx === criterios.length - 1 ? styles.tRowLast : styles.tRow} key={c.itemNumber}>
                <Text style={styles.colNum}>{c.itemNumber}</Text>
                <Text style={styles.colAspect}>{c.description}</Text>
                <Text style={styles.colRange}>0-20</Text>
                <Text style={styles.colScore}>{c.score ?? ''}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.subtotalLabel}>Subtotal ({TOTAL_ACADEMICO})</Text>
              <Text style={styles.subtotalValue}>{subtotal.toFixed(2)}</Text>
            </View>
          </View>

          <Text style={styles.finalCalcText}>Calificación final = (Subtotal / {TOTAL_ACADEMICO}):</Text>
        </View>

        <View style={styles.firmaContainer1}>
          {textos.academicoFirmaNombre ? <Text style={styles.firmaName}>{textos.academicoFirmaNombre}</Text> : null}
          <View style={{ alignItems: 'center', width: '40%' }}>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaRole}>Tutor Académico</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

/* ───────────────────────────────────────────
   Página 3: TUTOR INSTITUCIONAL
   ─────────────────────────────────────────── */
const TOTAL_INSTITUCIONAL = 20;

function PageTutorInstitucional({ data, textos }: Props) {
  const criterios = data.evaluacionTutorInstitucional?.criterios || [];
  const subtotal = criterios.reduce((acc, c) => acc + (c.score || 0), 0);

  return (
    <Page size="A4" style={styles.page}>
      <MembreteImagen />
      <Text style={styles.title}>EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE</Text>
      <Text style={styles.subtitle}>TUTOR INSTITUCIONAL</Text>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoCellHeader, { width: '24%' }]}>Apellidos y Nombres:</Text>
          <Text style={[styles.infoCellData, { width: '36%' }]}>{formatNombreCompleto(data.estudiante).toUpperCase()}</Text>
          <Text style={[styles.infoCellHeader, { width: '16%' }]}>Cédula de Identidad:</Text>
          <Text style={[styles.infoCellDataLast, { width: '24%' }]}>{formatCI(data.estudiante.ci)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoCellHeader, { width: '24%' }]}>Carrera que cursa:</Text>
          <Text style={[styles.infoCellData, { width: '36%' }]}>{data.carrera.nombre.toUpperCase()}</Text>
          <Text style={[styles.infoCellHeader, { width: '16%' }]}>Período:</Text>
          <Text style={[styles.infoCellDataLast, { width: '24%' }]}>{data.periodo?.description}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoCellHeader, { width: '28%' }]}>Nombre de la Institución:</Text>
          <Text style={[styles.infoCellData, { width: '72%' }]}>{data.institucion?.nombre?.toUpperCase()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoCellHeader, { width: '38%' }]}>Departamento donde se efectuó la PP:</Text>
          <Text style={[styles.infoCellData, { width: '30%' }]}>{data.department?.toUpperCase()}</Text>
          <Text style={[styles.infoCellHeader, { width: '16%' }]}>Fecha Inicio:</Text>
          <Text style={[styles.infoCellDataLast, { width: '16%' }]}>{formatFecha(data.practica.startDate)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoCellHeader, { width: '38%' }]}>Apellidos y Nombres del Tutor(a) Institucional:</Text>
          <Text style={[styles.infoCellData, { width: '32%' }]}>{formatTutorNombre(data.tutorInstitucional)}</Text>
          <Text style={[styles.infoCellHeader, { width: '14%' }]}>C.I. del Tutor(a) Inst.:</Text>
          <Text style={[styles.infoCellDataLast, { width: '16%' }]}>{data.tutorInstitucional ? formatCI(data.tutorInstitucional.ci) : ''}</Text>
        </View>
        <View style={styles.infoRowLast}>
          <Text style={[styles.infoCellHeader, { width: '24%' }]}>Fecha de Inicio de la PP:</Text>
          <Text style={[styles.infoCellData, { width: '24%' }]}>{formatFecha(data.practica.startDate)}</Text>
          <Text style={[styles.infoCellHeader, { width: '26%' }]}>Fecha de Culminación de la PP:</Text>
          <Text style={[styles.infoCellDataLast, { width: '26%' }]}>{formatFecha(data.practica.endDate)}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tHeader}>
          <Text style={styles.colNumH}>Nº</Text>
          <Text style={styles.colAspectH}>Aspecto evaluado</Text>
          <Text style={styles.colRangeH}>Intervalo de Ponderación</Text>
          <Text style={styles.colScoreH}>Calificación Parcial</Text>
        </View>
        {criterios.map((c, idx) => (
          <View style={idx === criterios.length - 1 ? styles.tRowLast : styles.tRow} key={c.itemNumber}>
            <Text style={styles.colNum}>{c.itemNumber}</Text>
            <Text style={styles.colAspect}>{c.description}</Text>
            <Text style={styles.colRange}>0-20</Text>
            <Text style={styles.colScore}>{c.score ?? ''}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.subtotalLabel}>Subtotal ({TOTAL_INSTITUCIONAL})</Text>
          <Text style={styles.subtotalValue}>{subtotal.toFixed(2)}</Text>
        </View>
        </View>

        <Text style={styles.finalCalcText}>Calificación final = (Subtotal / {TOTAL_INSTITUCIONAL}):</Text>

      {/* Firmas pegadas a la tabla — espacio debajo para firma real */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 }}>
        <View style={{ alignItems: 'center', width: '40%' }}>
          {textos.institucionalFirmaNombre ? <Text style={styles.firmaName}>{textos.institucionalFirmaNombre}</Text> : null}
          <View style={styles.firmaLine} />
          <Text style={styles.firmaRole}>Tutor(a) Institucional</Text>
        </View>
        <View style={{ alignItems: 'center', width: '30%' }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 4 }}>Sello de la Empresa:</Text>
          <View style={{ width: 90, height: 50, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' }} />
        </View>
      </View>
    </Page>
  );
}

/* ───────────────────────────────────────────
   Página 4: EVALUACIÓN FINAL
   ─────────────────────────────────────────── */
function PageEvaluacionFinal({ data, textos }: Props) {
  const { evaluacionFinal } = data;

  return (
    <Page size="A4" style={styles.page}>
      <HeaderFinal />
      <Text style={[styles.title, { marginBottom: 15 }]}>EVALUACIÓN FINAL DE LA PRÁCTICA PROFESIONAL</Text>

      {/* Cuadrícula de Información */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={[styles.gridCell, { width: '60%', borderRightWidth: 1, borderColor: '#000' }]}>
            <Text style={styles.cellHeader}>APELLIDOS Y NOMBRES:</Text>
            <Text style={styles.cellData}>{formatNombreCompleto(data.estudiante).toUpperCase()}</Text>
          </View>
          <View style={[styles.gridCell, { width: '40%' }]}>
            <Text style={styles.cellHeader}>CEDULA DE IDENTIDAD:</Text>
            <Text style={styles.cellData}>{formatCI(data.estudiante.ci)}</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={[styles.gridCell, { width: '100%' }]}>
            <Text style={styles.cellHeader}>CARRERA QUE CURSA:</Text>
            <Text style={styles.cellData}>{data.carrera.nombre.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.gridCell, { width: '50%', borderRightWidth: 1, borderColor: '#000' }]}>
            <Text style={styles.cellHeader}>NOMBRE DE LA INSTITUCIÓN DONDE REALIZO LA PRÁCTICA PROFESIONAL:</Text>
            <Text style={styles.cellData}>{data.institucion?.nombre?.toUpperCase()}</Text>
          </View>
          <View style={[styles.gridCell, { width: '25%', borderRightWidth: 1, borderColor: '#000' }]}>
            <Text style={styles.cellHeader}>FECHA DE INICIO DE LA PP:</Text>
            <Text style={styles.cellData}>{formatFecha(data.practica.startDate)}</Text>
          </View>
          <View style={[styles.gridCell, { width: '25%' }]}>
            <Text style={styles.cellHeader}>FECHA DE CULMINACIÓN DE LA PP:</Text>
            <Text style={styles.cellData}>{formatFecha(data.practica.endDate)}</Text>
          </View>
        </View>
      </View>

      {/* Tabla de Ponderaciones */}
      <View style={styles.tableFinal}>
        <View style={[styles.tRowFinal, { backgroundColor: '#D9D9D9' }]}>
          <Text style={[styles.colA, { textAlign: 'center', fontWeight: 'bold' }]}>Evaluación del ( de la ) Estudiante</Text>
          <Text style={[styles.colB, { fontWeight: 'bold' }]}>Valor Porcentual</Text>
          <Text style={[styles.colC, { fontWeight: 'bold' }]}>Calificación Parcial Escala del 1 al 20</Text>
          <Text style={[styles.colD, { fontWeight: 'bold' }]}>Calificación Parcial Proporcional al Porcentaje</Text>
        </View>

        <View style={styles.tRowFinal}>
          <Text style={styles.colA}>A. Por parte del (de la) Tutor (a) Institucional.</Text>
          <Text style={styles.colB}>{weightToPercent(evaluacionFinal.weights.institucional)} %</Text>
          <Text style={styles.colC}>{evaluacionFinal.parciales.institucional?.toFixed(2) || ''}</Text>
          <Text style={styles.colD}>
            {evaluacionFinal.parciales.institucional !== null ? calcProp(evaluacionFinal.parciales.institucional, evaluacionFinal.weights.institucional) : ''}
          </Text>
        </View>
        <View style={styles.tRowFinal}>
          <Text style={styles.colA}>B. Por parte del (dela) Tutor (a) Académico</Text>
          <Text style={styles.colB}>{weightToPercent(evaluacionFinal.weights.academico)} %</Text>
          <Text style={styles.colC}>{evaluacionFinal.parciales.academico?.toFixed(2) || ''}</Text>
          <Text style={styles.colD}>
            {evaluacionFinal.parciales.academico !== null ? calcProp(evaluacionFinal.parciales.academico, evaluacionFinal.weights.academico) : ''}
          </Text>
        </View>
        <View style={styles.tRowFinal}>
          <Text style={styles.colA}>C. Por parte del Comité Evaluador</Text>
          <Text style={styles.colB}>{weightToPercent(evaluacionFinal.weights.comite)} %</Text>
          <Text style={styles.colC}>{evaluacionFinal.parciales.comite?.toFixed(2) || ''}</Text>
          <Text style={styles.colD}>
            {evaluacionFinal.parciales.comite !== null ? calcProp(evaluacionFinal.parciales.comite, evaluacionFinal.weights.comite) : ''}
          </Text>
        </View>

        {/* Fila de Sub Total */}
        <View style={styles.tRowFinal}>
          <View style={styles.colMergedLeft} />
          <Text style={[styles.colC, { textAlign: 'right' }]}>Sub Total</Text>
          <Text style={styles.colD}>
            {calcSubTotal(evaluacionFinal.parciales, evaluacionFinal.weights)}
          </Text>
        </View>

        {/* Fila de Calificación Final */}
        <View style={[styles.tRowFinal, { borderBottomWidth: 0 }]}>
          <View style={styles.colMergedLeft} />
          <Text style={[styles.colC, { textAlign: 'right' }]}>Calificación final:</Text>
          <Text style={styles.colD}>
            {evaluacionFinal.notaFinal.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Bloque de Firmas (Patrón 1-2-1-1) */}
      <View style={{ marginTop: 20 }}>
        <View style={styles.firmaRowCenter}>
          <View style={styles.firmaLineFinal} />
          <Text style={styles.firmaNameFinal}>{textos.firma1Nombre || ''}</Text>
          <Text style={styles.firmaRoleFinal}>{textos.firma1Cargo || 'JEFA DEL EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES'}</Text>
        </View>

        <View style={styles.firmaRowSplit}>
          <View style={styles.firmaBoxFinal}>
            <View style={styles.firmaLineFinal} />
            <Text style={styles.firmaNameFinal}>{textos.firma3Nombre || ''}</Text>
            <Text style={styles.firmaRoleFinal}>{textos.firma3Cargo || 'JEFA DEL ÁREA ACADÉMICA'}</Text>
          </View>
          <View style={styles.firmaBoxFinal}>
            <View style={styles.firmaLineFinal} />
            <Text style={styles.firmaNameFinal}>{textos.firma2Nombre || ''}</Text>
            <Text style={styles.firmaRoleFinal}>{textos.firma2Cargo || 'JEFE DEL ÁREA DE SECRETARIA'}</Text>
          </View>
        </View>

        <View style={styles.firmaRowCenter}>
          <View style={styles.firmaLineFinal} />
          <Text style={styles.firmaNameFinal}>{textos.firma4Nombre || ''}</Text>
          <Text style={styles.firmaRoleFinal}>{textos.firma4Cargo || 'JEFA DE LA UNIDAD DE GESTIÓN EDUCATIVA'}</Text>
        </View>

        <View style={styles.firmaRowCenter}>
          <View style={styles.firmaLineFinal} />
          <Text style={styles.firmaNameFinal}>{textos.firma5Nombre || ''}</Text>
          <Text style={styles.firmaRoleFinal}>{textos.firma5Cargo || 'DECANA DEL NÚCLEO'}</Text>
        </View>
      </View>
    </Page>
  );
}

/* ───────────────────────────────────────────
   Componente Principal
   ─────────────────────────────────────────── */
export function EvaluacionConsolidadaPDF({ data, textos }: Props) {
  return (
    <Document title="EVALUACIÓN CONSOLIDADA DE LA PRÁCTICA PROFESIONAL">
      <PageComite data={data} textos={textos} />
      <PageTutorAcademico data={data} textos={textos} />
      <PageTutorInstitucional data={data} textos={textos} />
      <PageEvaluacionFinal data={data} textos={textos} />
    </Document>
  );
}
