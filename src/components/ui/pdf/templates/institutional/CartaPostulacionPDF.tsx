import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, formatCI, getFechaParts } from '@/features/reports/utils/reportFormatters';
import { renderDocumentText } from '@/features/reports/utils/documentRenderer';

const styles = StyleSheet.create({
  paragraph: { marginBottom: 14, textAlign: 'justify', fontSize: 11, lineHeight: 1.8 },
  // Student info row: fields left, photo right
  infoRow: { flexDirection: 'row', marginBottom: 12 },
  infoFields: { flex: 1 },
  fieldRow: { marginBottom: 4, fontSize: 10, lineHeight: 1.7 },
  // Photo box on the right
  photoBox: {
    width: 110,
    height: 140,
    border: '2pt solid black',
    marginLeft: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  photoText: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  // Signature section
  firmaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 35 },
  firmaCol: { width: '45%', alignItems: 'center' },
  firmaRaya: { fontSize: 11, marginBottom: 4 },
  firmaLabel: { fontSize: 8, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' },
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

  const cuerpo = renderDocumentText(textos.cuerpo || '', {
    estudianteNombreCompleto: nombreCompleto,
    estudianteCi: ci,
    carrera: data.carrera.nombre,
    fechaValidacion,
  });

  return (
    <PDFLayout title="SOLICITUD DE CARTA DE POSTULACIÓN" verificationHash={verificationHash} qrCodeDataUri={qrCodeDataUri}>
      {/* Cover letter opening — desde textos editables */}
      <Text style={styles.paragraph}>{cuerpo}</Text>

      {/* Student info + photo box */}
      <View style={styles.infoRow}>
        <View style={styles.infoFields}>
          <Text style={styles.fieldRow}>NOMBRES Y APELLIDOS:    <Text style={{ fontWeight: 'bold' }}>{nombreCompleto}</Text></Text>
          <Text style={styles.fieldRow}>CÉDULA DE IDENTIDAD:     <Text style={{ fontWeight: 'bold' }}>{ci}</Text></Text>
          <Text style={styles.fieldRow}>NÚMEROS DE CONTACTO:  <Text style={{ fontWeight: 'bold' }}>{data.estudiante.telefono || ''}</Text></Text>
          <Text style={styles.fieldRow}>CORREO ELECTRÓNICO:   <Text style={{ fontWeight: 'bold' }}>{(data.estudiante.email || '').toUpperCase()}</Text></Text>
          <Text style={styles.fieldRow}>
            RÉGIMEN: {esDiurno ? 'DIURNO (X)    NOCTURNO (  )' : 'DIURNO (  )    NOCTURNO (X)'}
          </Text>
          <Text style={styles.fieldRow}>CARRERA:    <Text style={{ fontWeight: 'bold' }}>{data.carrera.nombre}</Text></Text>
          <Text style={styles.fieldRow}>SEMESTRE:  <Text style={{ fontWeight: 'bold' }}>{data.practica?.semester || ''}</Text></Text>
          <Text style={styles.fieldRow}>
            TRABAJO:  <Text style={{ fontWeight: 'bold' }}>{trabaja ? 'SI (X)  NO (  )' : 'SI (  )  NO (X)'}</Text>
          </Text>
        </View>
        <View style={styles.photoBox}>
          <Text style={styles.photoText}>FOTO DEL ESTUDIANTE CON UNIFORME DE LA UNEFA</Text>
        </View>
      </View>

      {/* Institution & HR manager */}
      <Text style={styles.fieldRow}>
        NOMBRE DE LA INSTITUCIÓN DONDE REALIZARÉ LAS PRÁCTICAS PROFESIONALES: <Text style={{ fontWeight: 'bold' }}>{data.institucion?.nombre || '________________________'}</Text>
      </Text>
      <Text style={styles.fieldRow}>
        NOMBRE Y APELLIDOS DEL (DE LA) GERENTE DE TALENTO HUMANO DE LA INSTITUCIÓN DONDE REALIZARÉ LAS PRÁCTICAS: <Text style={{ fontWeight: 'bold' }}>{data.tutorInstitucional ? formatNombreCompleto(data.tutorInstitucional) : '________________________'}</Text>
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
    </PDFLayout>
  );
}
