import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import * as listsController from '../controllers/lists.controller.js';

const router = Router();

// Read routes - require lists:view
router.get('/', requirePermission('lists:view'), listsController.getAllLists);
router.get('/:name', requirePermission('lists:view'), listsController.getListByName);
router.post('/multiple', requirePermission('lists:view'), listsController.getMultipleListsByNames);

// Management routes - require lists:edit
router.post('/', requirePermission('lists:edit'), listsController.createList);
router.put('/:id', requirePermission('lists:edit'), listsController.updateList);
router.delete('/:id', requirePermission('lists:edit'), listsController.deleteList);
router.patch('/:id/status', requirePermission('lists:edit'), listsController.toggleListStatus);

router.post('/values', requirePermission('lists:edit'), listsController.createValue);
router.put('/values/:id', requirePermission('lists:edit'), listsController.updateValue);
router.delete('/values/:id', requirePermission('lists:edit'), listsController.deleteValue);
router.patch('/values/:id/status', requirePermission('lists:edit'), listsController.toggleValueStatus);

export default router;
