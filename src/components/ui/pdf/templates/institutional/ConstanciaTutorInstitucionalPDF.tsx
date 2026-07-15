import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, getFechaParts, getTutorTitle } from '@/features/reports/utils/reportFormatters';

const styles = StyleSheet.create({
  paragraph: { 
    marginBottom: 10, 
    textAlign: 'justify', 
    fontSize: 11, 
    lineHeight: 1.5,
    textIndent: 30,
  },
  placeDate: { 
    marginBottom: 4, 
    fontSize: 11, 
    textAlign: 'right',
  },
  leftSection: {
    marginBottom: 5,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  labelText: {
    fontSize: 11,
  },
  firmaContainer: { 
    marginTop: 40, 
    alignItems: 'center',
  },
  firmaLine: { 
    width: 220, 
    borderBottomWidth: 1, 
    borderBottomColor: '#000000', 
    marginBottom: 5,
  },
  atentamente: {
    marginBottom: 20,
    fontSize: 11,
    textAlign: 'center',
  },
  firmaData: { 
    fontSize: 11,
    marginBottom: 3,
    textAlign: 'center',
  },
  firmaNombre: {
    fontSize: 11,
    marginBottom: 2,
  },
});

function formatFechaShort(fecha: string | null): string {
  if (!fecha) return '__/__/____';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

interface Props {
  data: {
    tutor: {
      ci: string; titulo: string | null; tituloAbrev?: string; primerNombre: string; segundoNombre?: string;
      primerApellido: string; segundoApellido?: string;
    };
    institucion: { nombre: string } | null;
    responsable: { nombreCompleto: string; titulo: string } | null;
    hoursRequired: number;
    periodo: { description: string; startDate: string; endDate: string } | null;
  };
  textos: Record<string, string>;
  verificationHash?: string;
  qrCodeDataUri?: string;
}

export function ConstanciaTutorInstitucionalPDF({ data, textos, verificationHash, qrCodeDataUri }: Props) {
  const fechaHoy = getFechaParts(null);

  const tutorName = formatNombreCompleto(data.tutor).toUpperCase();
  const tutorTitulo = getTutorTitle(data.tutor.titulo, data.tutor.tituloAbrev);
  const institucionNombre = (data.institucion?.nombre || '________________________').toUpperCase();
  const responsableNombre = data.responsable?.nombreCompleto || institucionNombre;
  const responsableTitulo = data.responsable?.titulo
    ? data.responsable.titulo.toUpperCase()
    : '';

  const hoursRequired = data.hoursRequired || 480;
  const periodoDesc = data.periodo?.description || '_________';
  const lapsoInicio = data.periodo ? formatFechaShort(data.periodo.startDate) : '__/__/____';
  const lapsoFin = data.periodo ? formatFechaShort(data.periodo.endDate) : '__/__/____';

  const firmaNombre = textos.firmaNombre || 'MSc. MARBELYS DEL VALLE RIVERO';
  const firmaCargo = textos.firmaCargo || 'DECANA';
  const firmaOrden = textos.firmaOrden || 'Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022';

  // Destinatario editable desde configuración
  const destinatarioTexto = textos.destinatario || (
    responsableTitulo
      ? `${responsableTitulo} ${responsableNombre}`
      : responsableNombre
  );

  return (
    <PDFLayout
      title=""
      verificationHash={verificationHash}
      qrCodeDataUri={qrCodeDataUri}
      hideReportTitle
      equipoTrabajoText="COORDINACIÓN DE PRÁCTICAS PROFESIONALES"
    >
      {/* Fecha alineada a la derecha */}
      <Text style={styles.placeDate}>Guanare, {fechaHoy.dia} de {fechaHoy.mes} del {fechaHoy.anio}.</Text>

      {/* Sección izquierda: Destinatario (editable) */}
      <View style={styles.leftSection}>
        <Text style={styles.labelText}>Señor (a):</Text>
        <Text style={styles.labelText}>{destinatarioTexto}</Text>
        <Text style={styles.labelText}>{institucionNombre}</Text>
        <Text style={styles.labelText}>Presente.</Text>
      </View>

      {/* Sección derecha: Atnn. (editable desde textos) */}
      <View style={styles.rightSection}>
        <Text style={styles.labelText}>Atnn. {textos.atnn || `${tutorTitulo} ${tutorName}.`}</Text>
      </View>

      {/* Cuerpo del texto — primer párrafo */}
      <Text style={styles.paragraph}>
        Tengo el agrado de dirigirme a usted, en la oportunidad de extender nuestro sincero agradecimiento por su apoyo y participación incondicional, al desempeñarse como Tutor Institucional de la asignatura Práctica Profesional (Pasantía) de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana (UNEFA), al asesorar, supervisar y evaluar estudiantes, colaborando de esta forma en el proceso formativo y de capacitación integral de estos futuros profesionales, realizando un acompañamiento con un total de {hoursRequired} horas, en el periodo académico {periodoDesc}, comprendido entre las fechas {lapsoInicio} y {lapsoFin}.
      </Text>

      {/* Cuerpo del texto — segundo párrafo */}
      <Text style={styles.paragraph}>
        Sin otro particular al cual referirme, me despido de usted (es) quedando a sus gratas órdenes.
      </Text>

      {/* Firma Centrada */}
      <Text style={styles.atentamente}>Atentamente</Text>

      <View style={styles.firmaContainer}>
        <View style={styles.firmaLine} />
        <Text style={styles.firmaNombre}>{firmaNombre}</Text>
        <Text style={styles.firmaNombre}>{firmaCargo}</Text>
        <Text style={styles.firmaData}>{firmaOrden}</Text>
      </View>
    </PDFLayout>
  );
}
