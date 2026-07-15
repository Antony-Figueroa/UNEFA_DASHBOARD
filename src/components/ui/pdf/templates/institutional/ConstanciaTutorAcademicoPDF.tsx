import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, formatFecha, getFechaParts, getTutorTitle } from '@/features/reports/utils/reportFormatters';
import { renderDocumentTextFormatted } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  paragraph: { marginBottom: 20, textAlign: 'justify', fontSize: 12, lineHeight: 2, marginLeft: 30, marginRight: 30, textIndent: 30, fontFamily: 'Times-Roman' },
  firmaContainer: { marginTop: 60, alignItems: 'center' },
  firmaLine: { marginBottom: 5 },
  firmaNombre: { fontSize: 11, fontFamily: 'Times-Roman' },
  firmaRol: { fontSize: 10, color: '#000000', fontFamily: 'Times-Roman' },
});

interface Props {
  data: {
    estudiante?: {
      ci: string; primerNombre: string; segundoNombre?: string;
      primerApellido: string; segundoApellido?: string;
    } | null;
    tutor: {
      ci: string; titulo: string | null; tituloAbrev?: string; primerNombre: string; segundoNombre?: string;
      primerApellido: string; segundoApellido?: string;
      condicion: string; dedicacion: string;
    };
    totalHours: number;
    periodo: { description: string; startDate: string; endDate: string } | null;
  };
  textos: Record<string, string>;
  verificationHash?: string;
  qrCodeDataUri?: string;
}

export function ConstanciaTutorAcademicoPDF({ data, textos, verificationHash, qrCodeDataUri }: Props) {
  const fechaHoy = getFechaParts(null);
  const tutorTitulo = getTutorTitle(data.tutor.titulo, data.tutor.tituloAbrev);

  const cuerpo = renderDocumentTextFormatted(textos.cuerpo || '', {
    tutorTitulo,
    tutorNombreCompleto: formatNombreCompleto(data.tutor).toUpperCase(),
    tutorCi: formatCI(data.tutor.ci).toUpperCase(),
    tutorCondicion: data.tutor.condicion.toUpperCase(),
    tutorDedicacion: data.tutor.dedicacion.toUpperCase(),
    totalHours: String(data.totalHours),
    periodo: data.periodo?.description || '',
    inicioLapso: data.periodo ? formatFecha(data.periodo.startDate) : '',
    finLapso: data.periodo ? formatFecha(data.periodo.endDate) : '',
    estudianteNombreCompleto: data.estudiante ? formatNombreCompleto(data.estudiante).toUpperCase() : '',
    estudianteCi: data.estudiante ? formatCI(data.estudiante.ci).toUpperCase() : '',
    dia: fechaHoy.dia,
    mes: fechaHoy.mes,
    anio: fechaHoy.anio,
  });

  const firmaNombre = textos.firmaNombre || 'MSc. Marbelys del Valle Rivero';
  const firmaCargo = textos.firmaCargo || 'Decana del Núcleo Portuguesa';
  const firmaOrden = textos.firmaOrden || 'Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022';

  return (
    <PDFLayout
      title="CONSTANCIA"
      verificationHash={verificationHash}
      qrCodeDataUri={qrCodeDataUri}
      equipoTrabajoText="COORDINACIÓN DE PRÁCTICAS PROFESIONALES"
    >
      <Text style={styles.paragraph}>{cuerpo}</Text>
      <View style={styles.firmaContainer}>
        <Text style={styles.firmaLine}>___________________________________</Text>
        <Text style={styles.firmaNombre}>{firmaNombre.toUpperCase()}</Text>
        <Text style={styles.firmaRol}>{firmaCargo.toUpperCase()}</Text>
        <Text style={styles.firmaRol}>{firmaOrden}</Text>
      </View>
    </PDFLayout>
  );
}
