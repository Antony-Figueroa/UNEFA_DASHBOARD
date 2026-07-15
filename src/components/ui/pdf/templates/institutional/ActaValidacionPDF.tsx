import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';

const styles = StyleSheet.create({
  body: {
    textAlign: 'justify',
    fontSize: 12,
    fontFamily: 'Times-Roman',
    color: '#000000',
    lineHeight: 1.6,
    marginBottom: 24,
  },
  table: {
    marginTop: 18,
    border: '1pt solid black',
    width: '100%',
  },
  row: { flexDirection: 'row', borderBottom: '1pt solid black' },
  rowLast: { flexDirection: 'row' },
  docCell: {
    width: '40%',
    padding: 10,
    borderRight: '1pt solid black',
  },
  firmaCell: {
    width: '25%',
    padding: 10,
    borderRight: '1pt solid black',
  },
  obsCell: {
    width: '35%',
    padding: 10,
  },
  headerText: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    color: '#000000',
    textAlign: 'center',
  },
  cellText: {
    fontSize: 11,
    fontFamily: 'Times-Roman',
    color: '#000000',
    textAlign: 'center',
  },
  footer: {
    fontSize: 12,
    fontFamily: 'Times-Roman',
    color: '#000000',
  },
  footerBefore: {
    marginTop: 18,
  },
  footerAfter: {
    marginTop: 6,
  },
});

/**
 * Reemplaza los placeholders {{variable}} en el texto por underscores
 * para llenado manual, siguiendo el formato del campo "conforme pasante".
 */
function replaceWithUnderscores(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    // Generar underscores según la longitud esperada del campo
    const lengths: Record<string, number> = {
      estudianteNombreCompleto: 35,
      estudianteCi: 12,
      carrera: 30,
    };
    const count = lengths[key] || 20;
    return '_'.repeat(count);
  });
}

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
  const cuerpo = replaceWithUnderscores(textos.cuerpo || '');

  return (
    <PDFLayout title="ACTA DE VALIDACIÓN" verificationHash={verificationHash} qrCodeDataUri={qrCodeDataUri} hideEquipoTrabajo>
      <Text style={styles.body}>{cuerpo}</Text>

      <View style={styles.table}>
        {/* Header */}
        <View style={styles.row}>
          <View style={styles.docCell}>
            <Text style={styles.headerText}>DOCENTES</Text>
          </View>
          <View style={styles.firmaCell}>
            <Text style={styles.headerText}>FIRMA</Text>
          </View>
          <View style={styles.obsCell}>
            <Text style={styles.headerText}>OBSERVACIONES</Text>
          </View>
        </View>
        {/* Tutor Académico */}
        <View style={styles.row}>
          <View style={styles.docCell}>
            <Text style={styles.cellText}>Tutor Académico</Text>
          </View>
          <View style={styles.firmaCell}>
            <Text style={styles.cellText}>&nbsp;</Text>
          </View>
          <View style={styles.obsCell}>
            <Text style={styles.cellText}>&nbsp;</Text>
          </View>
        </View>
        {/* Tutor Evaluador Especialista */}
        <View style={styles.row}>
          <View style={styles.docCell}>
            <Text style={styles.cellText}>Tutor Evaluador Especialista</Text>
          </View>
          <View style={styles.firmaCell}>
            <Text style={styles.cellText}>&nbsp;</Text>
          </View>
          <View style={styles.obsCell}>
            <Text style={styles.cellText}>&nbsp;</Text>
          </View>
        </View>
        {/* Tutor Metodológico */}
        <View style={styles.rowLast}>
          <View style={styles.docCell}>
            <Text style={styles.cellText}>Tutor Metodológico</Text>
          </View>
          <View style={styles.firmaCell}>
            <Text style={styles.cellText}>&nbsp;</Text>
          </View>
          <View style={styles.obsCell}>
            <Text style={styles.cellText}>&nbsp;</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.footer, styles.footerBefore]}>Conforme Pasante: ______________________</Text>
      <Text style={[styles.footer, styles.footerAfter]}>Fecha: ______________________</Text>
    </PDFLayout>
  );
}
