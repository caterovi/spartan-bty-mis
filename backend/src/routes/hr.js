const express = require('express');
const router = express.Router();
const hr = require('../controllers/hrController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Employees - Admin and HR only
router.get('/employees', authenticateToken, requireRole(['admin', 'hr']), hr.getEmployees);
router.get('/employees/:id', authenticateToken, requireRole(['admin', 'hr']), validate('params', 'employee'), hr.getEmployeeById);
router.post('/employees', authenticateToken, requireRole(['admin', 'hr']), validate('employee'), hr.addEmployee);
router.put('/employees/:id', authenticateToken, requireRole(['admin', 'hr']), validate('employee'), hr.updateEmployee);
router.delete('/employees/:id', authenticateToken, requireRole(['admin']), hr.deleteEmployee);

// Attendance - Admin and HR only
router.get('/attendance', authenticateToken, requireRole(['admin', 'hr']), hr.getAttendance);
router.post('/attendance', authenticateToken, requireRole(['admin', 'hr']), hr.addAttendance);

// Payroll - Admin and HR only
router.get('/payroll', authenticateToken, requireRole(['admin', 'hr']), hr.getPayroll);
router.post('/payroll', authenticateToken, requireRole(['admin', 'hr']), hr.generatePayroll);
router.put('/payroll/:id/pay', authenticateToken, requireRole(['admin', 'hr']), hr.markAsPaid);

module.exports = router;