import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  body: { textAlign: 'justify', fontSize: 11, lineHeight: 1.8, marginBottom: 20 },
  table: { marginTop: 18, border: '1pt solid black' },
  row: { flexDirection: 'row', borderBottom: '1pt solid black' },
  rowLast: { flexDirection: 'row' },
  cell: { flex: 1, padding: 5, borderRight: '1pt solid black' },
  cellLast: { flex: 1, padding: 5 },
  headerText: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  cellText: { fontSize: 9, textAlign: 'center' },
  footer: { fontSize: 10, marginTop: 10 },
  footSpacing: { marginTop: 8 },
});

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
  };
  textos: Record<string, string>;
  verificationHash?: string;
  qrCodeDataUri?: string;
}

export function ActaValidacionPDF({ data, textos, verificationHash, qrCodeDataUri }: Props) {
  const cuerpo = renderDocumentText(textos.cuerpo || '', {
    estudianteNombreCompleto: formatNombreCompleto(data.estudiante),
    estudianteCi: formatCI(data.estudiante.ci),
    carrera: data.carrera.nombre,
  });

  return (
    <PDFLayout title="ACTA DE VALIDACIÓN" verificationHash={verificationHash} qrCodeDataUri={qrCodeDataUri}>
      <Text style={styles.body}>{cuerpo}</Text>

      <View style={styles.table}>
        {/* Header */}
        <View style={styles.row}>
          <View style={styles.cell}><Text style={styles.headerText}>DOCENTE</Text></View>
          <View style={styles.cell}><Text style={styles.headerText}>FIRMA</Text></View>
          <View style={styles.cellLast}><Text style={styles.headerText}>OBSERVACIONES</Text></View>
        </View>
        {/* Tutor Académico */}
        <View style={styles.row}>
          <View style={styles.cell}><Text style={styles.cellText}>Tutor Académico</Text></View>
          <View style={styles.cell}><Text style={styles.cellText}>&nbsp;</Text></View>
          <View style={styles.cellLast}><Text style={styles.cellText}>&nbsp;</Text></View>
        </View>
        {/* Tutor Evaluador Especialista */}
        <View style={styles.row}>
          <View style={styles.cell}><Text style={styles.cellText}>Tutor Evaluador Especialista</Text></View>
          <View style={styles.cell}><Text style={styles.cellText}>&nbsp;</Text></View>
          <View style={styles.cellLast}><Text style={styles.cellText}>&nbsp;</Text></View>
        </View>
        {/* Tutor Metodológico */}
        <View style={styles.rowLast}>
          <View style={styles.cell}><Text style={styles.cellText}>Tutor Metodológico</Text></View>
          <View style={styles.cell}><Text style={styles.cellText}>&nbsp;</Text></View>
          <View style={styles.cellLast}><Text style={styles.cellText}>&nbsp;</Text></View>
        </View>
      </View>

      <Text style={[styles.footer, styles.footSpacing]}>Conforme Pasante: ______________________</Text>
      <Text style={styles.footer}>Fecha: ______________________</Text>
    </PDFLayout>
  );
}
