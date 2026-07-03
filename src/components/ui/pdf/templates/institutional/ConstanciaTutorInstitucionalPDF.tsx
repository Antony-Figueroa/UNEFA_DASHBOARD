import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, formatFecha, getTutorTitle } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  title: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 30, textDecoration: 'underline' },
  paragraph: { marginBottom: 20, textAlign: 'justify', fontSize: 12, lineHeight: 1.5 },
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
      ci: string; titulo: string | null; primerNombre: string; segundoNombre?: string;
      primerApellido: string; segundoApellido?: string;
    };
    institucion: { nombre: string } | null;
    totalHours: number;
    periodo: { description: string; startDate: string; endDate: string } | null;
  };
  textos: Record<string, string>;
}

const CUERPO_TEMPLATE = `Señor(a):
{{institucionNombre}}
Presente.

Atención: {{tutorTitulo}} {{tutorNombreCompleto}}.

    Tengo el agrado de dirigirme a usted, en la oportunidad de extender nuestro sincero agradecimiento por su apoyo y participación incondicional, al desempeñarse como Tutor Institucional de la asignatura Práctica Profesional (Pasantía) de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana (UNEFA), al asesorar, supervisar y evaluar estudiantes, colaborando de esta forma en el proceso formativo y de capacitación integral de estos futuros profesionales, realizando un acompañamiento con un total de {{totalHours}} horas, en el periodo académico {{periodo}}, comprendido entre las fechas {{inicioLapso}} y {{finLapso}}.

    Sin otro particular al cual referirme, me despido de usted quedando a sus gratas órdenes.`;

export function ConstanciaTutorInstitucionalPDF({ data, textos }: Props) {
  const template = textos.cuerpo?.includes('{{tutorNombreCompleto}}')
    ? textos.cuerpo
    : CUERPO_TEMPLATE;

  const cuerpo = renderDocumentText(template, {
    tutorTitulo: getTutorTitle(data.tutor.titulo),
    tutorNombreCompleto: formatNombreCompleto(data.tutor),
    tutorCi: formatCI(data.tutor.ci),
    institucionNombre: data.institucion?.nombre || 'No especificada',
    totalHours: String(data.totalHours),
    periodo: data.periodo?.description || '',
    inicioLapso: data.periodo ? formatFecha(data.periodo.startDate) : '',
    finLapso: data.periodo ? formatFecha(data.periodo.endDate) : '',
    estudianteNombreCompleto: data.estudiante ? formatNombreCompleto(data.estudiante) : '',
    estudianteCi: data.estudiante ? formatCI(data.estudiante.ci) : '',
  });

  return (
    <PDFLayout title="CONSTANCIA DE TUTOR INSTITUCIONAL">
      <Text style={styles.title}>CONSTANCIA DE TUTOR INSTITUCIONAL</Text>
      <Text style={styles.paragraph}>{cuerpo}</Text>
      <View style={styles.firmaContainer}>
        <Text style={styles.firmaLine}>___________________________________</Text>
        <Text style={styles.firmaNombre}>MSc. Marbelys del Valle Rivero</Text>
        <Text style={styles.firmaRol}>DECANA</Text>
        <Text style={styles.firmaRol}>Según Orden Administrativa N° 0005 de fecha 18 de Marzo 2022</Text>
      </View>
    </PDFLayout>
  );
}
