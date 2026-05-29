import { Router } from 'express';
import {
  getDataAceptacionTutor,
  getDataSolicitudInstitucion,
  getDataCartaPostulacion,
  getDataActaValidacion,
  getDataEvaluacionFinal,
  getDataEvaluacionTutorInstitucional,
  getDataEvaluacionTutorAcademico,
  getDataEvaluacionComite,
  getDataConstanciaTutorAcademico,
  getDataConstanciaTutorInstitucional,
} from '../controllers/institutional-documents.controller.js';
import { requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/aceptacion-tutor/:practiceId', requirePermission('reports:view'), getDataAceptacionTutor);
router.get('/solicitud-institucion/:practiceId', requirePermission('reports:view'), getDataSolicitudInstitucion);
router.get('/carta-postulacion/:practiceId', requirePermission('reports:view'), getDataCartaPostulacion);
router.get('/acta-validacion/:practiceId', requirePermission('reports:view'), getDataActaValidacion);
router.get('/evaluacion-final/:practiceId', requirePermission('reports:view'), getDataEvaluacionFinal);
router.get('/evaluacion-tutor-institucional/:practiceId', requirePermission('reports:view'), getDataEvaluacionTutorInstitucional);
router.get('/evaluacion-tutor-academico/:practiceId', requirePermission('reports:view'), getDataEvaluacionTutorAcademico);
router.get('/evaluacion-comite/:practiceId', requirePermission('reports:view'), getDataEvaluacionComite);
router.get('/constancia-tutor-academico/:tutorId', requirePermission('reports:view'), getDataConstanciaTutorAcademico);
router.get('/constancia-tutor-institucional/:tutorId', requirePermission('reports:view'), getDataConstanciaTutorInstitucional);

export default router;
