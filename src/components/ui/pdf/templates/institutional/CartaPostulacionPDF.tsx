import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatNombreCompleto, formatCI } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica', fontSize: 12, lineHeight: 1.5 },
  title: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 30, textDecoration: 'underline' },
  paragraph: { marginBottom: 20, textAlign: 'justify' },
  label: { fontWeight: 'bold', marginTop: 10 },
  value: { marginBottom: 5 },
});

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string; telefono: string; empleo: string };
    carrera: { nombre: string };
    institucion: { nombre: string } | null;
    practica: { regime: string; semester: string; section: string } | null;
    tutorInstitucional: { titulo: string | null; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string } | null;
  };
  textos: Record<string, string>;
}

export function CartaPostulacionPDF({ data, textos }: Props) {
  const cuerpo = renderDocumentText(textos.cuerpo || '', {
    estudianteNombreCompleto: formatNombreCompleto(data.estudiante),
    estudianteCi: formatCI(data.estudiante.ci),
    carrera: data.carrera.nombre,
    semestre: data.practica?.semester || '',
    seccion: data.practica?.section || '',
    institucionNombre: data.institucion?.nombre || 'No asignada',
    regimen: data.practica?.regime || '',
    empleo: data.estudiante.empleo ? 'SÍ' : 'NO',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>SOLICITUD DE CARTA DE POSTULACIÓN</Text>
        <Text style={styles.paragraph}>{cuerpo}</Text>
        {data.tutorInstitucional && (
          <>
            <Text style={styles.label}>Tutor Institucional Propuesto:</Text>
            <Text style={styles.value}>{formatNombreCompleto(data.tutorInstitucional)}</Text>
          </>
        )}
        <Text style={styles.label}>Datos de Contacto del Estudiante:</Text>
        <Text style={styles.value}>Teléfono: {data.estudiante.telefono}</Text>
      </Page>
    </Document>
  );
}
