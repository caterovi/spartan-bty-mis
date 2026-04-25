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

router.delete(
  '/employees/:id',
  authenticateToken,
  requireRole(['admin']),
  validate('params_id', 'params'),
  hr.deleteEmployee
);

// Attendance - Admin and HR only
router.get(
  '/attendance',
  authenticateToken,
  requireRole(['admin', 'hr']),
  hr.getAttendance
);

router.post(
  '/attendance',
  authenticateToken,
  requireRole(['admin', 'hr']),
  validate('attendanceCreate'),
  hr.addAttendance
);

// Payroll - Admin and HR only
router.get(
  '/payroll',
  authenticateToken,
  requireRole(['admin', 'hr']),
  hr.getPayroll
);

router.post(
  '/payroll',
  authenticateToken,
  requireRole(['admin', 'hr']),
  validate('payrollCreate'),
  hr.generatePayroll
);

router.put(
  '/payroll/:id',
  authenticateToken,
  requireRole(['admin', 'hr']),
  validate('params_id', 'params'),
  validate('payrollUpdate'),
  hr.updatePayroll
);

router.patch(
  '/payroll/:id/pay',
  authenticateToken,
  requireRole(['admin', 'hr']),
  validate('params_id', 'params'),
  hr.markAsPaid
);

module.exports = router;