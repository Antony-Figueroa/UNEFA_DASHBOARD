import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import PDFLayout from '../../PDFLayout';
import { formatNombreCompleto, getFechaParts, getTutorTitle } from '@/features/reports/utils/reportFormatters';

/**
 * Renderiza el cuerpo reemplazando {{variables}}.
 * Los valores de 'noBoldFields' se muestran en Times-Roman (normal), el resto en Times-Bold.
 */
function renderCuerpo(template: string, data: Record<string, string>, noBoldFields: string[] = []): React.ReactNode[] {
  const parts = template.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) => {
    const m = part.match(/\{\{(\w+)\}\}/);
    if (m) {
      const value = data[m[1]];
      if (value !== undefined) {
        const isBold = !noBoldFields.includes(m[1]);
        return <Text key={i} style={{ fontFamily: isBold ? 'Times-Bold' : 'Times-Roman' }}>{value}</Text>;
      }
      return `[${m[1]}]`;
    }
    return part;
  });
}

/** Extrae solo dígitos de una cédula, sin prefijo ni separadores */
function ciRaw(ci: string): string {
  return ci.replace(/\D/g, '');
}

/** Formato día/mes/año */
function formatDateDMY(dateStr: string): string {
  const p = getFechaParts(dateStr);
  return `${p.dia}/${p.mes}/${p.anio}`;
}

const styles = StyleSheet.create({
  paragraph: { marginBottom: 20, textAlign: 'justify', fontSize: 12, lineHeight: 2, marginLeft: 30, marginRight: 30, textIndent: 30, fontFamily: 'Times-Roman' },
  firmaContainer: { marginTop: 60, alignItems: 'center' },
  firmaLine: { marginBottom: 5 },
  firmaNombre: { fontSize: 11, fontFamily: 'Times-Bold' },
  firmaRol: { fontSize: 10, color: '#000000', fontFamily: 'Times-Bold' },
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

  const cuerpo = renderCuerpo(textos.cuerpo || '', {
    tutorTitulo,
    tutorNombreCompleto: formatNombreCompleto(data.tutor).toUpperCase(),
    tutorCi: ciRaw(data.tutor.ci),
    tutorCondicion: data.tutor.condicion.toUpperCase(),
    tutorDedicacion: data.tutor.dedicacion.toUpperCase(),
    totalHours: String(data.totalHours),
    periodo: data.periodo?.description || '',
    inicioLapso: data.periodo ? formatDateDMY(data.periodo.startDate) : '',
    finLapso: data.periodo ? formatDateDMY(data.periodo.endDate) : '',
    dia: String(fechaHoy.dia),
    mes: String(fechaHoy.mes),
    anio: String(fechaHoy.anio),
  }, ['dia', 'mes', 'anio']);

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
        <Text style={{ fontSize: 10, color: '#000000', fontFamily: 'Times-Roman' }}>{firmaOrden}</Text>
      </View>
    </PDFLayout>
  );
}
