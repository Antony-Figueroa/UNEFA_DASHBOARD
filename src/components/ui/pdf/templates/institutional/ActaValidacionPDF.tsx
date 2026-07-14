import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, formatFecha, getFechaParts } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  paragraph: { marginBottom: 20, textAlign: 'justify', fontSize: 12, lineHeight: 1.5 },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  tableCol1: {
    width: '30%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    padding: 6,
    justifyContent: 'center',
  },
  tableCol2: {
    width: '35%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    padding: 6,
    justifyContent: 'flex-end',
    minHeight: 40,
  },
  tableCol3: {
    width: '35%',
    padding: 6,
    justifyContent: 'flex-end',
    minHeight: 40,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 10,
    textAlign: 'center',
  },
  footerSection: {
    marginTop: 40,
    fontSize: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 11,
  }
});

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string };
    carrera: { nombre: string };
    practica?: { startDate?: string; endDate?: string } | null;
  };
  textos: Record<string, string>;
  verificationHash?: string;
  qrCodeDataUri?: string;
}

export function ActaValidacionPDF({ data, textos, verificationHash, qrCodeDataUri }: Props) {
  const fechaHoy = getFechaParts(null);
  const fechaValidacion = `${fechaHoy.dia} de ${fechaHoy.mes} de ${fechaHoy.anio}`;
  let cuerpo = renderDocumentText(textos.cuerpo || '', {
    estudianteNombreCompleto: formatNombreCompleto(data.estudiante),
    estudianteCi: formatCI(data.estudiante.ci),
    carrera: data.carrera.nombre,
    fechaValidacion,
  });

  // Limpiar la vieja tabla en texto si aún está en la configuración de la BD
  const tableIndex = cuerpo.indexOf('DOCENTE');
  if (tableIndex !== -1 && cuerpo.includes('FIRMA') && cuerpo.includes('OBSERVACIONES')) {
    cuerpo = cuerpo.substring(0, tableIndex).trim();
  }

  return (
    <PDFLayout title="ACTA DE VALIDACIÓN" verificationHash={verificationHash} qrCodeDataUri={qrCodeDataUri}>
      <Text style={styles.paragraph}>{cuerpo}</Text>

      <View style={styles.table}>
        {/* Encabezado */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.tableCol1}>
            <Text style={styles.tableCellHeader}>DOCENTE</Text>
          </View>
          <View style={styles.tableCol2}>
            <Text style={styles.tableCellHeader}>FIRMA</Text>
          </View>
          <View style={styles.tableCol3}>
            <Text style={styles.tableCellHeader}>OBSERVACIONES</Text>
          </View>
        </View>

        {/* Fila 1 */}
        <View style={styles.tableRow}>
          <View style={styles.tableCol1}>
            <Text style={styles.tableCell}>Tutor Académico</Text>
          </View>
          <View style={styles.tableCol2}></View>
          <View style={styles.tableCol3}></View>
        </View>

        {/* Fila 2 */}
        <View style={styles.tableRow}>
          <View style={styles.tableCol1}>
            <Text style={styles.tableCell}>Tutor Evaluador Especialista</Text>
          </View>
          <View style={styles.tableCol2}></View>
          <View style={styles.tableCol3}></View>
        </View>

        {/* Fila 3 */}
        <View style={styles.tableRowLast}>
          <View style={styles.tableCol1}>
            <Text style={styles.tableCell}>Tutor Metodológico</Text>
          </View>
          <View style={styles.tableCol2}></View>
          <View style={styles.tableCol3}></View>
        </View>
      </View>

      <View style={styles.footerSection}>
        <Text style={styles.footerText}>Conforme Pasante: {formatNombreCompleto(data.estudiante)}</Text>
        <Text style={styles.footerText}>Fecha: {fechaValidacion}</Text>
      </View>
    </PDFLayout>
  );
}
