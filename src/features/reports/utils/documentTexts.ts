export const FALLBACK_TEXTOS: Record<string, Record<string, string>> = {
  aceptacion_tutor: {
    encabezado: 'Por medio de la presente, yo, {{tutorTitulo}} {{tutorNombreCompleto}}, portador(a) de la C.I. {{tutorCi}}, en mi carácter de Tutor(a) Académico(a), ACEPTO formalmente tutoriar al(la) estudiante {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, cursante de la carrera {{carrera}}, durante el desarrollo de sus Prácticas Profesionales.',
    firma: '___________________________________\n{{tutorTitulo}} {{tutorNombreCompleto}}\nTutor(a) Académico(a)\nC.I.: {{tutorCi}}\nTeléfono: {{tutorTelefono}}',
  },
  solicitud_institucion: {
    destinatario: 'MSc. Marbelys del Valle Rivero',
    cargo: 'Decana del Núcleo Portuguesa',
    orden: 'Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022',
    cuerpo: 'Yo, {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, cursante de la carrera {{carrera}}, ante usted ocurro para solicitar formalmente la asignación de la institución {{institucionNombre}} para la realización de mis Prácticas Profesionales correspondientes al lapso académico {{lapsoInicio}} - {{lapsoFin}}.',
    firma: '___________________________________\nMSc. Marbelys del Valle Rivero\nDecana del Núcleo Portuguesa\nSegún Orden administrativa N° 0005 de fecha 18 de Marzo 2022',
  },
  carta_postulacion: {
    cuerpo: 'Por medio de la presente, se solicita formalmente la Carta de Postulación para el(la) estudiante {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, cursante de la carrera {{carrera}}, {{semestre}} semestre, sección {{seccion}}, a fin de que pueda realizar sus Prácticas Profesionales en la institución {{institucionNombre}}. El(la) estudiante se encuentra en régimen {{regimen}} y {{empleo}} labora actualmente.',
  },
  acta_validacion: {
    cuerpo: 'Se deja constancia que el(la) ciudadano(a) {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, cursante de la carrera {{carrera}}, ha cumplido con todos los requisitos académicos y administrativos establecidos para la validación de sus Prácticas Profesionales.',
  },
  evaluacion_final: {
    encabezado: 'Se presenta la Evaluación Final de las Prácticas Profesionales realizadas por el(la) estudiante {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, de la carrera {{carrera}}, en la institución {{institucionNombre}}, durante el período comprendido entre {{fechaInicio}} y {{fechaFin}}.',
  },
  evaluacion_tutor_institucional: {
    encabezado: 'Evaluación del Tutor Institucional correspondiente al(la) estudiante {{estudianteNombreCompleto}}, de la carrera {{carrera}}, realizada en el Departamento de {{departamento}} de la institución {{institucionNombre}}.',
  },
  evaluacion_tutor_academico: {
    encabezado: 'Evaluación del Tutor Académico para el(la) estudiante {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, de la carrera {{carrera}}, durante el período {{periodo}}.',
  },
  evaluacion_comite: {
    encabezado: 'Acta de Evaluación del Comité Evaluador para el(la) estudiante {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, de la carrera {{carrera}}, correspondiente al período académico {{periodo}}.',
  },
  constancia_tutor_academico: {
    cuerpo: 'Por medio de la presente se hace constar que el(la) ciudadano(a) {{tutorTitulo}} {{tutorNombreCompleto}}, portador(a) de la C.I. {{tutorCi}}, se desempeña como Tutor(a) Académico(a) de Prácticas Profesionales, en condición {{tutorCondicion}}, con dedicación {{tutorDedicacion}}, cumpliendo un total de {{totalHours}} horas académicas, durante el período {{periodo}}.',
    firma: '___________________________________\nMSc. Marbelys del Valle Rivero\nDecana del Núcleo Portuguesa\nSegún Orden administrativa N° 0005 de fecha 18 de Marzo 2022',
  },
  constancia_tutor_institucional: {
    cuerpo: 'Por medio de la presente se hace constar que el(la) ciudadano(a) {{tutorTitulo}} {{tutorNombreCompleto}}, portador(a) de la C.I. {{tutorCi}}, se desempeñó como Tutor(a) Institucional de Prácticas Profesionales en la institución {{institucionNombre}}, cumpliendo un total de {{totalHours}} horas de tutoría, durante el período {{periodo}}.',
    firma: '___________________________________\nMSc. Marbelys del Valle Rivero\nDecana del Núcleo Portuguesa\nSegún Orden administrativa N° 0005 de fecha 18 de Marzo 2022',
  },
};
