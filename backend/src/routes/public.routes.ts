import { Router } from 'express';
import * as listsController from '../controllers/lists.controller.js';

const router = Router();

router.get('/phone-prefixes', listsController.getPhonePrefixes);

export default router;
