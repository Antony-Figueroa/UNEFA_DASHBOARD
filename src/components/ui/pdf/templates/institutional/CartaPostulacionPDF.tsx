import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, getFechaParts } from '@/features/reports/utils/reportFormatters';

function renderTextoTemplate(texto: string, data: Record<string, string>) {
  const parts = texto.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) => {
    const m = part.match(/\{\{(\w+)\}\}/);
    if (m) {
      const value = data[m[1]];
      if (value !== undefined) {
        return <Text key={i} style={{ textDecoration: 'underline' }}>{value.toUpperCase()}</Text>;
      }
      return `[${m[1]}]`;
    }
    return part;
  });
}

const styles = StyleSheet.create({
  paragraph: { marginBottom: 8, textAlign: 'justify', textIndent: 36, lineHeight: 1.3 },
  infoRow: { flexDirection: 'row', marginBottom: 6 },
  infoFields: { flex: 1 },
  fieldRow: { marginBottom: 2, lineHeight: 1.3 },
  photoBox: {
    width: 100,
    height: 120,
    border: '2pt solid black',
    marginLeft: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  photoText: {
    fontSize: 7,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  firmaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  firmaCol: { width: '45%', alignItems: 'center' },
  firmaRaya: { fontSize: 11, marginBottom: 2 },
  firmaLabel: { fontSize: 8, textAlign: 'center', textTransform: 'uppercase' },
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
  verificationHash?: string;
  qrCodeDataUri?: string;
}

export function CartaPostulacionPDF({ data, textos, verificationHash, qrCodeDataUri }: Props) {
  const fechaHoy = getFechaParts(null);
  const fechaPorDefecto = `${fechaHoy.dia} de ${fechaHoy.mes} de ${fechaHoy.anio}`;
  const fechaValidacion = data.fechaValidacion ?? fechaPorDefecto;
  const nombreCompleto = formatNombreCompleto(data.estudiante);
  const ci = formatCI(data.estudiante.ci);
  const esDiurno = (data.practica?.regime || '').toUpperCase() === 'DIURNO';
  const trabaja = !!data.estudiante.empleo;

  return (
    <PDFLayout title="SOLICITUD DE CARTA DE POSTULACIÓN" subtitle="(PRÁCTICAS PROFESIONALES)" verificationHash={verificationHash} qrCodeDataUri={qrCodeDataUri} hideEquipoTrabajo>
      <Text style={styles.paragraph}>
        {renderTextoTemplate(textos.cuerpo || '', {
          estudianteNombreCompleto: nombreCompleto,
          estudianteCi: ci,
          carrera: data.carrera.nombre,
          fechaValidacion,
        })}
      </Text>

      <View style={styles.infoRow}>
        <View style={styles.infoFields}>
          <Text style={styles.fieldRow}>NOMBRES Y APELLIDOS:    <Text style={{ textDecoration: 'underline' }}>{nombreCompleto.toUpperCase()}</Text></Text>
          <Text style={styles.fieldRow}>CÉDULA DE IDENTIDAD:     <Text style={{ textDecoration: 'underline' }}>{ci.toUpperCase()}</Text></Text>
          <Text style={styles.fieldRow}>NÚMEROS DE CONTACTO:  <Text style={{ textDecoration: 'underline' }}>{(data.estudiante.telefono || '').toUpperCase()}</Text></Text>
          <Text style={styles.fieldRow}>CORREO ELECTRÓNICO:   <Text style={{ textDecoration: 'underline' }}>{(data.estudiante.email || '').toUpperCase()}</Text></Text>
          <Text style={styles.fieldRow}>
            RÉGIMEN: {esDiurno ? 'DIURNO (X)    NOCTURNO (  )' : 'DIURNO (  )    NOCTURNO (X)'}
          </Text>
          <Text style={styles.fieldRow}>CARRERA:    <Text style={{ textDecoration: 'underline' }}>{data.carrera.nombre.toUpperCase()}</Text></Text>
          <Text style={styles.fieldRow}>SEMESTRE:  <Text style={{ textDecoration: 'underline' }}>{(data.practica?.semester || '').toUpperCase()}</Text></Text>
          <Text style={styles.fieldRow}>
            TRABAJO:  {trabaja ? 'SI (X)  NO (  )' : 'SI (  )  NO (X)'}
          </Text>
        </View>
        <View style={styles.photoBox}>
          <Text style={styles.photoText}>FOTO DEL ESTUDIANTE CON UNIFORME DE LA UNEFA</Text>
        </View>
      </View>

      <Text style={styles.fieldRow}>
        NOMBRE DE LA INSTITUCIÓN DONDE REALIZARÉ LAS PRÁCTICAS PROFESIONALES: <Text style={{ textDecoration: 'underline' }}>{(data.institucion?.nombre || '________________________').toUpperCase()}</Text>
      </Text>
      <Text style={styles.fieldRow}>
        NOMBRE Y APELLIDOS DEL (DE LA) GERENTE DE TALENTO HUMANO DE LA INSTITUCIÓN DONDE REALIZARÉ LAS PRÁCTICAS: <Text style={{ textDecoration: 'underline' }}>{(data.tutorInstitucional ? formatNombreCompleto(data.tutorInstitucional) : '________________________').toUpperCase()}</Text>
      </Text>

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
    </PDFLayout>
  );
}
