import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import * as prospectsController from '../controllers/prospects.controller.js';

const router = Router();

// Lists CRUD
router.get('/lists', requirePermission('enrollments:view'), prospectsController.getLists);
router.get('/lists/:id', requirePermission('enrollments:view'), prospectsController.getListById);
router.post('/lists', requirePermission('enrollments:create'), prospectsController.createList);
router.put('/lists/:id', requirePermission('enrollments:edit'), prospectsController.updateList);
router.delete('/lists/:id', requirePermission('enrollments:delete'), prospectsController.deleteList);

// List items
router.get('/lists/:id/items', requirePermission('enrollments:view'), prospectsController.getListItems);
router.post('/lists/:id/items', requirePermission('enrollments:create'), prospectsController.addListItem);
router.post('/lists/:id/items/bulk', requirePermission('enrollments:create'), prospectsController.bulkAddListItems);
router.delete('/lists/:id/items/:itemId', requirePermission('enrollments:delete'), prospectsController.removeListItem);
router.patch('/lists/:id/items/:itemId', requirePermission('enrollments:edit'), prospectsController.toggleEnrolled);

// Eligible students
router.get('/eligible-students', requirePermission('enrollments:view'), prospectsController.getEligibleStudents);

export default router;
