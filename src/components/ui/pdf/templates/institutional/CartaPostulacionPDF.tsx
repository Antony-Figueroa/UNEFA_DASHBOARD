import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, getFechaParts } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  paragraph: { marginBottom: 12, textAlign: 'justify', fontSize: 10, lineHeight: 1.5 },
  // Student info row: fields left, photo right
  infoRow: { flexDirection: 'row', marginBottom: 10 },
  infoFields: { flex: 1 },
  fieldRow: { marginBottom: 2, fontSize: 9, lineHeight: 1.4 },
  // Photo box on the right
  photoBox: {
    width: 100,
    height: 130,
    border: '2pt solid black',
    marginLeft: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  photoText: {
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  // Signature section
  firmaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  firmaCol: { width: '45%', alignItems: 'center' },
  firmaRaya: { fontSize: 10, marginBottom: 3 },
  firmaLabel: { fontSize: 7, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' },
  // Acta section
  actaTitle: { textAlign: 'center', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 30 },
  actaBody: { textAlign: 'justify', fontSize: 9, lineHeight: 1.5 },
  // Acta signature table (3 cols × 4 rows)
  actaTable: { marginTop: 15, border: '1pt solid black' },
  actaRow: { flexDirection: 'row', borderBottom: '1pt solid black' },
  actaRowLast: { flexDirection: 'row' },
  actaCell: { flex: 1, padding: 4, borderRight: '1pt solid black' },
  actaCellLast: { flex: 1, padding: 4 },
  actaHeaderText: { fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
  actaCellText: { fontSize: 8, textAlign: 'center' },
  actaFooter: { fontSize: 9, marginTop: 8 },
});

interface Props {
  data: {
    estudiante: { ci: string; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string; telefono: string; email: string; empleo: string };
    carrera: { nombre: string };
    institucion: { nombre: string } | null;
    practica: { regime: string; semester: string; section: string } | null;
    tutorInstitucional: { titulo: string | null; primerNombre: string; segundoNombre?: string; primerApellido: string; segundoApellido?: string } | null;
    fechaValidacion?: string | null;
  };
  textos: Record<string, string>;
}

export function CartaPostulacionPDF({ data, textos }: Props) {
  const fechaHoy = getFechaParts(null);
  const fechaPorDefecto = `${fechaHoy.dia} de ${fechaHoy.mes} de ${fechaHoy.anio}`;
  const fechaValidacion = data.fechaValidacion ?? fechaPorDefecto;
  const nombreCompleto = formatNombreCompleto(data.estudiante);
  const ci = formatCI(data.estudiante.ci);
  const esDiurno = (data.practica?.regime || '').toUpperCase() === 'DIURNO';
  const trabaja = !!data.estudiante.empleo;

  const cuerpo = renderDocumentText(textos.cuerpo || '', {
    estudianteNombreCompleto: nombreCompleto,
    estudianteCi: ci,
    carrera: data.carrera.nombre,
    fechaValidacion,
  });

  const acta = renderDocumentText(textos.acta || '', {
    estudianteNombreCompleto: nombreCompleto,
    estudianteCi: ci,
    carrera: data.carrera.nombre,
    fechaValidacion,
  });

  return (
    <PDFLayout title="SOLICITUD DE CARTA DE POSTULACIÓN">
      {/* Cover letter opening — desde textos editables */}
      <Text style={styles.paragraph}>{cuerpo}</Text>

      {/* Student info + photo box */}
      <View style={styles.infoRow}>
        <View style={styles.infoFields}>
          <Text style={styles.fieldRow}>NOMBRES Y APELLIDOS:    {nombreCompleto}</Text>
          <Text style={styles.fieldRow}>CÉDULA DE IDENTIDAD:     {ci}</Text>
          <Text style={styles.fieldRow}>NÚMEROS DE CONTACTO:  {data.estudiante.telefono || ''}</Text>
          <Text style={styles.fieldRow}>CORREO ELECTRÓNICO:   {(data.estudiante.email || '').toUpperCase()}</Text>
          <Text style={styles.fieldRow}>
            RÉGIMEN: {esDiurno ? 'DIURNO (X)    NOCTURNO (  )' : 'DIURNO (  )    NOCTURNO (X)'}
          </Text>
          <Text style={styles.fieldRow}>CARRERA:    {data.carrera.nombre}</Text>
          <Text style={styles.fieldRow}>SEMESTRE:  {data.practica?.semester || ''}</Text>
          <Text style={styles.fieldRow}>
            TRABAJO:  {trabaja ? 'SI (X)  NO (  )' : 'SI (  )  NO (X)'}
          </Text>
        </View>
        <View style={styles.photoBox}>
          <Text style={styles.photoText}>FOTO DEL ESTUDIANTE CON UNIFORME DE LA UNEFA</Text>
        </View>
      </View>

      {/* Institution & HR manager */}
      <Text style={styles.fieldRow}>
        NOMBRE DE LA INSTITUCIÓN DONDE REALIZARÉ LAS PRÁCTICAS PROFESIONALES: {data.institucion?.nombre || '________________________'}
      </Text>
      <Text style={styles.fieldRow}>
        NOMBRE Y APELLIDOS DEL (DE LA) GERENTE DE TALENTO HUMANO DE LA INSTITUCIÓN DONDE REALIZARÉ LAS PRÁCTICAS: {data.tutorInstitucional ? formatNombreCompleto(data.tutorInstitucional) : '________________________'}
      </Text>

      {/* Signatures */}
      <View style={styles.firmaContainer}>
        <View style={styles.firmaCol}>
          <Text style={styles.firmaRaya}>_________________________________</Text>
          <Text style={styles.firmaLabel}>FIRMA DEL ESTUDIANTE</Text>
        </View>
        <View style={styles.firmaCol}>
          <Text style={styles.firmaRaya}>___________________________________</Text>
          <Text style={styles.firmaLabel}>FIRMA Y SELLO DE  LA COORDINACIÓN</Text>
          <Text style={styles.firmaLabel}>DE PRÁCTICA PROFESIONAL DEL NÚCLEO</Text>
        </View>
      </View>

      {/* Acta de Validación — página aparte */}
      <View break>
        <Text style={styles.actaTitle}>ACTA DE VALIDACIÓN</Text>
        <Text style={styles.actaBody}>{acta}</Text>

        {/* Acta signature table — 3 cols × 4 rows */}
        <View style={styles.actaTable}>
          {/* Row 1: Header */}
          <View style={styles.actaRow}>
            <View style={styles.actaCell}><Text style={styles.actaHeaderText}>DOCENTE</Text></View>
            <View style={styles.actaCell}><Text style={styles.actaHeaderText}>FIRMA</Text></View>
            <View style={styles.actaCellLast}><Text style={styles.actaHeaderText}>OBSERVACIONES</Text></View>
          </View>
          {/* Row 2 */}
          <View style={styles.actaRow}>
            <View style={styles.actaCell}><Text style={styles.actaCellText}>Tutor Académico</Text></View>
            <View style={styles.actaCell}><Text style={styles.actaCellText}>&nbsp;</Text></View>
            <View style={styles.actaCellLast}><Text style={styles.actaCellText}>&nbsp;</Text></View>
          </View>
          {/* Row 3 */}
          <View style={styles.actaRow}>
            <View style={styles.actaCell}><Text style={styles.actaCellText}>Tutor Evaluador Especialista</Text></View>
            <View style={styles.actaCell}><Text style={styles.actaCellText}>&nbsp;</Text></View>
            <View style={styles.actaCellLast}><Text style={styles.actaCellText}>&nbsp;</Text></View>
          </View>
          {/* Row 4 */}
          <View style={styles.actaRowLast}>
            <View style={styles.actaCell}><Text style={styles.actaCellText}>Tutor Metodológico</Text></View>
            <View style={styles.actaCell}><Text style={styles.actaCellText}>&nbsp;</Text></View>
            <View style={styles.actaCellLast}><Text style={styles.actaCellText}>&nbsp;</Text></View>
          </View>
        </View>

        <Text style={[styles.actaFooter, { marginTop: 8 }]}>Conforme Pasante: {nombreCompleto}</Text>
        <Text style={styles.actaFooter}>Fecha: {fechaValidacion}</Text>
      </View>
    </PDFLayout>
  );
}
