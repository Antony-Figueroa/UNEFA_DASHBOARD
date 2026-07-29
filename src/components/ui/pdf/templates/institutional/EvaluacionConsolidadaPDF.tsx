import { Text, View, StyleSheet, Document, Page, Image } from '@react-pdf/renderer';
import { formatNombreCompleto, formatCI, formatFecha, parseCI } from '@/features/reports/utils/reportFormatters';

/** Formato de fecha: "03 - 07 - 2026" (con espacios alrededor de guiones) */
function formatFechaPDF(fecha: string | null): string {
  if (!fecha) return '';
  const date = new Date(fecha);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day} - ${month} - ${year}`;
}

/** CI sin prefijo: solo número con puntos (ej: "30.965.856") */
function formatCINumero(ci: string | null | undefined): string {
  if (!ci) return '';
  const { number } = parseCI(ci);
  const parts = [];
  for (let i = number.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) parts.unshift('.');
    parts.unshift(number[i]);
  }
  return parts.join('');
}

/** Nombre con apellidos primero: "RODRÍGUEZ LÓPEZ ELEIDIMAR ANYELIZ" */
function formatApellidoNombre(persona: { primerNombre?: string | null; segundoNombre?: string | null; primerApellido?: string | null; segundoApellido?: string | null; nombreCompleto?: string } | null | undefined): string {
  if (!persona) return '';
  // ponytail: fallback cuando el tutor no está en t_professional_practices_tutor
  if (persona.nombreCompleto) return persona.nombreCompleto;
  const primerNombre = persona.primerNombre || '';
  const segundoNombre = persona.segundoNombre ? ` ${persona.segundoNombre}` : '';
  const primerApellido = persona.primerApellido || '';
  const segundoApellido = persona.segundoApellido ? ` ${persona.segundoApellido}` : '';
  return `${primerApellido}${segundoApellido} ${primerNombre}${segundoNombre}`.trim();
}

/* ───────────────────────────────────────────
   Estilos Exactos del Documento
   ─────────────────────────────────────────── */
const styles = StyleSheet.create({
  page: {
    paddingTop: 16,
    paddingBottom: 1,
    paddingHorizontal: 30,
    fontFamily: 'Times-Roman',
    fontSize: 10,
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
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 1.3,
    fontFamily: 'Times-Bold',
  },
  title: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Times-Bold',
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Times-Bold',
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
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: '#000',
    backgroundColor: '#D9D9D9',
    fontSize: 10,
  },
  infoCellData: {
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontSize: 10,
  },
  infoCellDataLast: {
    padding: 3,
    fontSize: 10,
  },
  infoText: {
    fontSize: 10,
    textAlign: 'justify',
  },
  infoTextLabel: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    textAlign: 'justify',
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
  },
  tRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tRowLast: {
    flexDirection: 'row',
  },
  tRowLastCriteria: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  colNumCell: { width: '4%', borderRightWidth: 1, borderColor: '#000', padding: 3, justifyContent: 'center' },
  colNum: { textAlign: 'center', fontSize: 10, fontFamily: 'Times-Bold' },
  colAspect: { width: '62%', borderRightWidth: 1, borderColor: '#000', padding: 3, fontSize: 10, textAlign: 'justify' },
  colRangeCell: { width: '16%', borderRightWidth: 1, borderColor: '#000', padding: 3, justifyContent: 'center' },
  colRange: { textAlign: 'center', fontSize: 10, fontFamily: 'Times-Bold' },
  colScoreCell: { width: '18%', padding: 3, justifyContent: 'center' },
  colScore: { textAlign: 'center', fontSize: 10, fontFamily: 'Times-Bold' },
  colNumH: { width: '4%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'Times-Bold' },
  colAspectH: { width: '62%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'Times-Bold' },
  colRangeH: { width: '16%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'Times-Bold' },
  colScoreH: { width: '18%', padding: 3, textAlign: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'Times-Bold' },

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
    borderRightWidth: 1,
    borderColor: '#000',
    fontSize: 10,
    fontFamily: 'Times-Bold',
  },
  subtotalValue: {
    width: '16%',
    textAlign: 'center',
    padding: 3,
    fontSize: 10,
  },
  totalCalcRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#000',
  },
  totalCalcLabel: {
    width: '84%',
    textAlign: 'right',
    padding: 3,
    borderRightWidth: 1,
    borderColor: '#000',
    fontSize: 10,
    paddingRight: 6,
  },
  totalCalcValue: {
    width: '16%',
    textAlign: 'center',
    padding: 3,
    fontSize: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 45,
    fontSize: 10,
    fontFamily: 'Times-Roman',
  },

  // Signatures
  firmaContainer3: { flexDirection: 'row', justifyContent: 'space-between' },
  firmaContainer1: { alignItems: 'center' },
  firmaBox: { alignItems: 'center', width: '30%' },
  firmaBoxWide: { alignItems: 'center', width: '40%' },
  firmaLine: { width: '100%', borderBottomWidth: 1, borderColor: '#000', marginBottom: 3 },
  firmaName: { fontSize: 10, textAlign: 'center', marginBottom: 1 },
  firmaRole: { fontSize: 10, textAlign: 'center' },

  // Final signature grid
  firmaFinalContainer: { marginTop: 14 },
  firmaFinalCol: { alignItems: 'center', width: '48%' },
  firmaFinalSingle: { alignItems: 'center', width: '48%', alignSelf: 'center', marginTop: 12 },
  firmaFinalName: { fontSize: 10, textAlign: 'center' },
  firmaFinalRole: { fontSize: 10, textAlign: 'center' },
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
    fontSize: 10,
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
  colA: { width: '45%', borderRightWidth: 1, borderColor: '#000', padding: 5, fontSize: 10, justifyContent: 'center' },
  colB: { width: '15%', borderRightWidth: 1, borderColor: '#000', padding: 5, fontSize: 10, textAlign: 'center', justifyContent: 'center' },
  colC: { width: '20%', borderRightWidth: 1, borderColor: '#000', padding: 5, fontSize: 10, textAlign: 'center', justifyContent: 'center' },
  colD: { width: '20%', padding: 5, fontSize: 10, textAlign: 'center', justifyContent: 'center' },

  colMergedLeft: { width: '60%', borderRightWidth: 1, borderColor: '#000', padding: 5 },

  // Firmas Página 4
  firmaRowCenter: { alignItems: 'center', marginBottom: 40 },
  firmaRowSplit: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  firmaBoxFinal: { alignItems: 'center', width: '45%' },
  firmaLineFinal: { width: 220, borderBottomWidth: 1, borderColor: '#000', marginBottom: 4 },
  firmaNameFinal: { fontSize: 10, textAlign: 'center' },
  firmaRoleFinal: { fontSize: 10, textAlign: 'center' },
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
    practiceTypeName: string;
    hasMultiplePracticeTypes: boolean;
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
  return formatScore((parcial * weightToPercent(weight)) / 100);
}

function calcSubTotal(parciales: any, weights: any): string {
  let total = 0;
  if (parciales.institucional !== null) total += (parciales.institucional * weightToPercent(weights.institucional)) / 100;
  if (parciales.academico !== null) total += (parciales.academico * weightToPercent(weights.academico)) / 100;
  if (parciales.comite !== null) total += (parciales.comite * weightToPercent(weights.comite)) / 100;
  return formatScore(total);
}

function formatTutorCompleto(tutor: any): string {
  if (!tutor) return 'No asignado';
  const title = tutor.titulo ? `${tutor.titulo}. ` : '';
  return `${title}${formatApellidoNombre(tutor)}`.toUpperCase();
}

function formatTutorNombre(tutor: any): string {
  if (!tutor) return 'No asignado';
  return formatApellidoNombre(tutor).toUpperCase();
}

function getCarreraOrPasantiaLabel(data: Props['data']): string {
  if (data.hasMultiplePracticeTypes && data.practiceTypeName) {
    return `PASANTÍA ${data.practiceTypeName.toUpperCase()}`;
  }
  return data.carrera.nombre.toUpperCase();
}

function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (Number.isInteger(value)) return value.toString();
  // ponytail: coma como separador decimal (formato venezolano)
  return value.toFixed(2).replace('.', ',');
}



/* ───────────────────────────────────────────
   Footer de página (número de página)
   ─────────────────────────────────────────── */
const PageNumberFooter = () => (
  <Text style={styles.pageNumber} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Página ${pageNumber} de ${totalPages}`} fixed />
);

/* ───────────────────────────────────────────
   Encabezado reusable con Escudo + Logo
   ─────────────────────────────────────────── */
const MembreteImagen = ({ isPracticas = false }) => (
  <View style={styles.headerRow}>
    <Image src="/escudo-2.jpg" style={styles.headerImg} />
    <View style={styles.headerTextCol}>
      <Text style={styles.headerText}>REPÚBLICA BOLIVARIANA DE VENEZUELA</Text>
      <Text style={styles.headerText}>MINISTERIO DEL PODER POPULAR PARA LA DEFENSA</Text>
      <Text style={styles.headerText}>UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA</Text>
      <Text style={styles.headerText}>DE LA FUERZA ARMADA NACIONAL BOLIVARIANA</Text>
      <Text style={styles.headerText}>VICERRECTORADO DE LA REGIÓN LOS LLANOS</Text>
      <Text style={styles.headerText}>NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA</Text>
      <Text style={styles.headerText}>EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES</Text>
    </View>
    <Image src="/pdfs-docs/logo.png" style={styles.headerImg} />
  </View>
);

/* ───────────────────────────────────────────
   Encabezado Específico para Página 4 (Evaluación Final)
   ─────────────────────────────────────────── */
const HeaderFinal = () => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
    <Image src="/escudo-2.jpg" style={{ width: 60, height: 60, objectFit: 'contain' }} />
    <View style={{ flex: 1, textAlign: 'center', paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 10, lineHeight: 1.2, fontFamily: 'Times-Bold' }}>REPÚBLICA BOLIVARIANA DE VENEZUELA</Text>
      <Text style={{ fontSize: 10, lineHeight: 1.2, fontFamily: 'Times-Bold' }}>MINISTERIO DEL PODER POPULAR PARA LA DEFENSA</Text>
      <Text style={{ fontSize: 10, lineHeight: 1.2, fontFamily: 'Times-Bold' }}>UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA</Text>
      <Text style={{ fontSize: 10, lineHeight: 1.2, fontFamily: 'Times-Bold' }}>DE LA FUERZA ARMADA NACIONAL BOLIVARIANA</Text>
      <Text style={{ fontSize: 10, lineHeight: 1.2, fontFamily: 'Times-Bold' }}>VICERRECTORADO DE LA REGIÓN LOS LLANOS</Text>
      <Text style={{ fontSize: 10, lineHeight: 1.2, fontFamily: 'Times-Bold' }}>NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA</Text>
      <Text style={{ fontSize: 10, lineHeight: 1.2, fontFamily: 'Times-Bold' }}>EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES</Text>
    </View>
    <Image src="/pdfs-docs/logo.png" style={{ width: 60, height: 60, objectFit: 'contain' }} />
  </View>
);

/* ───────────────────────────────────────────
   Página 1: COMITÉ EVALUADOR
   ─────────────────────────────────────────── */
const TOTAL_COMITE = 15;

function PageComite({ data, textos, comiteIndex = 0 }: Props & { comiteIndex?: number }) {
  const comiteEval = data.evaluacionesComite?.[comiteIndex];
  const criterios = comiteEval?.criterios || [];
  const subtotal = criterios.reduce((acc, c) => acc + (c.score || 0), 0);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.pageBody}>
        <View>
          <MembreteImagen />
          <Text style={styles.title}>EVALUACIÓN DEL DESEMPEÑO DEL ESTUDIANTE</Text>
          <Text style={styles.subtitle}>COMITÉ EVALUADOR</Text>

          {/* Datos del estudiante — 1 fila con 4 celdas */}
          <View style={styles.infoBox}>
            <View style={styles.infoRowLast}>
              <View style={[styles.infoCellData, { width: '35%' }]}>
                <Text style={styles.infoTextLabel}>Apellidos y Nombres del Estudiante:</Text>
                <Text style={styles.infoText}>{formatApellidoNombre(data.estudiante).toUpperCase()}</Text>
              </View>
              <View style={[styles.infoCellData, { width: '20%' }]}>
                <Text style={styles.infoTextLabel}>Cédula de identidad del Estudiante:</Text>
                <Text style={styles.infoText}>{formatCINumero(data.estudiante.ci)}</Text>
              </View>
              <View style={[styles.infoCellData, { width: '25%' }]}>
                <Text style={styles.infoTextLabel}>Carrera que cursa:</Text>
                <Text style={styles.infoText}>{getCarreraOrPasantiaLabel(data)}</Text>
              </View>
              <View style={[styles.infoCellDataLast, { width: '20%' }]}>
                <Text style={styles.infoTextLabel}>Período: </Text>
                <Text style={styles.infoText}>{data.periodo?.description}</Text>
              </View>
            </View>
          </View>

          {/* Comité Evaluador */}
          <View style={styles.infoBox}>
            <View style={[styles.infoRow, { backgroundColor: '#D9D9D9' }]}>
              <Text style={[styles.infoCellHeader, { width: '36%', textAlign: 'center', borderRightWidth: 1 }]}>Comité Evaluador</Text>
              <Text style={[styles.infoCellHeader, { width: '44%', textAlign: 'center', borderRightWidth: 1 }]}>Apellidos y Nombres</Text>
              <Text style={[styles.infoCellHeader, { width: '20%', textAlign: 'center' }]}>Cédula de Identidad</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoCellData, { width: '36%' }]}>Coordinador de Práctica Profesional</Text>
              <Text style={[styles.infoCellData, { width: '44%' }]}>{data.coordinadorPP?.nombreCompleto.toUpperCase() || ''}</Text>
              <Text style={[styles.infoCellDataLast, { width: '20%', textAlign: 'center' }]}>{data.coordinadorPP ? formatCINumero(data.coordinadorPP.ci) : ''}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoCellData, { width: '36%' }]}>Coordinador de Carrera</Text>
              <Text style={[styles.infoCellData, { width: '44%' }]}>{data.coordinadorCarrera?.nombreCompleto.toUpperCase() || ''}</Text>
              <Text style={[styles.infoCellDataLast, { width: '20%', textAlign: 'center' }]}>{data.coordinadorCarrera ? formatCINumero(data.coordinadorCarrera.ci) : ''}</Text>
            </View>
            <View style={styles.infoRowLast}>
              <Text style={[styles.infoCellData, { width: '36%' }]}>Tutor Académico</Text>
              <Text style={[styles.infoCellData, { width: '44%' }]}>{formatTutorNombre(data.tutorAcademico)}</Text>
              <Text style={[styles.infoCellDataLast, { width: '20%', textAlign: 'center' }]}>{data.tutorAcademico ? formatCINumero(data.tutorAcademico.ci) : ''}</Text>
            </View>
          </View>

          {/* Tabla de criterios */}
          <View style={styles.table}>
            <View style={styles.tHeader}>
              <Text style={styles.colNumH}>Nº Ítems</Text>
              <Text style={styles.colAspectH}>Aspecto a evaluar</Text>
              <Text style={styles.colRangeH}>Intervalo de Ponderación</Text>
              <Text style={styles.colScoreH}>Calificación Parcial</Text>
            </View>
            {criterios.map((c, idx) => (
              <View style={idx === criterios.length - 1 ? styles.tRowLastCriteria : styles.tRow} key={c.itemNumber}>
                <View style={styles.colNumCell}><Text style={styles.colNum}>{c.itemNumber}</Text></View>
                <Text style={styles.colAspect}>{c.description}</Text>
                <View style={styles.colRangeCell}><Text style={styles.colRange}>0-20</Text></View>
                <View style={styles.colScoreCell}><Text style={styles.colScore}>{formatScore(c.score)}</Text></View>
              </View>
            ))}
            <View style={styles.tRowLast}>
              <Text style={[styles.subtotalLabel]}>Subtotal</Text>
              <Text style={[styles.subtotalValue, { borderBottomWidth: 1, borderColor: '#000' }]}>{formatScore(subtotal)}</Text>
            </View>
            <View style={styles.tRowLast}>
              <Text style={[styles.subtotalLabel]}>Calificación final = (Subtotal / {TOTAL_COMITE}):</Text>
              <Text style={[styles.subtotalValue]}>{formatScore(subtotal / TOTAL_COMITE)}</Text>
            </View>
          </View>
        </View>

        {/* Firmas al fondo — PP (izq), Coordinador de Carrera (der), Tutor Académico (centro abajo) */}
        <View>
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
          </View>
          <View style={[styles.firmaContainer1, { marginTop: 15 }]}>
            <View style={styles.firmaBox}>
              {textos.comiteFirma3Nombre ? <Text style={styles.firmaName}>{textos.comiteFirma3Nombre}</Text> : null}
              <View style={styles.firmaLine} />
              <Text style={styles.firmaRole}>Tutor Académico</Text>
            </View>
          </View>
        </View>
      </View>
      <PageNumberFooter />
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

          {/* Info box — 2 filas */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <View style={[styles.infoCellData, { width: '40%' }]}>
                <Text style={styles.infoTextLabel}>Apellidos y Nombres del Estudiante:</Text>
                <Text style={styles.infoText}>{formatApellidoNombre(data.estudiante).toUpperCase()}</Text>
              </View>
              <View style={[styles.infoCellData, { width: '25%' }]}>
                <Text style={styles.infoTextLabel}>Cédula de Identidad del Estudiante:</Text>
                <Text style={styles.infoText}>{formatCINumero(data.estudiante.ci)}</Text>
              </View>
              <View style={[styles.infoCellDataLast, { width: '35%' }]}>
                <Text style={styles.infoTextLabel}>Carrera que cursa:</Text>
                <Text style={styles.infoText}>{getCarreraOrPasantiaLabel(data)}</Text>
              </View>
            </View>
            <View style={styles.infoRowLast}>
              <View style={[styles.infoCellData, { width: '35%' }]}>
                <Text style={styles.infoTextLabel}>Apellidos y Nombres del Tutor Académico:</Text>
                <Text style={styles.infoText}>{formatTutorNombre(data.tutorAcademico)}</Text>
              </View>
              <View style={[styles.infoCellData, { width: '22%' }]}>
                <Text style={styles.infoTextLabel}>Cédula de identidad del Tutor Académico:</Text>
                <Text style={styles.infoText}>{data.tutorAcademico ? formatCINumero(data.tutorAcademico.ci) : ''}</Text>
              </View>
              <View style={[styles.infoCellData, { width: '22%' }]}>
                <Text style={styles.infoTextLabel}>Fecha de Inicio de la PP:</Text>
                <Text style={styles.infoText}>{formatFechaPDF(data.practica?.startDate)}</Text>
              </View>
              <View style={[styles.infoCellDataLast, { width: '21%' }]}>
                <Text style={styles.infoTextLabel}>Fecha de Culminación de la PP:</Text>
                <Text style={styles.infoText}>{formatFechaPDF(data.practica?.endDate)}</Text>
              </View>
            </View>
          </View>

          {/* Tabla de criterios */}
          <View style={styles.table}>
            <View style={styles.tHeader}>
              <Text style={styles.colNumH}>Nº Ítems</Text>
              <Text style={styles.colAspectH}>Aspecto Evaluado</Text>
              <Text style={styles.colRangeH}>Intervalo de Ponderación</Text>
              <Text style={styles.colScoreH}>Calificación Parcial</Text>
            </View>
            {criterios.map((c, idx) => (
              <View style={idx === criterios.length - 1 ? styles.tRowLastCriteria : styles.tRow} key={c.itemNumber}>
                <View style={styles.colNumCell}><Text style={styles.colNum}>{c.itemNumber}</Text></View>
                <Text style={styles.colAspect}>{c.description}</Text>
                <View style={styles.colRangeCell}><Text style={styles.colRange}>0-20</Text></View>
                <View style={styles.colScoreCell}><Text style={styles.colScore}>{formatScore(c.score)}</Text></View>
              </View>
            ))}
            <View style={styles.tRowLast}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={[styles.subtotalValue, { borderBottomWidth: 1, borderColor: '#000' }]}>{formatScore(subtotal)}</Text>
            </View>
            <View style={styles.tRowLast}>
              <Text style={styles.subtotalLabel}>Calificación final = (Subtotal / {TOTAL_ACADEMICO}):</Text>
              <Text style={[styles.subtotalValue]}>{formatScore(subtotal / TOTAL_ACADEMICO)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.firmaContainer1}>
          {textos.academicoFirmaNombre ? <Text style={styles.firmaName}>{textos.academicoFirmaNombre}</Text> : null}
          <View style={{ alignItems: 'center', width: '40%' }}>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaRole}>Tutor Académico</Text>
          </View>
        </View>
      </View>
      <PageNumberFooter />
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

      {/* Info box — estructura exacta del documento oficial */}
      <View style={styles.infoBox}>
        {/* Fila 1: 4 celdas — Estudiante, CI, Período, Carrera */}
        <View style={styles.infoRow}>
          <View style={[styles.infoCellData, { width: '28%' }]}>
            <Text style={styles.infoTextLabel}>Apellidos y Nombres del Estudiante:</Text>
            <Text style={styles.infoText}>{formatApellidoNombre(data.estudiante).toUpperCase()}</Text>
          </View>
          <View style={[styles.infoCellData, { width: '22%' }]}>
            <Text style={styles.infoTextLabel}>Cédula de Identidad del Estudiante:</Text>
            <Text style={styles.infoText}>{formatCINumero(data.estudiante.ci)}</Text>
          </View>
          <View style={[styles.infoCellData, { width: '17%' }]}>
            <Text style={styles.infoTextLabel}>Período: </Text>
            <Text style={styles.infoText}>{data.periodo?.description}</Text>
          </View>
          <View style={[styles.infoCellDataLast, { width: '33%' }]}>
            <Text style={styles.infoTextLabel}>Carrera que cursa:</Text>
            <Text style={styles.infoText}>{getCarreraOrPasantiaLabel(data)}</Text>
          </View>
        </View>
        {/* Fila 2: 3 celdas — Institución | Departamento+Tutor | Fechas */}
        <View style={styles.infoRowLast}>
          {/* Celda izquierda: Institución */}
          <View style={[styles.infoCellData, { width: '28%' }]}>
            <Text style={styles.infoTextLabel}>Nombre de la Institución:</Text>
            <Text style={styles.infoText}>{data.institucion?.nombre?.toUpperCase()}</Text>
          </View>
          {/* Celda central: Departamento + Tutor (apilados) */}
          <View style={[styles.infoCellData, { width: '43%' }]}>
            <Text style={styles.infoTextLabel}>Departamento donde se efectuó la Práctica Profesional:</Text>
            <Text style={styles.infoText}>{data.department?.toUpperCase() || ''}</Text>
            <Text style={[styles.infoTextLabel, { marginTop: 4 }]}>Apellidos y Nombres del Tutor(a) institucional:</Text>
            <Text style={styles.infoText}>{formatTutorNombre(data.tutorInstitucional)}</Text>
            <Text style={[styles.infoTextLabel, { marginTop: 4 }]}>C.I. del Tutor(a) Institucional: </Text>
            <Text style={styles.infoText}>{data.tutorInstitucional ? formatCINumero(data.tutorInstitucional.ci) : ''}</Text>
          </View>
          {/* Celda derecha: Fechas (apiladas) */}
          <View style={[styles.infoCellDataLast, { width: '29%' }]}>
            <Text style={styles.infoTextLabel}>Fecha de Inicio de la PP:</Text>
            <Text style={styles.infoText}>{formatFechaPDF(data.practica?.startDate)}</Text>
            <Text style={[styles.infoTextLabel, { marginTop: 4 }]}>Fecha de Culminación de la PP:</Text>
            <Text style={styles.infoText}>{formatFechaPDF(data.practica?.endDate)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tHeader}>
          <Text style={[styles.colNumH, { width: '4%' }]}>Nº Ítems</Text>
          <Text style={[styles.colAspectH, { width: '62%' }]}>Aspecto evaluado</Text>
          <Text style={[styles.colRangeH, { width: '16%' }]}>Intervalo de Ponderación</Text>
          <Text style={[styles.colScoreH, { width: '18%' }]}>Calificación Parcial</Text>
        </View>
        {criterios.map((c, idx) => (
          <View style={idx === criterios.length - 1 ? styles.tRowLastCriteria : styles.tRow} key={c.itemNumber}>
            <View style={[styles.colNumCell, { width: '4%' }]}><Text style={styles.colNum}>{c.itemNumber}</Text></View>
            <Text style={[styles.colAspect, { width: '62%' }]}>{c.description}</Text>
            <View style={[styles.colRangeCell, { width: '16%' }]}><Text style={styles.colRange}>0-20</Text></View>
            <View style={[styles.colScoreCell, { width: '18%' }]}><Text style={styles.colScore}>{formatScore(c.score)}</Text></View>
          </View>
        ))}
        <View style={styles.tRowLast}>
          <Text style={[styles.subtotalLabel, { width: '84%' }]}>Subtotal</Text>
          <Text style={[styles.subtotalValue, { width: '16%', borderBottomWidth: 1, borderColor: '#000' }]}>{formatScore(subtotal)}</Text>
        </View>
        <View style={styles.tRowLast}>
          <Text style={[styles.subtotalLabel, { width: '84%' }]}>Calificación final = (Subtotal / {TOTAL_INSTITUCIONAL}):</Text>
          <Text style={[styles.subtotalValue, { width: '16%' }]}>{formatScore(subtotal / TOTAL_INSTITUCIONAL)}</Text>
        </View>
      </View>

      {/* Firma del Tutor(a) Institucional con espacio superior */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 25 }}>
        <View style={{ alignItems: 'center', width: '40%' }}>
          {textos.institucionalFirmaNombre ? <Text style={styles.firmaName}>{textos.institucionalFirmaNombre}</Text> : null}
          <View style={styles.firmaLine} />
          <Text style={styles.firmaRole}>Tutor(a) Institucional</Text>
        </View>
        <View style={{ alignItems: 'center', width: '30%' }}>
          <Text style={{ fontSize: 10, marginBottom: 4 }}>Sello de la Empresa:</Text>
          <View style={{ width: 90, height: 50 }} />
        </View>
      </View>
      <PageNumberFooter />
    </Page>
  );
}

/* ───────────────────────────────────────────
   Página 4: EVALUACIÓN FINAL
   ─────────────────────────────────────────── */
function PageEvaluacionFinal({ data, textos }: Props) {
  const { evaluacionFinal } = data;
  const subtitleLabel = data.carrera.nombre.toUpperCase();

  return (
    <Page size="A4" style={[styles.page, { fontFamily: 'Times-Bold' }]}>
      <HeaderFinal />
      <Text style={[styles.title, { marginBottom: 2 }]}>EVALUACIÓN FINAL DE LA PRÁCTICA PROFESIONAL:</Text>
      <Text style={[styles.subtitle, { marginBottom: 15 }]}>{subtitleLabel}</Text>

      {/* Cuadrícula de Información */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={[styles.gridCell, { width: '60%', borderRightWidth: 1, borderColor: '#000' }]}>
            <Text style={[styles.cellHeader, { fontFamily: 'Times-Bold' }]}>Apellidos y nombres del estudiante:</Text>
            <Text style={styles.cellData}>{formatApellidoNombre(data.estudiante).toUpperCase()}</Text>
          </View>
          <View style={[styles.gridCell, { width: '40%' }]}>
            <Text style={[styles.cellHeader, { fontFamily: 'Times-Bold' }]}>Cédula de identidad del estudiante:</Text>
            <Text style={styles.cellData}>{formatCINumero(data.estudiante.ci)}</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={[styles.gridCell, { width: '100%' }]}>
            <Text style={[styles.cellHeader, { fontFamily: 'Times-Bold' }]}>Carrera que cursa:</Text>
            <Text style={styles.cellData}>{getCarreraOrPasantiaLabel(data)}</Text>
          </View>
        </View>
        <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.gridCell, { width: '50%', borderRightWidth: 1, borderColor: '#000' }]}>
            <Text style={[styles.cellHeader, { fontFamily: 'Times-Bold' }]}>Nombre de la Institución donde realizó la Práctica Profesional:</Text>
            <Text style={styles.cellData}>{data.institucion?.nombre?.toUpperCase()}</Text>
          </View>
          <View style={[styles.gridCell, { width: '25%', borderRightWidth: 1, borderColor: '#000' }]}>
            <Text style={[styles.cellHeader, { fontFamily: 'Times-Bold' }]}>Fecha de inicio de la PP:</Text>
            <Text style={styles.cellData}>{formatFechaPDF(data.practica?.startDate)}</Text>
          </View>
          <View style={[styles.gridCell, { width: '25%' }]}>
            <Text style={[styles.cellHeader, { fontFamily: 'Times-Bold' }]}>Fecha de culminación de la PP:</Text>
            <Text style={styles.cellData}>{formatFechaPDF(data.practica?.endDate)}</Text>
          </View>
        </View>
      </View>

      {/* Tabla de Ponderaciones */}
      <View style={styles.tableFinal}>
        <View style={styles.tRowFinal}>
          <Text style={[styles.colA, { textAlign: 'center', fontFamily: 'Times-Bold' }]}>Evaluación del ( de la ) Estudiante</Text>
          <Text style={[styles.colB, { fontFamily: 'Times-Bold' }]}>Valor Porcentual</Text>
          <Text style={[styles.colC, { fontFamily: 'Times-Bold' }]}>Calificación Parcial Escala del 1 al 20</Text>
          <Text style={[styles.colD, { fontFamily: 'Times-Bold' }]}>Calificación Parcial Proporcional al Porcentaje</Text>
        </View>

        <View style={styles.tRowFinal}>
          <Text style={styles.colA}>A. Por parte del (de la) Tutor (a) Institucional.</Text>
          <Text style={styles.colB}>{weightToPercent(evaluacionFinal.weights.institucional)} %</Text>
          <Text style={styles.colC}>{formatScore(evaluacionFinal.parciales.institucional)}</Text>
          <Text style={styles.colD}>
            {evaluacionFinal.parciales.institucional !== null ? calcProp(evaluacionFinal.parciales.institucional, evaluacionFinal.weights.institucional) : ''}
          </Text>
        </View>
        <View style={styles.tRowFinal}>
          <Text style={styles.colA}>B. Por parte del (dela) Tutor (a) Académico</Text>
          <Text style={styles.colB}>{weightToPercent(evaluacionFinal.weights.academico)} %</Text>
          <Text style={styles.colC}>{formatScore(evaluacionFinal.parciales.academico)}</Text>
          <Text style={styles.colD}>
            {evaluacionFinal.parciales.academico !== null ? calcProp(evaluacionFinal.parciales.academico, evaluacionFinal.weights.academico) : ''}
          </Text>
        </View>
        <View style={styles.tRowFinal}>
          <Text style={styles.colA}>C. Por parte del Comité Evaluador</Text>
          <Text style={styles.colB}>{weightToPercent(evaluacionFinal.weights.comite)} %</Text>
          <Text style={styles.colC}>{formatScore(evaluacionFinal.parciales.comite)}</Text>
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
            {Math.round(evaluacionFinal.notaFinal)}
          </Text>
        </View>
      </View>

      {/* Bloque de Firmas (Patrón 1-2-1-1) */}
      <View style={{ marginTop: 20 }}>
        <View style={styles.firmaRowCenter}>
          <View style={styles.firmaLineFinal} />
          <Text style={styles.firmaNameFinal}>{textos.firma1Nombre || ''}</Text>
          <Text style={[styles.firmaRoleFinal, { fontFamily: 'Times-Bold' }]}>{textos.firma1Cargo || 'EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES'}</Text>
        </View>

        <View style={styles.firmaRowSplit}>
          <View style={styles.firmaBoxFinal}>
            <View style={styles.firmaLineFinal} />
            <Text style={styles.firmaNameFinal}>{textos.firma2Nombre || ''}</Text>
            <Text style={[styles.firmaRoleFinal, { fontFamily: 'Times-Bold' }]}>{textos.firma2Cargo || 'JEFE DEL ÁREA DE SECRETARÍA'}</Text>
          </View>
          <View style={styles.firmaBoxFinal}>
            <View style={styles.firmaLineFinal} />
            <Text style={styles.firmaNameFinal}>{textos.firma3Nombre || ''}</Text>
            <Text style={[styles.firmaRoleFinal, { fontFamily: 'Times-Bold' }]}>{textos.firma3Cargo || 'JEFA DEL ÁREA ACADÉMICA'}</Text>
          </View>
        </View>

        <View style={styles.firmaRowCenter}>
          <View style={styles.firmaLineFinal} />
          <Text style={styles.firmaNameFinal}>{textos.firma4Nombre || ''}</Text>
          <Text style={[styles.firmaRoleFinal, { fontFamily: 'Times-Bold' }]}>{textos.firma4Cargo || 'JEFA DE LA UNIDAD DE GESTIÓN EDUCATIVA'}</Text>
        </View>

        <View style={styles.firmaRowCenter}>
          <View style={styles.firmaLineFinal} />
          <Text style={styles.firmaNameFinal}>{textos.firma5Nombre || ''}</Text>
          <Text style={[styles.firmaRoleFinal, { fontFamily: 'Times-Bold' }]}>{textos.firma5Cargo || 'DECANA DEL NÚCLEO'}</Text>
        </View>
      </View>
      <PageNumberFooter />
    </Page>
  );
}

/* ───────────────────────────────────────────
   Componente Principal
   ─────────────────────────────────────────── */
export function EvaluacionConsolidadaPDF({ data, textos }: Props) {
  // Generar una página por cada miembro del comité evaluador
  const committeePages = (data.evaluacionesComite || []).map((_, idx) => (
    <PageComite key={`comite-${idx}`} data={data} textos={textos} comiteIndex={idx} />
  ));

  return (
    <Document title="EVALUACIÓN CONSOLIDADA DE LA PRÁCTICA PROFESIONAL">
      <PageTutorInstitucional data={data} textos={textos} />
      <PageTutorAcademico data={data} textos={textos} />
      {committeePages}
      <PageEvaluacionFinal data={data} textos={textos} />
    </Document>
  );
}
