/**
 * @file audit.routes.ts
 * @description Routes for audit logs endpoints
 */

import { Router } from 'express';
import * as auditController from '../controllers/audit.controller.js';

const router = Router();

// GET /api/audit - List all audit logs with filters
router.get('/', auditController.getAuditLogs);

// GET /api/audit/tables - Get list of audited tables
router.get('/tables', auditController.getAuditTables);

// GET /api/audit/stats - Get audit statistics
router.get('/stats', auditController.getAuditStats);

// GET /api/audit/record/:tableName/:recordId - Get history for a specific record
router.get('/record/:tableName/:recordId', auditController.getRecordHistory);

// GET /api/audit/:id - Get single audit log by ID
router.get('/:id', auditController.getAuditLogById);

export default router;
