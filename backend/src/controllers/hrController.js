const db = require('../config/db');

// ─── EMPLOYEES ───────────────────────────────────────────

exports.getEmployees = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addEmployee = async (req, res) => {
  const { employee_id, full_name, email, phone, department, position, employment_type, date_hired, salary } = req.body;
  try {
    await db.query(
      'INSERT INTO employees (employee_id, full_name, email, phone, department, position, employment_type, date_hired, salary) VALUES (?,?,?,?,?,?,?,?,?)',
      [employee_id, full_name, email, phone, department, position, employment_type, date_hired, salary]
    );
    res.json({ message: 'Employee added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  const { full_name, email, phone, department, position, employment_type, salary, status } = req.body;
  try {
    await db.query(
      'UPDATE employees SET full_name=?, email=?, phone=?, department=?, position=?, employment_type=?, salary=?, status=? WHERE id=?',
      [full_name, email, phone, department, position, employment_type, salary, status, req.params.id]
    );
    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── ATTENDANCE ──────────────────────────────────────────

exports.getAttendance = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, e.full_name, e.employee_id as emp_code, e.department
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       ORDER BY a.date DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addAttendance = async (req, res) => {
  const { employee_id, date, time_in, time_out, status, remarks } = req.body;
  try {
    await db.query(
      'INSERT INTO attendance (employee_id, date, time_in, time_out, status, remarks) VALUES (?,?,?,?,?,?)',
      [employee_id, date, time_in, time_out, status, remarks]
    );
    res.json({ message: 'Attendance recorded' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PAYROLL ─────────────────────────────────────────────

exports.getPayroll = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, e.full_name, e.employee_id as emp_code, e.department
       FROM payroll p
       JOIN employees e ON p.employee_id = e.id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.generatePayroll = async (req, res) => {
  const { employee_id, period_start, period_end, basic_salary, deductions, notes } = req.body;
  const net_salary = basic_salary - deductions;
  try {
    await db.query(
      'INSERT INTO payroll (employee_id, period_start, period_end, basic_salary, deductions, net_salary, notes) VALUES (?,?,?,?,?,?,?)',
      [employee_id, period_start, period_end, basic_salary, deductions, net_salary, notes || null]
    );
    res.json({ message: 'Payroll generated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.markAsPaid = async (req, res) => {
  try {
    await db.query('UPDATE payroll SET status = ? WHERE id = ?', ['paid', req.params.id]);
    res.json({ message: 'Payroll marked as paid' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePayroll = async (req, res) => {
  const { basic_salary, deductions, net_salary, status, notes } = req.body;
  try {
    await db.query(
      'UPDATE payroll SET basic_salary=?, deductions=?, net_salary=?, status=?, notes=? WHERE id=?',
      [basic_salary, deductions, net_salary, status, notes || null, req.params.id]
    );
    res.json({ message: 'Payroll updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};