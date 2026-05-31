import { Request, Response, NextFunction } from 'express';

export function validatePracticeId(req: Request, res: Response, next: NextFunction) {
  const id = parseInt(String(req.params.practiceId));
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'ID de práctica inválido' });
  }
  next();
}

export function validateTutorId(req: Request, res: Response, next: NextFunction) {
  const id = parseInt(String(req.params.tutorId));
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'ID de tutor inválido' });
  }
  next();
}

export function validateReportPeriodParams(req: Request, _res: Response, next: NextFunction) {
  if (req.query.periodId) {
    const id = parseInt(req.query.periodId as string);
    if (isNaN(id) || id <= 0) {
      req.query.periodId = '';
    }
  }
  if (req.query.careerId) {
    const id = parseInt(req.query.careerId as string);
    if (isNaN(id) || id <= 0) {
      req.query.careerId = '';
    }
  }
  next();
}

export function validateTextTemplate(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'POST') {
    const { reportType, section, contentTemplate } = req.body;
    if (!reportType || typeof reportType !== 'string') {
      return res.status(400).json({ success: false, message: 'reportType es requerido' });
    }
    if (!section || typeof section !== 'string') {
      return res.status(400).json({ success: false, message: 'section es requerido' });
    }
    if (!contentTemplate || typeof contentTemplate !== 'string') {
      return res.status(400).json({ success: false, message: 'contentTemplate es requerido' });
    }
  }
  next();
}
