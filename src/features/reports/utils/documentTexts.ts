export const FALLBACK_TEXTOS: Record<string, Record<string, string>> = {
  aceptacion_tutor: {
    encabezado: `Yo, {{tutorTitulo}} {{tutorNombreCompleto}}, titular de la cedula de identidad {{tutorCi}}, hago constar por medio de la presente que acepto la tutoría académica de la práctica profesional por parte de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional (UNEFA) del (la) bachiller {{estudianteNombreCompleto}}, titular de la cedula de identidad {{estudianteCi}} para optar al grado de {{carrera}}.

Acepto asesorar al participante en calidad de tutor institucional, durante la etapa de desarrollo del informe de pasantía.

En {{lugar}}, a los {{dia}} días del mes de {{mes}} del {{anio}}.

_________________________________
{{tutorTitulo}} {{tutorNombreCompleto}}
C.I.: {{tutorCi}}
Teléfono: {{tutorTelefono}}`,
    firma: '___________________________________\n{{tutorTitulo}} {{tutorNombreCompleto}}\nTutor(a) Académico(a)\nC.I.: {{tutorCi}}\nTeléfono: {{tutorTelefono}}',
  },
  solicitud_institucion: {
    destinatario: 'MSc. Marbelys del Valle Rivero',
    cargo: 'Decana del Núcleo Portuguesa',
    orden: 'Según Orden administrativa N° 0005 de fecha 18 de marzo de 2022',
    cuerpo: 'Yo, {{estudianteNombreCompleto}}, titular de la C.I. {{estudianteCi}}, cursante de la carrera {{carrera}}, ante usted ocurro para solicitar formalmente la asignación de la institución {{institucionNombre}} para la realización de mis Prácticas Profesionales correspondientes al lapso académico {{lapsoInicio}} - {{lapsoFin}}.',
    firma: '___________________________________\nMSc. Marbelys del Valle Rivero\nDecana del Núcleo Portuguesa\nSegún Orden administrativa N° 0005 de fecha 18 de marzo de 2022',
  },
  carta_postulacion: {
    cuerpo: `CIUDADANO:
DECANA UNEFA NÚCLEO PORTUGUESA
SU DESPACHO

Tengo el honor de dirigirme a usted en la oportunidad de solicitarle la Carta de Postulación correspondiente al proceso de Práctica Profesional; solicitud que respetuosamente hago llegar para su conocimiento y fines consiguientes.

NOMBRES Y APELLIDOS:    {{estudianteNombreCompleto}}
CÉDULA DE IDENTIDAD:     {{estudianteCi}}
NÚMEROS DE CONTACTO:  {{estudianteTelefono}}
CORREO ELECTRÓNICO:   {{estudianteEmail}}
RÉGIMEN: {{regimen}}
CARRERA:    {{carrera}}
SEMESTRE:  {{semestre}}
TRABAJO:  {{empleo}}
NOMBRE DE LA INSTITUCIÓN DONDE REALIZARÉ LAS PRÁCTICAS PROFESIONALES: {{institucionNombre}}
NOMBRE Y APELLIDOS DEL (DE LA) GERENTE DE TALENTO HUMANO DE LA INSTITUCIÓN DONDE REALIZARÉ LAS PRÁCTICAS: {{tutorInstitucionalNombre}}

_________________________________              ___________________________________
      FIRMA DEL ESTUDIANTE                    FIRMA Y SELLO DE LA COORDINACIÓN
                                               DE PRÁCTICA PROFESIONAL DEL NÚCLEO`,
  },
  acta_validacion: {
    cuerpo: `Quienes suscriben, Tutor Académico, Tutor Evaluador Especialista y Tutor Metodológico hacemos constar que el informe de Prácticas Profesionales de la carrera: {{carrera}}, presentado por el (la) bachiller: {{estudianteNombreCompleto}}, C.I. N° {{estudianteCi}}, está apto, revisado y aprobado para ser entregado a la coordinación de Prácticas Profesionales en los lapsos establecidos para tal fin, por lo que está autorizado para defensa y demás fines consiguientes.

Sin otro particular,

DOCENTE                    FIRMA                    OBSERVACIONES
Tutor Académico           ____________________      ____________________



Tutor Evaluador           ____________________      ____________________
Especialista



Tutor Metodológico        ____________________      ____________________



Conforme Pasante: {{estudianteNombreCompleto}}
Fecha: {{fechaValidacion}}`,
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
    cuerpo: `Quien suscribe, MARBELYS DEL VALLE RIVERO, Decana del Núcleo Portuguesa de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana (UNEFA), hace constar por medio de la presente, que el (la) ciudadano (a) {{tutorTitulo}} {{tutorNombreCompleto}}, titular de la Cédula de Identidad Nº {{tutorCi}}, Docente, {{tutorCondicion}}, a tiempo, {{tutorDedicacion}}, se desempeñó como Tutor Académico de la asignatura Pasantía, del (de la) estudiante {{estudianteNombreCompleto}}, titular de la Cédula de Identidad Nº {{estudianteCi}}, cumpliendo un total de {{totalHours}} horas académicas efectuadas en el periodo académico {{periodo}}, comprendido entre las fechas {{inicioLapso}} y {{finLapso}}.

Constancia que se expide a petición de parte interesada, en Guanare, a los {{dia}} días del mes de {{mes}} del {{anio}}.`,
    firma: '___________________________________\nMSc. Marbelys del Valle Rivero\nDecana del Núcleo Portuguesa\nSegún Orden administrativa N° 0005 de fecha 18 de Marzo 2022',
  },
  constancia_tutor_institucional: {
    destinatario: '{{institucionNombre}}',
    cuerpo: `Señor(a):
{{institucionNombre}}
Presente.

Atención: {{tutorTitulo}} {{tutorNombreCompleto}}.

    Tengo el agrado de dirigirme a usted, en la oportunidad de extender nuestro sincero agradecimiento por su apoyo y participación incondicional, al desempeñarse como Tutor Institucional de la asignatura Práctica Profesional (Pasantía) de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana (UNEFA), al asesorar, supervisar y evaluar estudiantes, colaborando de esta forma en el proceso formativo y de capacitación integral de estos futuros profesionales, realizando un acompañamiento con un total de {{totalHours}} horas, en el periodo académico {{periodo}}, comprendido entre las fechas {{inicioLapso}} y {{finLapso}}.

    Sin otro particular al cual referirme, me despido de usted quedando a sus gratas órdenes.`,
    firma: '___________________________________\nMSc. Marbelys del Valle Rivero\nDECANA\nSegún Orden Administrativa N° 0005 de fecha 18 de Marzo 2022',
  },
};
