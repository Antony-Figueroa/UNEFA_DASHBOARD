/**
 * @file audit.routes.ts
 * @description Routes for audit logs endpoints
 */

import { Router } from 'express';
import { requirePermission } from '../middlewares/auth.middleware.js';
import * as auditController from '../controllers/audit.controller.js';

const router = Router();

// GET /api/audit - List all audit logs with filters
router.get('/', requirePermission('activity-logs:view'), auditController.getAuditLogs);

// GET /api/audit/tables - Get list of audited tables
router.get('/tables', requirePermission('activity-logs:view'), auditController.getAuditTables);

// GET /api/audit/stats - Get audit statistics
router.get('/stats', requirePermission('activity-logs:view'), auditController.getAuditStats);

// GET /api/audit/record/:tableName/:recordId - Get history for a specific record
router.get('/record/:tableName/:recordId', requirePermission('activity-logs:view'), auditController.getRecordHistory);

// GET /api/audit/:id - Get single audit log by ID
router.get('/:id', requirePermission('activity-logs:view'), auditController.getAuditLogById);

export default router;
