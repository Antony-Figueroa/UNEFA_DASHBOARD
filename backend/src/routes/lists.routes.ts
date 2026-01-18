import { Router } from 'express';
import * as listsController from '../controllers/lists.controller.js';

const router = Router();

router.get('/', listsController.getAllLists);
router.get('/:name', listsController.getListByName);
router.post('/multiple', listsController.getMultipleListsByNames);

// Management routes
router.post('/', listsController.createList);
router.put('/:id', listsController.updateList);
router.patch('/:id/status', listsController.toggleListStatus);

router.post('/values', listsController.createValue);
router.put('/values/:id', listsController.updateValue);
router.patch('/values/:id/status', listsController.toggleValueStatus);

export default router;
