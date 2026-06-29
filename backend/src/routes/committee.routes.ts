import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import { getCommitteeAssignments, upsertCommitteeAssignment } from '../controllers/evaluation.controller.js';

const router = Router();

router.get('/:practiceId', requirePermission('evaluations:view'), getCommitteeAssignments);
router.post('/', requirePermission('committee:assign'), upsertCommitteeAssignment);

export default router;
