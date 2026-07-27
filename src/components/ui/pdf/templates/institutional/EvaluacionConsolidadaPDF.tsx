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
    fontFamily: 'Times-Roman',
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
    backgroundColor: '#f2f2f2',
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
  colNumH: { width: '6%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center', fontSize: 8, fontFamily: 'Times-Bold' },
  colAspectH: { width: '62%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center', fontSize: 8, fontFamily: 'Times-Bold' },
  colRangeH: { width: '16%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center', fontSize: 8, fontFamily: 'Times-Bold' },
  colScoreH: { width: '16%', padding: 3, textAlign: 'center', fontSize: 8, fontFamily: 'Times-Bold' },

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
    fontSize: 8,
  },
  subtotalValue: {
    width: '16%',
    textAlign: 'center',
    padding: 3,
    fontSize: 8,
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
    fontSize: 8,
    paddingRight: 6,
  },
  totalCalcValue: {
    width: '16%',
    textAlign: 'center',
    padding: 3,
    fontSize: 8,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 45,
    fontSize: 8,
    fontFamily: 'Times-Roman',
  },

  // Signatures
  firmaContainer3: { flexDirection: 'row', justifyContent: 'space-between' },
  firmaContainer1: { alignItems: 'center' },
  firmaBox: { alignItems: 'center', width: '30%' },
  firmaBoxWide: { alignItems: 'center', width: '40%' },
  firmaLine: { width: '100%', borderBottomWidth: 1, borderColor: '#000', marginBottom: 3 },
  firmaName: { fontSize: 8, textAlign: 'center', marginBottom: 1 },
  firmaRole: { fontSize: 7.5, textAlign: 'center' },

  // Final signature grid
  firmaFinalContainer: { marginTop: 14 },
  firmaFinalCol: { alignItems: 'center', width: '48%' },
  firmaFinalSingle: { alignItems: 'center', width: '48%', alignSelf: 'center', marginTop: 12 },
  firmaFinalName: { fontSize: 8, textAlign: 'center' },
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
  firmaNameFinal: { fontSize: 9, textAlign: 'center' },
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
  return `${title}${formatNombreCompleto(tutor)}`.toUpperCase();
}

function formatTutorNombre(tutor: any): string {
  if (!tutor) return 'No asignado';
  return formatNombreCompleto(tutor).toUpperCase();
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
    <Image src="/pdfs-docs/escudo.png" style={styles.headerImg} />
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
    <Image src="/pdfs-docs/escudo.png" style={{ width: 60, height: 60, objectFit: 'contain' }} />
    <View style={{ flex: 1, textAlign: 'center', paddingHorizontal: 10 }}>
      <Text style={{ fontSize: 10, lineHeight: 1.2 }}>REPÚBLICA BOLIVARIANA DE VENEZUELA</Text>
      <Text style={{ fontSize: 10, lineHeight: 1.2 }}>MINISTERIO DEL PODER POPULAR PARA LA DEFENSA</Text>
      <Text style={{ fontSize: 10, lineHeight: 1.2 }}>UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA</Text>
      <Text style={{ fontSize: 10, lineHeight: 1.2 }}>DE LA FUERZA ARMADA NACIONAL BOLIVARIANA</Text>
      <Text style={{ fontSize: 10, lineHeight: 1.2 }}>VICERRECTORADO DE LA REGIÓN LOS LLANOS</Text>
      <Text style={{ fontSize: 10, lineHeight: 1.2 }}>NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA</Text>
      <Text style={{ fontSize: 10, lineHeight: 1.2 }}>EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES</Text>
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
                <Text style={{ fontSize: 7.5 }}>Apellidos y Nombres del Estudiante:</Text>
                <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{formatNombreCompleto(data.estudiante).toUpperCase()}</Text>
              </View>
              <View style={[styles.infoCellData, { width: '20%' }]}>
                <Text style={{ fontSize: 7.5 }}>Cédula de identidad del Estudiante:</Text>
                <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{formatCI(data.estudiante.ci)}</Text>
              </View>
              <View style={[styles.infoCellData, { width: '25%' }]}>
                <Text style={{ fontSize: 7.5 }}>Carrera:</Text>
                <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{getCarreraOrPasantiaLabel(data)}</Text>
              </View>
              <View style={[styles.infoCellDataLast, { width: '20%' }]}>
                <Text style={{ fontSize: 7.5 }}>Período Académico:</Text>
                <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{data.periodo?.description}</Text>
              </View>
            </View>
          </View>

          {/* Comité Evaluador */}
          <View style={styles.infoBox}>
            <View style={[styles.infoRow, { backgroundColor: '#f2f2f2' }]}>
              <Text style={[styles.infoCellHeader, { width: '36%', textAlign: 'center', borderRightWidth: 1 }]}>Comité Evaluador</Text>
              <Text style={[styles.infoCellHeader, { width: '44%', textAlign: 'center', borderRightWidth: 1 }]}>Apellidos y Nombres</Text>
              <Text style={[styles.infoCellHeader, { width: '20%', textAlign: 'center', borderRightWidth: 0 }]}>Cédula de Identidad</Text>
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
              <Text style={styles.colNumH}>Nº Ítems</Text>
              <Text style={styles.colAspectH}>Aspecto a evaluar</Text>
              <Text style={styles.colRangeH}>Intervalo de Ponderación</Text>
              <Text style={styles.colScoreH}>Calificación Parcial</Text>
            </View>
            {criterios.map((c, idx) => (
              <View style={idx === criterios.length - 1 ? styles.tRowLast : styles.tRow} key={c.itemNumber}>
                <Text style={styles.colNum}>{c.itemNumber}</Text>
                <Text style={styles.colAspect}>{c.description}</Text>
                <Text style={styles.colRange}>0 - 20</Text>
                <Text style={styles.colScore}>{formatScore(c.score)}</Text>
              </View>
            ))}
            <View style={styles.tRowLast}>
              <Text style={[styles.subtotalLabel]}>Subtotal ({TOTAL_COMITE})</Text>
              <Text style={[styles.subtotalValue]}>{formatScore(subtotal)}</Text>
            </View>
          </View>
          <Text style={{ textAlign: 'center', marginTop: 6, fontSize: 9, fontFamily: 'Times-Bold' }}>Calificación final = (Subtotal/{TOTAL_COMITE}): {formatScore(subtotal / TOTAL_COMITE)}</Text>
        </View>

        {/* Firmas al fondo — PP (izq), Tutor Académico (centro), Coordinador Carrera (der) */}
        <View style={styles.firmaContainer3}>
          <View style={styles.firmaBox}>
            {textos.comiteFirma1Nombre ? <Text style={styles.firmaName}>{textos.comiteFirma1Nombre}</Text> : null}
            <View style={styles.firmaLine} />
            <Text style={styles.firmaRole}>Coordinador de Práctica Profesional</Text>
          </View>
          <View style={styles.firmaBox}>
            {textos.comiteFirma3Nombre ? <Text style={styles.firmaName}>{textos.comiteFirma3Nombre}</Text> : null}
            <View style={styles.firmaLine} />
            <Text style={styles.firmaRole}>Tutor Académico</Text>
          </View>
          <View style={styles.firmaBox}>
            {textos.comiteFirma2Nombre ? <Text style={styles.firmaName}>{textos.comiteFirma2Nombre}</Text> : null}
            <View style={styles.firmaLine} />
            <Text style={styles.firmaRole}>Coordinador de Carrera</Text>
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
                <Text style={{ fontSize: 7.5 }}>Apellidos y Nombres del Estudiante:</Text>
                <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{formatNombreCompleto(data.estudiante).toUpperCase()}</Text>
              </View>
              <View style={[styles.infoCellData, { width: '25%' }]}>
                <Text style={{ fontSize: 7.5 }}>Cédula de Identidad del Estudiante:</Text>
                <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{formatCI(data.estudiante.ci)}</Text>
              </View>
              <View style={[styles.infoCellDataLast, { width: '35%' }]}>
                <Text style={{ fontSize: 7.5 }}>Carrera que cursa:</Text>
                <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{getCarreraOrPasantiaLabel(data)}</Text>
              </View>
            </View>
            <View style={styles.infoRowLast}>
              <View style={[styles.infoCellData, { width: '35%' }]}>
                <Text style={{ fontSize: 7.5 }}>Apellidos y Nombres del Tutor Académico:</Text>
                <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{formatTutorNombre(data.tutorAcademico)}</Text>
              </View>
              <View style={[styles.infoCellData, { width: '22%' }]}>
                <Text style={{ fontSize: 7.5 }}>Cédula de identidad del Tutor Académico:</Text>
                <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{data.tutorAcademico ? formatCI(data.tutorAcademico.ci) : ''}</Text>
              </View>
              <View style={[styles.infoCellData, { width: '22%' }]}>
                <Text style={{ fontSize: 7.5 }}>Fecha de Inicio de la PP:</Text>
                <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{formatFecha(data.practica.startDate)}</Text>
              </View>
              <View style={[styles.infoCellDataLast, { width: '21%' }]}>
                <Text style={{ fontSize: 7.5 }}>Fecha de Culminación de la PP:</Text>
                <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{formatFecha(data.practica.endDate)}</Text>
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
              <View style={idx === criterios.length - 1 ? styles.tRowLast : styles.tRow} key={c.itemNumber}>
                <Text style={styles.colNum}>{c.itemNumber}</Text>
                <Text style={styles.colAspect}>{c.description}</Text>
                <Text style={styles.colRange}>0-20</Text>
                <Text style={styles.colScore}>{formatScore(c.score)}</Text>
              </View>
            ))}
            <View style={styles.tRowLast}>
              <Text style={styles.subtotalLabel}>Subtotal ({TOTAL_ACADEMICO})</Text>
              <Text style={styles.subtotalValue}>{formatScore(subtotal)}</Text>
            </View>
          </View>
          <Text style={{ textAlign: 'center', marginTop: 6, fontSize: 9, fontFamily: 'Times-Bold' }}>Calificación final = (Subtotal / {TOTAL_ACADEMICO}): {formatScore(subtotal / TOTAL_ACADEMICO)}</Text>
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

      {/* Info box — 2 filas */}
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <View style={[styles.infoCellData, { width: '30%' }]}>
            <Text style={{ fontSize: 7.5 }}>Apellidos y Nombres del Estudiante:</Text>
            <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{formatNombreCompleto(data.estudiante).toUpperCase()}</Text>
          </View>
          <View style={[styles.infoCellData, { width: '18%' }]}>
            <Text style={{ fontSize: 7.5 }}>Cédula de Identidad del Estudiante:</Text>
            <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{formatCI(data.estudiante.ci)}</Text>
          </View>
          <View style={[styles.infoCellData, { width: '32%' }]}>
            <Text style={{ fontSize: 7.5 }}>Carrera que cursa:</Text>
            <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{getCarreraOrPasantiaLabel(data)}</Text>
          </View>
          <View style={[styles.infoCellDataLast, { width: '20%' }]}>
            <Text style={{ fontSize: 7.5 }}>Período:</Text>
            <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{data.periodo?.description}</Text>
          </View>
        </View>
        <View style={styles.infoRowLast}>
          <View style={[styles.infoCellData, { width: '40%' }]}>
            <Text style={{ fontSize: 7.5 }}>Nombre de la Institución:</Text>
            <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>{data.institucion?.nombre?.toUpperCase()}</Text>
          </View>
          <View style={[styles.infoCellData, { width: '35%' }]}>
            <Text style={{ fontSize: 7.5 }}>Cédula, Apellidos y Nombres del Tutor(a) Institucional:</Text>
            <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>
              {data.tutorInstitucional ? `${formatNombreCompleto(data.tutorInstitucional).toUpperCase()} / ${formatCI(data.tutorInstitucional.ci)}` : 'No asignado'}
            </Text>
          </View>
          <View style={[styles.infoCellDataLast, { width: '25%' }]}>
            <Text style={{ fontSize: 7.5 }}>Fechas de la PP:</Text>
            <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>Inicio: {formatFecha(data.practica.startDate)}</Text>
            <Text style={{ fontSize: 7.5, fontFamily: 'Times-Bold' }}>Culminación: {formatFecha(data.practica.endDate)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tHeader}>
          <Text style={[styles.colNumH, { width: '12%' }]}>Nº Ítems</Text>
          <Text style={[styles.colAspectH, { width: '56%' }]}>Aspecto evaluado</Text>
          <Text style={[styles.colRangeH, { width: '16%' }]}>Intervalo de Ponderación</Text>
          <Text style={[styles.colScoreH, { width: '16%' }]}>Calificación Parcial</Text>
        </View>
        {criterios.map((c, idx) => (
          <View style={idx === criterios.length - 1 ? styles.tRowLast : styles.tRow} key={c.itemNumber}>
            <Text style={[styles.colNum, { width: '12%' }]}>{c.itemNumber}</Text>
            <Text style={[styles.colAspect, { width: '56%' }]}>{c.description}</Text>
            <Text style={[styles.colRange, { width: '16%' }]}>0-20</Text>
            <Text style={[styles.colScore, { width: '16%' }]}>{formatScore(c.score)}</Text>
          </View>
        ))}
        <View style={styles.tRowLast}>
          <Text style={[styles.subtotalLabel, { width: '84%' }]}>Subtotal ({TOTAL_INSTITUCIONAL})</Text>
          <Text style={[styles.subtotalValue, { width: '16%' }]}>{formatScore(subtotal)}</Text>
        </View>
      </View>
      <Text style={{ textAlign: 'center', marginTop: 6, fontSize: 9, fontFamily: 'Times-Bold' }}>Calificación final = (Subtotal / {TOTAL_INSTITUCIONAL}): {formatScore(subtotal / TOTAL_INSTITUCIONAL)}</Text>

      {/* Firma del Tutor(a) Institucional con espacio superior */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
        <View style={{ alignItems: 'center', width: '40%' }}>
          {textos.institucionalFirmaNombre ? <Text style={styles.firmaName}>{textos.institucionalFirmaNombre}</Text> : null}
          <View style={styles.firmaLine} />
          <Text style={styles.firmaRole}>Tutor(a) Institucional</Text>
        </View>
        <View style={{ alignItems: 'center', width: '30%' }}>
          <Text style={{ fontSize: 8, marginBottom: 4 }}>Sello de la Empresa:</Text>
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
  const subtitleLabel = data.hasMultiplePracticeTypes && data.practiceTypeName
    ? data.practiceTypeName.toUpperCase()
    : getCarreraOrPasantiaLabel(data);

  return (
    <Page size="A4" style={styles.page}>
      <HeaderFinal />
      <Text style={[styles.title, { marginBottom: 2 }]}>EVALUACIÓN FINAL DE LA PRÁCTICA PROFESIONAL:</Text>
      <Text style={[styles.subtitle, { marginBottom: 15 }]}>{subtitleLabel}</Text>

      {/* Cuadrícula de Información */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <View style={[styles.gridCell, { width: '60%', borderRightWidth: 1, borderColor: '#000' }]}>
            <Text style={styles.cellHeader}>Apellidos y nombres del estudiante:</Text>
            <Text style={styles.cellData}>{formatNombreCompleto(data.estudiante).toUpperCase()}</Text>
          </View>
          <View style={[styles.gridCell, { width: '40%' }]}>
            <Text style={styles.cellHeader}>Cédula de identidad del estudiante:</Text>
            <Text style={styles.cellData}>{formatCI(data.estudiante.ci)}</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={[styles.gridCell, { width: '100%' }]}>
            <Text style={styles.cellHeader}>Carrera que cursa:</Text>
            <Text style={styles.cellData}>{getCarreraOrPasantiaLabel(data)}</Text>
          </View>
        </View>
        <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.gridCell, { width: '50%', borderRightWidth: 1, borderColor: '#000' }]}>
            <Text style={styles.cellHeader}>Nombre de la Institución donde realizó la Práctica Profesional:</Text>
            <Text style={styles.cellData}>{data.institucion?.nombre?.toUpperCase()}</Text>
          </View>
          <View style={[styles.gridCell, { width: '25%', borderRightWidth: 1, borderColor: '#000' }]}>
            <Text style={styles.cellHeader}>Fecha de inicio de la PP:</Text>
            <Text style={styles.cellData}>{formatFecha(data.practica.startDate)}</Text>
          </View>
          <View style={[styles.gridCell, { width: '25%' }]}>
            <Text style={styles.cellHeader}>Fecha de culminación de la PP:</Text>
            <Text style={styles.cellData}>{formatFecha(data.practica.endDate)}</Text>
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
      {committeePages}
      <PageTutorAcademico data={data} textos={textos} />
      <PageTutorInstitucional data={data} textos={textos} />
      <PageEvaluacionFinal data={data} textos={textos} />
    </Document>
  );
}
