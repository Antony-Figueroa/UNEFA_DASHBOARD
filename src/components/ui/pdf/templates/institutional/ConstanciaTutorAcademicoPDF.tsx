import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, formatFecha, getFechaParts } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  paragraph: { marginBottom: 20, textAlign: 'justify', fontSize: 12, lineHeight: 2, marginLeft: 30, marginRight: 30, textIndent: 30 },
  firmaContainer: { marginTop: 60, alignItems: 'center' },
  firmaLine: { marginBottom: 5 },
  firmaNombre: { fontWeight: 'bold', fontSize: 11 },
  firmaRol: { fontSize: 10, color: '#4a5568' },
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
}

export function ConstanciaTutorAcademicoPDF({ data, textos }: Props) {
  const fechaHoy = getFechaParts(null);
  const tutorTitulo = (data.tutor.tituloAbrev || data.tutor.titulo || 'LICDO.').toUpperCase();
  const cuerpo = renderDocumentText(textos.cuerpo || '', {
    tutorTitulo,
    tutorNombreCompleto: formatNombreCompleto(data.tutor),
    tutorCi: formatCI(data.tutor.ci),
    tutorCondicion: data.tutor.condicion,
    tutorDedicacion: data.tutor.dedicacion,
    totalHours: String(data.totalHours),
    periodo: data.periodo?.description || '',
    inicioLapso: data.periodo ? formatFecha(data.periodo.startDate) : '',
    finLapso: data.periodo ? formatFecha(data.periodo.endDate) : '',
    estudianteNombreCompleto: data.estudiante ? formatNombreCompleto(data.estudiante) : '',
    estudianteCi: data.estudiante ? formatCI(data.estudiante.ci) : '',
    dia: fechaHoy.dia,
    mes: fechaHoy.mes,
    anio: fechaHoy.anio,
  });

  return (
    <PDFLayout title="CONSTANCIA DE TUTOR ACADÉMICO">
      <Text style={styles.paragraph}>{cuerpo}</Text>
      <View style={styles.firmaContainer}>
        <Text style={styles.firmaLine}>___________________________________</Text>
        <Text style={styles.firmaNombre}>MSc. Marbelys del Valle Rivero</Text>
        <Text style={styles.firmaRol}>Decana del Núcleo Portuguesa</Text>
        <Text style={styles.firmaRol}>Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022</Text>
      </View>
    </PDFLayout>
  );
}
