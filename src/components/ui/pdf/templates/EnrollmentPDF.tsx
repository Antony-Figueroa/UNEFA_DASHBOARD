import React from "react";
import { View, Text } from "@react-pdf/renderer";
import PDFLayout from "../PDFLayout";
import { pdfStyles } from "../PDFStyles";
import { Enrollment, EnrollmentRowData } from "../../../../features/enrollment/types";

/**
 * Propiedades para el componente EnrollmentPDF.
 * @param data - Lista de inscripciones a mostrar en el reporte.
 * @param selectedPeriod - Período académico seleccionado para el título del reporte.
 */
interface EnrollmentPDFProps {
  data: Enrollment[] | EnrollmentRowData[];
  selectedPeriod?: string;
}

/**
 * Valida si los datos de la inscripción son suficientes para el reporte.
 * @param data Lista de inscripciones
 * @returns true si los datos son válidos, false si falta información crítica
 */
const validateEnrollmentData = (data: (Enrollment | EnrollmentRowData)[]): boolean => {
  return Array.isArray(data) && data.length > 0;
};

export const EnrollmentPDF: React.FC<EnrollmentPDFProps> = ({ data, selectedPeriod }) => {
  // Validación preventiva
  const isValid = validateEnrollmentData(data);

  // Determinar el período actual para el título dinámico
  const currentPeriod = selectedPeriod || (data.length > 0 
    ? data[0].period 
    : `${new Date().getMonth() < 6 ? '1' : '2'}-${new Date().getFullYear()}`);

  const title = `RESUMEN PASANTIAS ${currentPeriod}`;

  // Estilos específicos para este reporte para coincidir con la imagen
  const localStyles = {
    headerCell: {
      backgroundColor: '#92D050',
      color: '#000',
      fontWeight: 'bold' as const,
      borderRightWidth: 1,
      borderRightColor: '#000',
      borderBottomWidth: 1,
      borderBottomColor: '#000',
      padding: 2,
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    tableHeader: {
      backgroundColor: '#92D050',
      flexDirection: 'row' as const,
      borderTopWidth: 1,
      borderTopColor: '#000',
      borderLeftWidth: 1,
      borderLeftColor: '#000',
    },
    cell: {
      borderRightWidth: 1,
      borderRightColor: '#000',
      borderBottomWidth: 1,
      borderBottomColor: '#000',
      padding: 2,
      display: 'flex' as const,
      justifyContent: 'center' as const,
    },
    titleContainer: {
      marginBottom: 10,
      alignItems: 'center' as const,
    },
    titleText: {
      fontSize: 10,
      fontWeight: 'bold' as const,
      textDecoration: 'underline' as const,
    }
  };

  if (!isValid) {
    return (
      <PDFLayout title="ERROR DE REPORTE" subtitle="DATOS INSUFICIENTES">
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 12, color: 'red' }}>
            No se encontraron datos suficientes para generar el reporte ANEXO 2.
            Asegúrese de que las inscripciones tengan asignados: Región, Núcleo y Carrera.
          </Text>
        </View>
      </PDFLayout>
    );
  }

  return (
    <PDFLayout
      title=""
      subtitle=""
      orientation="landscape"
    >
      <View style={localStyles.titleContainer}>
        <Text style={localStyles.titleText}>{title}</Text>
      </View>

      <View style={[pdfStyles.table, { borderTopWidth: 0 }]}>
        {/* Encabezado Principal */}
        <View style={localStyles.tableHeader}>
          <Text style={[localStyles.headerCell, { width: '3%', fontSize: 5 }]}>N°</Text>
          <Text style={[localStyles.headerCell, { width: '6%', fontSize: 5 }]}>REGIÓN</Text>
          <Text style={[localStyles.headerCell, { width: '6%', fontSize: 5 }]}>NÚCLEO</Text>
          <Text style={[localStyles.headerCell, { width: '7%', fontSize: 5 }]}>EXTENSIÓN</Text>
          <Text style={[localStyles.headerCell, { width: '8%', fontSize: 5 }]}>CARRERA</Text>
          <Text style={[localStyles.headerCell, { width: '10%', fontSize: 5 }]}>NOMBRE Y APELLIDO DEL ESTUDIANTE</Text>
          <Text style={[localStyles.headerCell, { width: '6%', fontSize: 5 }]}>C.I.</Text>
          
          {/* Grupo: Tutores Académicos */}
          <View style={{ width: '12%', flexDirection: 'column' }}>
            <View style={[localStyles.headerCell, { borderRightWidth: 0, width: '100%', height: 12 }]}>
              <Text style={{ fontSize: 5, textAlign: 'center', fontWeight: 'bold' }}>TUTORES ACADEMICOS</Text>
            </View>
            <View style={{ flexDirection: 'row', height: 18 }}>
              <Text style={[localStyles.headerCell, { flex: 2, fontSize: 4 }]}>NOMBRE Y APELLIDO</Text>
              <Text style={[localStyles.headerCell, { flex: 1, fontSize: 4, borderRightWidth: 0 }]}>TELÉFONO</Text>
            </View>
          </View>

          {/* Grupo: Tutores Metodológicos */}
          <View style={{ width: '12%', flexDirection: 'column' }}>
            <View style={[localStyles.headerCell, { borderRightWidth: 0, width: '100%', height: 12 }]}>
              <Text style={{ fontSize: 5, textAlign: 'center', fontWeight: 'bold' }}>TUTORES METODOLÓGICOS</Text>
            </View>
            <View style={{ flexDirection: 'row', height: 18 }}>
              <Text style={[localStyles.headerCell, { flex: 2, fontSize: 4 }]}>NOMBRE Y APELLIDO</Text>
              <Text style={[localStyles.headerCell, { flex: 1, fontSize: 4, borderRightWidth: 0 }]}>TELÉFONO</Text>
            </View>
          </View>

          {/* Grupo: Institución */}
          <View style={{ width: '18%', flexDirection: 'column' }}>
            <View style={[localStyles.headerCell, { borderRightWidth: 0, width: '100%', height: 12 }]}>
              <Text style={{ fontSize: 5, textAlign: 'center', fontWeight: 'bold' }}>INSTITUCIÓN</Text>
            </View>
            <View style={{ flexDirection: 'row', height: 18 }}>
              <Text style={[localStyles.headerCell, { flex: 1, fontSize: 4 }]}>NOMBRE</Text>
              <Text style={[localStyles.headerCell, { flex: 1, fontSize: 4 }]}>DIRECCIÓN</Text>
              <Text style={[localStyles.headerCell, { flex: 0.8, fontSize: 4, borderRightWidth: 0 }]}>TELÉFONO</Text>
            </View>
          </View>

          {/* Grupo: Responsable Institución */}
          <View style={{ width: '12%', flexDirection: 'column', borderRightWidth: 0 }}>
            <View style={[localStyles.headerCell, { borderRightWidth: 0, width: '100%', height: 12 }]}>
              <Text style={{ fontSize: 5, textAlign: 'center', fontWeight: 'bold' }}>RESPONSABLE DE LA INSTITUCIÓN</Text>
            </View>
            <View style={{ flexDirection: 'row', height: 18 }}>
              <Text style={[localStyles.headerCell, { flex: 2, fontSize: 4 }]}>NOMBRE Y APELLIDO</Text>
              <Text style={[localStyles.headerCell, { flex: 1, fontSize: 4, borderRightWidth: 0 }]}>TELÉFONO</Text>
            </View>
          </View>
        </View>

        {/* Filas de Datos */}
        {data.map((item, index) => (
          <View key={index} style={[pdfStyles.tableRow, { borderTopWidth: 0, borderLeftWidth: 1, borderLeftColor: '#000' }]} wrap={false}>
            <Text style={[localStyles.cell, { width: '3%', fontSize: 5, textAlign: 'center' }]}>{index + 1}</Text>
            <Text style={[localStyles.cell, { width: '6%', fontSize: 5 }]}>{item.region || '-'}</Text>
            <Text style={[localStyles.cell, { width: '6%', fontSize: 5 }]}>{item.nucleus || '-'}</Text>
            <Text style={[localStyles.cell, { width: '7%', fontSize: 5 }]}>{item.extension || '-'}</Text>
            <Text style={[localStyles.cell, { width: '8%', fontSize: 5 }]}>{item.careerName || '-'}</Text>
            <Text style={[localStyles.cell, { width: '10%', fontSize: 5 }]}>{item.studentName || '-'}</Text>
            <Text style={[localStyles.cell, { width: '6%', fontSize: 5, textAlign: 'center' }]}>
              {item.identificationPrefix}-{item.identificationNumber}
            </Text>
            
            {/* Tutores Académicos */}
            <View style={{ width: '12%', flexDirection: 'row' }}>
              <Text style={[localStyles.cell, { flex: 2, fontSize: 5 }]}>{item.academicTutorName || '-'}</Text>
              <Text style={[localStyles.cell, { flex: 1, fontSize: 5 }]}>{item.academicTutorPhone || '-'}</Text>
            </View>

            {/* Tutores Metodológicos */}
            <View style={{ width: '12%', flexDirection: 'row' }}>
              <Text style={[localStyles.cell, { flex: 2, fontSize: 5 }]}>{item.methodologicalTutorName || '-'}</Text>
              <Text style={[localStyles.cell, { flex: 1, fontSize: 5 }]}>{item.methodologicalTutorPhone || '-'}</Text>
            </View>

            {/* Institución */}
            <View style={{ width: '18%', flexDirection: 'row' }}>
              <Text style={[localStyles.cell, { flex: 1, fontSize: 5 }]}>{item.institutionName || '-'}</Text>
              <Text style={[localStyles.cell, { flex: 1, fontSize: 5 }]}>{item.institutionAddress || '-'}</Text>
              <Text style={[localStyles.cell, { flex: 0.8, fontSize: 5 }]}>{item.institutionPhone || '-'}</Text>
            </View>

            {/* Responsable */}
            <View style={{ width: '12%', flexDirection: 'row', borderRightWidth: 0 }}>
              <Text style={[localStyles.cell, { flex: 2, fontSize: 5 }]}>{item.institutionResponsibleName || '-'}</Text>
              <Text style={[localStyles.cell, { flex: 1, fontSize: 5, borderRightWidth: 0 }]}>{item.institutionResponsiblePhone || '-'}</Text>
            </View>
          </View>
        ))}
      </View>
    </PDFLayout>
  );
};
