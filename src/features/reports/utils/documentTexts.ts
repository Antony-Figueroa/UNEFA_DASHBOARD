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
    encabezado: `REPÚBLICA BOLIVARIANA DE VENEZUELA
MINISTERIO DEL PODER POPULAR PARA LA DEFENSA
UNIVERSIDAD NACIONAL EXPERIMENTAL POLITÉCNICA
DE LA FUERZA ARMADA NACIONAL BOLIVARIANA
VICERRECTORADO REGIÓN LOS LLANOS
NÚCLEO PORTUGUESA EXTENSIÓN ACARIGUA

{{lugar}}, {{dia}} de {{mes}} del {{anio}}

Señores:
{{institucionNombre}}
Presente
Atte: {{destinatario}}
{{cargo}}`,
    cuerpo: `Tengo el agrado de dirigirme a usted, en la oportunidad de presentarle a el Bachiller {{estudianteNombreCompleto}}, titular de la cédula de identidad ({{estudianteCi}}), estudiante de la carrera {{carrera}}, el mencionado Bachiller está autorizado para realizar trámites en la Organización que usted representa, relacionados con la posibilidad de desarrollar en su práctica profesional un proyecto con un mínimo de 480 horas laborales, comprendidas desde {{lapsoInicio}} hasta {{lapsoFin}}.

Es necesario señalar que, el estudiante que obtenga de usted la autorización para realizar la práctica profesional, reciba de la organización la carta de aceptación, plan de trabajo, resumen curricular del tutor institucional, los recursos y el asesoramiento requerido para el cumplimiento de las actividades asignadas. Así mismo, es importante destacar que la Organización se compromete a entregar la evaluación realizada por el tutor institucional y el certificado de culminación el último día de las prácticas.

Por otra parte, el bachiller será supervisado durante dos (2) oportunidades por un docente, debidamente autorizado por la UNEFA, Anexo a esta carta, se facilita el perfil del egresado del estudiante.

Agradeciendo la atención sobre este particular, quedo de usted.

Atentamente,`,
    destinatario: 'MSc. Marbelys del Valle Rivero',
    cargo: 'Decana del Núcleo Portuguesa',
    firmaNombre: 'MSc. Marbelys del Valle Rivero',
    firmaCargo: 'Decana del Núcleo Portuguesa',
    firmaOrden: 'Según Orden administrativa N° 0005 de fecha 18 de Marzo 2022',
    firma: '___________________________________\n{{firmaNombre}}\n{{firmaCargo}}\n{{firmaOrden}}',
  },
  carta_postulacion: {
    cuerpo: `CIUDADANO:
DECANA UNEFA NÚCLEO PORTUGUESA
SU DESPACHO

Tengo el honor de dirigirme a usted en la oportunidad de solicitarle la Carta de Postulación correspondiente al proceso de Práctica Profesional; solicitud que respetuosamente hago llegar para su conocimiento y fines consiguientes.`,
    acta: `Quienes suscriben, Tutor Académico, Tutor Evaluador Especialista y Tutor Metodológico hacemos constar que el informe de Prácticas Profesionales de la carrera: {{carrera}}, presentado por el (la) bachiller: {{estudianteNombreCompleto}}, C.I. N° {{estudianteCi}}, está apto, revisado y aprobado para ser entregado a la coordinación de Prácticas Profesionales en los lapsos establecidos para tal fin, por lo que está autorizado para defensa y demás fines consiguientes.

Sin otro particular,`,
  },
  acta_validacion: {
    cuerpo: `Quienes suscriben, Tutor Académico, Tutor Evaluador Especialista y Tutor Metodológico hacemos constar que el informe de Prácticas Profesionales de la carrera: {{carrera}}, presentado por el (la) bachiller: {{estudianteNombreCompleto}}, C.I. N° {{estudianteCi}}, está apto, revisado y aprobado para ser entregado a la coordinación de Prácticas Profesionales en los lapsos establecidos para tal fin, por lo que está autorizado para defensa y demás fines consiguientes.

Sin otro particular,`,
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
