import { Router } from 'express';
import * as listsController from '../controllers/lists.controller.js';

const router = Router();

router.get('/', listsController.getAllLists);
router.get('/:name', listsController.getListByName);
router.post('/multiple', listsController.getMultipleListsByNames);

export default router;
