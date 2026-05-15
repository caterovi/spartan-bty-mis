const express = require('express');
const router = express.Router();
const hr = require('../controllers/hrController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Employees - Admin and HR only
router.get(
  '/employees',
  authenticateToken,
  requireRole(['admin', 'hr']),
  hr.getEmployees
);

router.get(
  '/employees/:id',
  authenticateToken,
  requireRole(['admin', 'hr']),
  validate('params_id', 'params'),
  hr.getEmployeeById
);

router.post(
  '/employees',
  authenticateToken,
  requireRole(['admin', 'hr']),
  validate('employeeCreate'),
  hr.addEmployee
);

router.put(
  '/employees/:id',
  authenticateToken,
  requireRole(['admin', 'hr']),
  validate('params_id', 'params'),
  validate('employeeUpdate'),
  hr.updateEmployee
);

router.put(
  '/employees/:id/archive',
  authenticateToken,
  requireRole(['admin', 'hr']),
  hr.archiveEmployee
);

router.delete(
  '/employees/:id',
  authenticateToken,
  requireRole(['admin']),
  validate('params_id', 'params'),
  hr.deleteEmployee
);

// Attendance
router.get('/attendance/summary/today',    authenticateToken, requireRole(['admin','hr']), hr.getTodaySummary);
router.get('/attendance/monthly-summary',  authenticateToken, requireRole(['admin','hr']), hr.getMonthlySummary);
router.get('/attendance',                  authenticateToken, requireRole(['admin','hr']), hr.getAttendance);
router.post('/attendance',                 authenticateToken, requireRole(['admin','hr']), validate('attendanceCreate'), hr.addAttendance);
router.put('/attendance/:id',              authenticateToken, requireRole(['admin','hr']), validate('params_id','params'), hr.updateAttendance);
router.delete('/attendance/:id',           authenticateToken, requireRole(['admin','hr']), validate('params_id','params'), hr.deleteAttendance);

// ─────────────────────────────────────────────────────────────────────────────
// HR ROUTES — PAYROLL SECTION (replace existing payroll block in hrRoutes.js)
// All Employees and Attendance routes above remain UNCHANGED.
// ─────────────────────────────────────────────────────────────────────────────

// Payroll — Admin and HR only

// GET all payroll records
router.get(
  '/payroll',
  authenticateToken,
  requireRole(['admin', 'hr']),
  hr.getPayroll
);

// GET attendance preview for generate form (live computation, no DB write)
router.get(
  '/payroll/attendance-preview',
  authenticateToken,
  requireRole(['admin', 'hr']),
  hr.getAttendancePreview
);

// POST generate payroll (attendance-based)
router.post(
  '/payroll',
  authenticateToken,
  requireRole(['admin', 'hr']),
  hr.generatePayroll          // validation is done inline in the controller
);

// PUT edit adjustments (allowances, OT, other deductions, notes)
router.put(
  '/payroll/:id',
  authenticateToken,
  requireRole(['admin', 'hr']),
  hr.updatePayroll
);

// PATCH mark as processed (pending → processed)
router.patch(
  '/payroll/:id/process',
  authenticateToken,
  requireRole(['admin', 'hr']),
  hr.markAsProcessed
);

// PATCH mark as paid (pending/processed → paid)
router.patch(
  '/payroll/:id/pay',
  authenticateToken,
  requireRole(['admin', 'hr']),
  hr.markAsPaid
);

// PATCH cancel payroll (soft cancel, stays in history)
router.patch(
  '/payroll/:id/cancel',
  authenticateToken,
  requireRole(['admin', 'hr']),
  hr.cancelPayroll
);

module.exports = router;