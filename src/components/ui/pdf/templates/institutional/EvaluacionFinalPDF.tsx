import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, formatFecha } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  title: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', marginBottom: 25, textDecoration: 'underline' },
  paragraph: { marginBottom: 20, textAlign: 'justify' },

  /* ── Pseudo-table: Student info ── */
  infoSection: { marginBottom: 20 },
  infoTable: { borderWidth: 1, borderColor: '#000' },
  infoRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  infoRowLast: { flexDirection: 'row' },
  infoLabel: { width: 240, fontWeight: 'bold', fontSize: 10, paddingVertical: 6, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  infoValue: { flex: 1, fontSize: 10, paddingVertical: 6, paddingHorizontal: 6 },

  /* ── Pseudo-table: Evaluation ── */
  table: { marginTop: 10, marginBottom: 10, borderWidth: 1, borderColor: '#000' },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', backgroundColor: '#e8e8e8' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  tableRowLast: { flexDirection: 'row' },
  thDesc: { flex: 2.5, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  thWeight: { flex: 1, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  thParcial: { flex: 1.2, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  thProp: { flex: 1.3, fontWeight: 'bold', fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4 },
  tdDesc: { flex: 2.5, fontSize: 9, paddingVertical: 5, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#000' },
  tdWeight: { flex: 1, fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  tdParcial: { flex: 1.2, fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#000' },
  tdProp: { flex: 1.3, fontSize: 9, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4 },

  totalRow: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: '#000' },
  totalLabel: { flex: 3.5, fontWeight: 'bold', fontSize: 10, textAlign: 'right', paddingVertical: 5, paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: '#000' },
  totalValue: { flex: 1.3, fontWeight: 'bold', fontSize: 10, textAlign: 'center', paddingVertical: 5, paddingHorizontal: 4 },
  totalEmpty: { flex: 1.2 },

  finalGrade: { marginTop: 15, alignItems: 'center', marginBottom: 15 },
  finalGradeText: { fontSize: 13, fontWeight: 'bold' },

  firmaGrid: { marginTop: 30 },
  firmaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
  firmaBox: { alignItems: 'center', width: '45%' },
  firmaLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 4 },
  firmaNombre: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  firmaCargo: { fontSize: 8, color: '#4a5568', textAlign: 'center' },
  firmaBottom: { alignItems: 'center', marginTop: 10 },
});

interface EvaluacionItem {
  parcial: number;
  weight: number;
}

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
    institucion: { nombre: string } | null;
    practica: { startDate: string; endDate: string; grade: number };
    evaluaciones: {
      tutorInstitucional: EvaluacionItem | null;
      tutorAcademico: EvaluacionItem | null;
      comiteEvaluador: EvaluacionItem | null;
      notaFinal: number;
    };
  };
  textos: Record<string, string>;
}

const weightToPercent = (w: number) => Math.round(w * 100);

function calcProp(parcial: number, weight: number): string {
  return ((parcial * weightToPercent(weight)) / 100).toFixed(1);
}

function calcTotal(evaluaciones: Props['data']['evaluaciones']): string {
  let total = 0;
  if (evaluaciones.tutorInstitucional) total += (evaluaciones.tutorInstitucional.parcial * weightToPercent(evaluaciones.tutorInstitucional.weight)) / 100;
  if (evaluaciones.tutorAcademico) total += (evaluaciones.tutorAcademico.parcial * weightToPercent(evaluaciones.tutorAcademico.weight)) / 100;
  if (evaluaciones.comiteEvaluador) total += (evaluaciones.comiteEvaluador.parcial * weightToPercent(evaluaciones.comiteEvaluador.weight)) / 100;
  return total.toFixed(1);
}

export function EvaluacionFinalPDF({ data, textos }: Props) {
  const cuerpo = renderDocumentText(textos.encabezado || '', {
    estudianteNombreCompleto: formatNombreCompleto(data.estudiante),
    estudianteCi: formatCI(data.estudiante.ci),
    carrera: data.carrera.nombre,
    institucionNombre: data.institucion?.nombre || 'No asignada',
    fechaInicio: formatFecha(data.practica.startDate),
    fechaFin: formatFecha(data.practica.endDate),
  });

  const { evaluaciones } = data;

  return (
    <PDFLayout title="EVALUACIÓN FINAL DE LA PRÁCTICA PROFESIONAL">
      <Text style={styles.title}>EVALUACIÓN FINAL DE LA PRÁCTICA PROFESIONAL</Text>
      <Text style={styles.paragraph}>{cuerpo}</Text>

      {/* Student info — pseudo-table with borders */}
      <View style={styles.infoSection}>
        <View style={styles.infoTable}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>APELLIDOS Y NOMBRES:</Text>
            <Text style={styles.infoValue}>{formatNombreCompleto(data.estudiante)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CÉDULA DE IDENTIDAD:</Text>
            <Text style={styles.infoValue}>{formatCI(data.estudiante.ci)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CARRERA QUE CURSA:</Text>
            <Text style={styles.infoValue}>{data.carrera.nombre}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>NOMBRE DE LA INSTITUCIÓN DONDE REALIZÓ LA PRÁCTICA PROFESIONAL:</Text>
            <Text style={styles.infoValue}>{data.institucion?.nombre || 'No asignada'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>FECHA DE INICIO DE LA PP:</Text>
            <Text style={styles.infoValue}>{formatFecha(data.practica.startDate)}</Text>
          </View>
          <View style={styles.infoRowLast}>
            <Text style={styles.infoLabel}>FECHA DE CULMINACIÓN DE LA PP:</Text>
            <Text style={styles.infoValue}>{formatFecha(data.practica.endDate)}</Text>
          </View>
        </View>
      </View>

      {/* Weighted evaluation table — pseudo-table with borders */}
      {evaluaciones && (
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.thDesc}>Evaluación del (de la) Estudiante</Text>
            <Text style={styles.thWeight}>Valor Porcentual</Text>
            <Text style={styles.thParcial}>Calificación Parcial (Escala 1-20)</Text>
            <Text style={styles.thProp}>Calificación Parcial Proporcional al Porcentaje</Text>
          </View>

          {evaluaciones.tutorInstitucional && (
            <View style={styles.tableRow}>
              <Text style={styles.tdDesc}>A. Por parte del (de la) Tutor(a) Institucional</Text>
              <Text style={styles.tdWeight}>{weightToPercent(evaluaciones.tutorInstitucional.weight)}%</Text>
              <Text style={styles.tdParcial}>{evaluaciones.tutorInstitucional.parcial}</Text>
              <Text style={styles.tdProp}>{calcProp(evaluaciones.tutorInstitucional.parcial, evaluaciones.tutorInstitucional.weight)}</Text>
            </View>
          )}

          {evaluaciones.tutorAcademico && (
            <View style={styles.tableRow}>
              <Text style={styles.tdDesc}>B. Por parte del (de la) Tutor(a) Académico</Text>
              <Text style={styles.tdWeight}>{weightToPercent(evaluaciones.tutorAcademico.weight)}%</Text>
              <Text style={styles.tdParcial}>{evaluaciones.tutorAcademico.parcial}</Text>
              <Text style={styles.tdProp}>{calcProp(evaluaciones.tutorAcademico.parcial, evaluaciones.tutorAcademico.weight)}</Text>
            </View>
          )}

          {evaluaciones.comiteEvaluador && (
            <View style={styles.tableRowLast}>
              <Text style={styles.tdDesc}>C. Por parte del Comité Evaluador</Text>
              <Text style={styles.tdWeight}>{weightToPercent(evaluaciones.comiteEvaluador.weight)}%</Text>
              <Text style={styles.tdParcial}>{evaluaciones.comiteEvaluador.parcial}</Text>
              <Text style={styles.tdProp}>{calcProp(evaluaciones.comiteEvaluador.parcial, evaluaciones.comiteEvaluador.weight)}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalEmpty}></Text>
            <Text style={styles.totalLabel}>Sub Total</Text>
            <Text style={styles.totalEmpty}></Text>
            <Text style={styles.totalValue}>{calcTotal(evaluaciones)}</Text>
          </View>
        </View>
      )}

      {/* Final grade */}
      <View style={styles.finalGrade}>
        <Text style={styles.finalGradeText}>
          Calificación final: {data.practica.grade}/20
        </Text>
      </View>

      {/* Signature grid — matches ACTA DE NOTAS FINALES layout */}
      <View style={styles.firmaGrid}>
        {/* Row 1: Jefas de PP */}
        <View style={styles.firmaRow}>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaNombre}>Jefa del Equipo de Trabajo</Text>
            <Text style={styles.firmaCargo}>de Prácticas Profesionales</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaNombre}>Jefa del Equipo de Trabajo</Text>
            <Text style={styles.firmaCargo}>de Prácticas Profesionales</Text>
          </View>
        </View>

        {/* Row 2: Secretaría */}
        <View style={styles.firmaRow}>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaNombre}>Lcdo. Daniel José Álvarez Rivas</Text>
            <Text style={styles.firmaCargo}>Jefe del Área de Secretaría</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaNombre}>Lcdo. Daniel José Álvarez Rivas</Text>
            <Text style={styles.firmaCargo}>Jefe del Área de Secretaría</Text>
          </View>
        </View>

        {/* Row 3: Área Académica y UGE */}
        <View style={styles.firmaRow}>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaNombre}>Dra. Carmen Magdalena Rangel de Rojas</Text>
            <Text style={styles.firmaCargo}>Jefa del Área Académica</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLine} />
            <Text style={styles.firmaNombre}>Dra. Milagros del Valle Daboín Villegas</Text>
            <Text style={styles.firmaCargo}>Jefa de la Unidad de Gestión Educativa</Text>
          </View>
        </View>

        {/* Decana centered */}
        <View style={[styles.firmaBottom, { marginTop: 20 }]}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 250, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 4 }} />
            <Text style={{ fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>MSc. Marbelys del Valle Rivero</Text>
            <Text style={{ fontSize: 9, color: '#4a5568', textAlign: 'center' }}>Decana del Núcleo Portuguesa</Text>
            <Text style={{ fontSize: 8, color: '#4a5568', textAlign: 'center' }}>Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022</Text>
          </View>
        </View>
      </View>
    </PDFLayout>
  );
}
