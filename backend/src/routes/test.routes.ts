import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ message: 'Test endpoint working' });
});

export default router;