/**
 * @file CertificatePDF.tsx
 * @description Certificate PDF template with institutional layout.
 * Replicates PageEvaluacionFinal from EvaluacionConsolidadaPDF:
 * institutional header (escudo + logo), student info grid, evaluation
 * weights table, and 5 configurable signature positions.
 */

import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer';
import type { CertificatePDFData } from '../../../../features/evaluations-culmination/types';
import { formatNombreCompleto, formatCI, formatFecha } from '@/features/reports/utils/reportFormatters';

// ── Helpers (duplicated from EvaluacionConsolidadaPDF — controlled duplication) ──

const weightToPercent = (w: number) => Math.round(w * 100);

function calcProp(parcial: number, weight: number): string {
  return ((parcial * weightToPercent(weight)) / 100).toFixed(2);
}

function calcSubTotal(
  parciales: { institucional: number | null; academico: number | null; comite: number | null },
  weights: { institucional: number; academico: number; comite: number }
): string {
  let total = 0;
  if (parciales.institucional !== null) total += (parciales.institucional * weightToPercent(weights.institucional)) / 100;
  if (parciales.academico !== null) total += (parciales.academico * weightToPercent(weights.academico)) / 100;
  if (parciales.comite !== null) total += (parciales.comite * weightToPercent(weights.comite)) / 100;
  return total.toFixed(2);
}

// ── Styles (local — replicates EvaluacionConsolidadaPDF institutional theme) ──

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 45,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000000',
  },

  // Header
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
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 1.2,
  },

  // Title
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },

  // Grid — student info
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

  // Table — evaluation weights
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

  // Signatures — pattern 1-2-1-1
  firmaRowCenter: { alignItems: 'center', marginBottom: 40 },
  firmaRowSplit: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  firmaBoxFinal: { alignItems: 'center', width: '45%' },
  firmaLineFinal: { width: 220, borderBottomWidth: 1, borderColor: '#000', marginBottom: 4 },
  firmaNameFinal: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  firmaRoleFinal: { fontSize: 9, textAlign: 'center' },

  // Certificate number
  certificateNumber: {
    position: 'absolute',
    top: 30,
    right: 50,
    fontSize: 8,
    color: '#a0aec0',
  },
});

// ── HeaderFinal component (duplicated from EvaluacionConsolidadaPDF — controlled) ──

const HeaderFinal = () => (
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

// ── Props & Component ──

interface CertificatePDFProps {
  data: CertificatePDFData;
  textos: Record<string, string>;
}

export function CertificatePDF({ data, textos }: CertificatePDFProps) {
  const { evaluacionFinal } = data;

  if (!evaluacionFinal) {
    throw new Error('Evaluaciones incompletas: evaluacionFinal es requerido');
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Certificate number */}
        <Text style={styles.certificateNumber}>
          N° {data.certificateNumber || 'N/A'}
        </Text>

        {/* Institutional header */}
        <HeaderFinal />

        {/* Title */}
        <Text style={styles.title}>CERTIFICADO DE PRÁCTICAS PROFESIONALES</Text>

        {/* Student info grid */}
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
              <Text style={styles.cellData}>{data.institucion?.nombre?.toUpperCase() || ''}</Text>
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

        {/* Evaluation weights table */}
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

          {/* Sub Total */}
          <View style={styles.tRowFinal}>
            <View style={styles.colMergedLeft} />
            <Text style={[styles.colC, { textAlign: 'right' }]}>Sub Total</Text>
            <Text style={styles.colD}>
              {calcSubTotal(evaluacionFinal.parciales, evaluacionFinal.weights)}
            </Text>
          </View>

          {/* Calificación Final */}
          <View style={[styles.tRowFinal, { borderBottomWidth: 0 }]}>
            <View style={styles.colMergedLeft} />
            <Text style={[styles.colC, { textAlign: 'right' }]}>Calificación final:</Text>
            <Text style={styles.colD}>
              {evaluacionFinal.notaFinal.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Signatures — pattern 1-2-1-1 */}
        <View style={{ marginTop: 20 }}>
          {/* Row 1: single centered */}
          <View style={styles.firmaRowCenter}>
            <View style={styles.firmaLineFinal} />
            <Text style={styles.firmaNameFinal}>{textos.firma1Nombre || ''}</Text>
            <Text style={styles.firmaRoleFinal}>{textos.firma1Cargo || 'JEFA DEL EQUIPO DE TRABAJO DE PRÁCTICAS PROFESIONALES'}</Text>
          </View>

          {/* Row 2: two side by side */}
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

          {/* Row 3: single centered */}
          <View style={styles.firmaRowCenter}>
            <View style={styles.firmaLineFinal} />
            <Text style={styles.firmaNameFinal}>{textos.firma4Nombre || ''}</Text>
            <Text style={styles.firmaRoleFinal}>{textos.firma4Cargo || 'JEFA DE LA UNIDAD DE GESTIÓN EDUCATIVA'}</Text>
          </View>

          {/* Row 4: single centered */}
          <View style={styles.firmaRowCenter}>
            <View style={styles.firmaLineFinal} />
            <Text style={styles.firmaNameFinal}>{textos.firma5Nombre || ''}</Text>
            <Text style={styles.firmaRoleFinal}>{textos.firma5Cargo || 'DECANA DEL NÚCLEO'}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ── Generate function ──

export const generateCertificatePDF = async (
  data: CertificatePDFData,
  textos: Record<string, string>
): Promise<Blob> => {
  if (!data.evaluacionFinal) {
    throw new Error('Evaluaciones incompletas: no se puede generar el certificado');
  }

  const blob = await pdf(<CertificatePDF data={data} textos={textos} />).toBlob();
  return blob;
};

export default CertificatePDF;
