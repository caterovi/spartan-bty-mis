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
  const { id } = req.validated.params;
  try {
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addEmployee = async (req, res) => {
  const {
    employee_id, full_name, email, phone,
    department, position, employment_type, date_hired, salary,
  } = req.validated.body;

  // Backend validation
  if (!full_name?.trim()) return res.status(400).json({ message: 'Full name is required.' });
  if (!email?.trim()) return res.status(400).json({ message: 'Email is required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Invalid email format.' });
  if (phone && !/^09\d{9}$/.test(phone)) return res.status(400).json({ message: 'Phone must follow 09XXXXXXXXX format.' });
  if (!department) return res.status(400).json({ message: 'Department is required.' });
  if (!position?.trim()) return res.status(400).json({ message: 'Position is required.' });
  if (!employment_type) return res.status(400).json({ message: 'Employment type is required.' });
  if (!date_hired) return res.status(400).json({ message: 'Date hired is required.' });
  if (!salary || Number(salary) <= 0) return res.status(400).json({ message: 'Salary must be a positive number.' });

  try {
    await db.query(
      `INSERT INTO employees
        (employee_id, full_name, email, phone, department, position, employment_type, date_hired, salary)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [employee_id, full_name, email, phone || null, department, position, employment_type, date_hired, salary]
    );
    res.json({ message: 'Employee added successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('email')) return res.status(400).json({ message: 'Email already exists.' });
      return res.status(400).json({ message: 'Employee ID already exists.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  const { id } = req.validated.params;
  const {
    full_name, email, phone, department, position,
    employment_type, salary, status,
  } = req.validated.body;

  if (!full_name?.trim()) return res.status(400).json({ message: 'Full name is required.' });
  if (!email?.trim()) return res.status(400).json({ message: 'Email is required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Invalid email format.' });
  if (phone && !/^09\d{9}$/.test(phone)) return res.status(400).json({ message: 'Phone must follow 09XXXXXXXXX format.' });
  if (salary && Number(salary) <= 0) return res.status(400).json({ message: 'Salary must be a positive number.' });

  try {
    const [result] = await db.query(
      `UPDATE employees SET
        full_name=?, email=?, phone=?, department=?, position=?,
        employment_type=?, salary=?, status=?
       WHERE id=?`,
      [full_name, email, phone || null, department, position, employment_type, salary ?? null, status, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already used by another employee.' });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.archiveEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      `UPDATE employees SET status='inactive', archived_at=NOW() WHERE id=?`,
      [id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee archived successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEmployee = async (req, res) => {
  const { id } = req.validated.params;
  try {
    const [result] = await db.query('DELETE FROM employees WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── ATTENDANCE ──────────────────────────────────────────

const WORK_START = '09:00:00'; // configurable work start time

const calcHoursAndLate = (time_in, time_out) => {
  let total_hours = null;
  let late_minutes = 0;

  if (time_in) {
    // Late minutes: how many minutes after 09:00
    const [wh, wm] = WORK_START.split(':').map(Number);
    const [ih, im] = time_in.split(':').map(Number);
    const workStart = wh * 60 + wm;
    const inTime    = ih * 60 + im;
    late_minutes = Math.max(0, inTime - workStart);
  }

  if (time_in && time_out) {
    const [ih, im] = time_in.split(':').map(Number);
    const [oh, om] = time_out.split(':').map(Number);
    const diff = (oh * 60 + om) - (ih * 60 + im);
    total_hours = diff > 0 ? Number((diff / 60).toFixed(2)) : null;
  }

  return { total_hours, late_minutes };
};

exports.getAttendance = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*,
             e.full_name, e.employee_id AS emp_code,
             e.department, e.position
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      ORDER BY a.date DESC, a.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addAttendance = async (req, res) => {
  const { employee_id, date, time_in, time_out, status, remarks } = req.body;

  if (!employee_id) return res.status(400).json({ message: 'Employee is required.' });
  if (!date)        return res.status(400).json({ message: 'Date is required.' });
  if (!status)      return res.status(400).json({ message: 'Status is required.' });

  const needsTimeIn = ['present', 'late', 'half-day'].includes(status);
  if (needsTimeIn && !time_in) return res.status(400).json({ message: `Time In is required for status: ${status}.` });

  if (time_in && time_out) {
    const [ih, im] = time_in.split(':').map(Number);
    const [oh, om] = time_out.split(':').map(Number);
    if ((oh * 60 + om) <= (ih * 60 + im))
      return res.status(400).json({ message: 'Time Out must be after Time In.' });
  }

  // Verify employee exists
  try {
    const [[emp]] = await db.query('SELECT id FROM employees WHERE id = ?', [employee_id]);
    if (!emp) return res.status(400).json({ message: 'Employee not found.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }

  const { total_hours, late_minutes } = calcHoursAndLate(time_in, time_out);

  // Auto-correct status: if time_in is after 09:00, force late
  let finalStatus = status;
  if (status === 'present' && late_minutes > 0) finalStatus = 'late';

  try {
    await db.query(
      `INSERT INTO attendance
        (employee_id, date, time_in, time_out, total_hours, late_minutes, status, remarks)
       VALUES (?,?,?,?,?,?,?,?)`,
      [employee_id, date, time_in || null, time_out || null,
       total_hours, late_minutes, finalStatus, remarks || null]
    );
    res.json({
      message: finalStatus !== status
        ? `Attendance recorded. Status auto-adjusted to "${finalStatus}" based on time in.`
        : 'Attendance recorded successfully.',
      status: finalStatus,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Attendance already recorded for this employee on this date.' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateAttendance = async (req, res) => {
  const { time_in, time_out, status, remarks } = req.body;

  if (time_in && time_out) {
    const [ih, im] = time_in.split(':').map(Number);
    const [oh, om] = time_out.split(':').map(Number);
    if ((oh * 60 + om) <= (ih * 60 + im))
      return res.status(400).json({ message: 'Time Out must be after Time In.' });
  }

  const { total_hours, late_minutes } = calcHoursAndLate(time_in, time_out);

  let finalStatus = status;
  if (status === 'present' && late_minutes > 0) finalStatus = 'late';

  try {
    const [result] = await db.query(
      `UPDATE attendance SET
        time_in=?, time_out=?, total_hours=?, late_minutes=?, status=?, remarks=?
       WHERE id=?`,
      [time_in || null, time_out || null, total_hours, late_minutes,
       finalStatus, remarks || null, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Attendance record not found.' });
    res.json({ message: 'Attendance updated successfully.', status: finalStatus });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM attendance WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Record not found.' });
    res.json({ message: 'Attendance record deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTodaySummary = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [[{ total_active }]] = await db.query(
      `SELECT COUNT(*) AS total_active FROM employees WHERE status = 'active'`
    );
    const [[{ present }]] = await db.query(
      `SELECT COUNT(*) AS present FROM attendance WHERE date = ? AND status = 'present'`, [today]
    );
    const [[{ late }]] = await db.query(
      `SELECT COUNT(*) AS late FROM attendance WHERE date = ? AND status = 'late'`, [today]
    );
    const [[{ on_leave }]] = await db.query(
      `SELECT COUNT(*) AS on_leave FROM attendance WHERE date = ? AND status = 'leave'`, [today]
    );
    const [[{ half_day }]] = await db.query(
      `SELECT COUNT(*) AS half_day FROM attendance WHERE date = ? AND status = 'half-day'`, [today]
    );

    const recorded = present + late + on_leave + half_day;
    const absent   = Math.max(0, total_active - recorded);
    const rate     = total_active > 0
      ? Number(((present + late + half_day) / total_active * 100).toFixed(1))
      : 0;

    res.json({ total_active, present, late, on_leave, half_day, absent, rate });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = year  || new Date().getFullYear();
    const m = month || String(new Date().getMonth() + 1).padStart(2, '0');

    const [rows] = await db.query(`
      SELECT
        e.id, e.employee_id AS emp_code, e.full_name, e.department, e.position,
        COUNT(a.id)                                              AS total_records,
        SUM(a.status = 'present')                                AS days_present,
        SUM(a.status = 'late')                                   AS days_late,
        SUM(a.status = 'absent')                                 AS days_absent,
        SUM(a.status = 'leave')                                  AS days_leave,
        SUM(a.status = 'half-day')                               AS days_half,
        ROUND(SUM(COALESCE(a.total_hours, 0)), 2)                AS total_hours,
        ROUND(SUM(COALESCE(a.late_minutes, 0)) / 60, 2)          AS total_late_hours,
        SUM(COALESCE(a.late_minutes, 0))                         AS total_late_minutes
      FROM employees e
      LEFT JOIN attendance a
        ON a.employee_id = e.id
        AND YEAR(a.date) = ? AND MONTH(a.date) = ?
      WHERE e.status = 'active'
      GROUP BY e.id
      ORDER BY e.full_name ASC
    `, [y, m]);

    // Calculate working days in month (Mon-Fri)
    const daysInMonth = new Date(y, m, 0).getDate();
    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(y, m - 1, d).getDay();
      if (dow !== 0 && dow !== 6) workingDays++;
    }

    const data = rows.map(r => {
      const attended = (Number(r.days_present)||0) + (Number(r.days_late)||0) + (Number(r.days_half)||0);
      const rate = workingDays > 0 ? Number((attended / workingDays * 100).toFixed(1)) : 0;
      return { ...r, working_days: workingDays, attendance_rate: rate };
    });

    res.json({ year: y, month: m, working_days: workingDays, employees: data });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── PAYROLL (UPGRADED) ──────────────────────────────────
// Replace the entire PAYROLL section in hrController.js with this block.
// Employees and Attendance sections above are UNCHANGED.
// ── helpers ─────────────────────────────────────────────

/** Count Mon–Fri weekdays between two date strings (inclusive) */
function countWeekdays(startStr, endStr) {
  let count = 0;
  const start = new Date(startStr);
  const end   = new Date(endStr);
  const cur   = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Generate next payroll code  e.g. PAY-2026-007 */
async function nextPayrollCode() {
  const year = new Date().getFullYear();
  const [[{ cnt }]] = await db.query(
    `SELECT COUNT(*) AS cnt FROM payroll WHERE YEAR(created_at) = ?`, [year]
  );
  return `PAY-${year}-${String(Number(cnt) + 1).padStart(3, '0')}`;
}

// ─────────────────────────────────────────────────────────

exports.getPayroll = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*,
             e.full_name, e.employee_id AS emp_code,
             e.department, e.position
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /hr/payroll/generate
 * Attendance-based payroll generation.
 * Reads attendance for the period, computes all fields, saves snapshot.
 */
exports.generatePayroll = async (req, res) => {
  const {
    employee_id,
    period_start,
    period_end,
    basic_salary,      // snapshot from employee record (sent by frontend)
    working_days,      // can be sent by frontend (editable); fallback to auto-count
    allowances,
    overtime_hours,
    overtime_pay,
    other_deductions,
    notes,
  } = req.body; // use req.body directly (req.validated.body also works if validation middleware passes it through)

  // ── Basic validation ──────────────────────────────────
  if (!employee_id)  return res.status(400).json({ message: 'Employee is required.' });
  if (!period_start) return res.status(400).json({ message: 'Period start is required.' });
  if (!period_end)   return res.status(400).json({ message: 'Period end is required.' });
  if (new Date(period_end) < new Date(period_start))
    return res.status(400).json({ message: 'Period end cannot be before period start.' });
  if (!basic_salary || Number(basic_salary) < 0)
    return res.status(400).json({ message: 'Basic salary must be 0 or greater.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ── Verify employee exists ────────────────────────
    const [[emp]] = await conn.query(
      `SELECT id, full_name, salary FROM employees WHERE id = ?`, [employee_id]
    );
    if (!emp) {
      await conn.rollback();
      return res.status(400).json({ message: 'Employee not found.' });
    }

    // ── Duplicate check ───────────────────────────────
    const [[dup]] = await conn.query(
      `SELECT id FROM payroll WHERE employee_id = ? AND period_start = ? AND period_end = ?`,
      [employee_id, period_start, period_end]
    );
    if (dup) {
      await conn.rollback();
      return res.status(400).json({
        message: 'Payroll already exists for this employee and selected period.',
      });
    }

    // ── Working days ──────────────────────────────────
    const wd = working_days && Number(working_days) > 0
      ? Number(working_days)
      : countWeekdays(period_start, period_end);

    if (wd <= 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Working days must be greater than 0.' });
    }

    // ── Attendance records for period ─────────────────
    const [attRows] = await conn.query(`
      SELECT status, late_minutes, total_hours
      FROM attendance
      WHERE employee_id = ?
        AND date BETWEEN ? AND ?
    `, [employee_id, period_start, period_end]);

    let days_present       = 0;
    let days_late          = 0;
    let days_absent        = 0;
    let days_on_leave      = 0;
    let half_day_count     = 0;
    let total_late_minutes = 0;
    let total_hours_worked = 0;

    for (const row of attRows) {
      const s = (row.status || '').toLowerCase();
      if      (s === 'present')  days_present++;
      else if (s === 'late')    { days_late++; total_late_minutes += Number(row.late_minutes || 0); }
      else if (s === 'absent')   days_absent++;
      else if (s === 'leave' || s === 'on-leave') days_on_leave++;
      else if (s === 'half-day') half_day_count++;
      total_hours_worked += Number(row.total_hours || 0);
    }

    // ── Rates ─────────────────────────────────────────
    const sal        = Number(basic_salary);
    const daily_rate = sal / wd;
    const hourly_rate = daily_rate / 8;

    // ── Deductions ────────────────────────────────────
    const late_deduction     = (total_late_minutes / 60) * hourly_rate;
    const absence_deduction  = days_absent * daily_rate;
    const half_day_deduction = half_day_count * (daily_rate / 2);
    const other_ded          = Math.max(0, Number(other_deductions || 0));

    const total_deductions = late_deduction + absence_deduction + half_day_deduction + other_ded;

    // ── Earnings ─────────────────────────────────────
    const allow     = Math.max(0, Number(allowances    || 0));
    const ot_hours  = Math.max(0, Number(overtime_hours || 0));
    const ot_pay    = Math.max(0, Number(overtime_pay  || 0));

    const gross_pay  = sal + allow + ot_pay;
    const net_salary = Math.max(0, gross_pay - total_deductions);

    // ── Payroll code ──────────────────────────────────
    const payroll_code = await nextPayrollCode();

    // ── Insert snapshot ───────────────────────────────
    await conn.query(`
      INSERT INTO payroll (
        payroll_code,
        employee_id, period_start, period_end,
        working_days,
        days_present, days_late, days_absent, days_on_leave, half_day_count,
        total_late_minutes, total_hours,
        basic_salary, daily_rate, hourly_rate,
        allowances, overtime_hours, overtime_pay,
        late_deduction, absence_deduction, half_day_deduction,
        other_deductions, deductions, total_deductions,
        gross_pay, net_salary,
        status, notes
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        'pending', ?
      )
    `, [
      payroll_code,
      employee_id, period_start, period_end,
      wd,
      days_present, days_late, days_absent, days_on_leave, half_day_count,
      total_late_minutes, total_hours_worked,
      sal, round2(daily_rate), round2(hourly_rate),
      allow, ot_hours, ot_pay,
      round2(late_deduction), round2(absence_deduction), round2(half_day_deduction),
      round2(other_ded), round2(total_deductions), round2(total_deductions),
      round2(gross_pay), round2(net_salary),
      notes || null,
    ]);

    await conn.commit();
    res.json({
      message: `Payroll ${payroll_code} generated successfully.`,
      payroll_code,
    });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Payroll already exists for this employee and selected period.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
};

/**
 * PUT /hr/payroll/:id
 * Edit adjustment fields only (allowances, overtime, other_deductions, notes).
 * Paid payroll cannot be edited without confirm flag.
 * Recomputes gross_pay / total_deductions / net_salary from stored snapshot values.
 */
exports.updatePayroll = async (req, res) => {
  const { id } = req.params;
  const { allowances, overtime_hours, overtime_pay, other_deductions, notes, confirm_paid } = req.body;

  try {
    const [[p]] = await db.query(`SELECT * FROM payroll WHERE id = ?`, [id]);
    if (!p) return res.status(404).json({ message: 'Payroll record not found.' });

    if (p.status === 'paid' && !confirm_paid) {
      return res.status(400).json({
        message: 'This payroll is already paid. Pass confirm_paid: true to override.',
      });
    }
    if (p.status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled payroll cannot be edited.' });
    }

    const allow    = Math.max(0, Number(allowances     ?? p.allowances     ?? 0));
    const ot_h     = Math.max(0, Number(overtime_hours ?? p.overtime_hours ?? 0));
    const ot_p     = Math.max(0, Number(overtime_pay   ?? p.overtime_pay   ?? 0));
    const other    = Math.max(0, Number(other_deductions ?? p.other_deductions ?? 0));

    const total_ded = round2(
      Number(p.late_deduction    || 0) +
      Number(p.absence_deduction || 0) +
      Number(p.half_day_deduction || 0) +
      other
    );
    const gross   = round2(Number(p.basic_salary) + allow + ot_p);
    const net     = round2(Math.max(0, gross - total_ded));

    await db.query(`
      UPDATE payroll SET
        allowances=?, overtime_hours=?, overtime_pay=?,
        other_deductions=?, total_deductions=?, deductions=?,
        gross_pay=?, net_salary=?,
        notes=?, updated_at=NOW()
      WHERE id=?
    `, [allow, ot_h, ot_p, other, total_ded, total_ded, gross, net, notes ?? p.notes, id]);

    res.json({ message: 'Payroll adjustments saved.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * PATCH /hr/payroll/:id/process
 * Move pending → processed
 */
exports.markAsProcessed = async (req, res) => {
  const { id } = req.params;
  try {
    const [[p]] = await db.query(`SELECT status FROM payroll WHERE id = ?`, [id]);
    if (!p) return res.status(404).json({ message: 'Payroll record not found.' });
    if (p.status !== 'pending')
      return res.status(400).json({ message: `Cannot process a payroll with status "${p.status}".` });

    await db.query(
      `UPDATE payroll SET status='processed', processed_at=NOW(), updated_at=NOW() WHERE id=?`, [id]
    );
    res.json({ message: 'Payroll marked as processed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PATCH /hr/payroll/:id/pay
 * Move pending/processed → paid
 */
exports.markAsPaid = async (req, res) => {
  const { id } = req.params;
  try {
    const [[p]] = await db.query(`SELECT status FROM payroll WHERE id = ?`, [id]);
    if (!p) return res.status(404).json({ message: 'Payroll record not found.' });
    if (p.status === 'paid')
      return res.status(400).json({ message: 'Payroll is already paid.' });
    if (p.status === 'cancelled')
      return res.status(400).json({ message: 'Cannot pay a cancelled payroll.' });

    await db.query(
      `UPDATE payroll SET status='paid', paid_at=NOW(), updated_at=NOW() WHERE id=?`, [id]
    );
    res.json({ message: 'Payroll marked as paid.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PATCH /hr/payroll/:id/cancel
 * Soft-cancel — keeps record in history
 */
exports.cancelPayroll = async (req, res) => {
  const { id } = req.params;
  try {
    const [[p]] = await db.query(`SELECT status FROM payroll WHERE id = ?`, [id]);
    if (!p) return res.status(404).json({ message: 'Payroll record not found.' });
    if (p.status === 'paid')
      return res.status(400).json({ message: 'Cannot cancel a paid payroll.' });
    if (p.status === 'cancelled')
      return res.status(400).json({ message: 'Already cancelled.' });

    await db.query(
      `UPDATE payroll SET status='cancelled', cancelled_at=NOW(), updated_at=NOW() WHERE id=?`, [id]
    );
    res.json({ message: 'Payroll cancelled.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /hr/payroll/attendance-preview
 * Returns attendance summary + computed values for the generate form preview.
 * Query params: employee_id, period_start, period_end, basic_salary, working_days
 */
exports.getAttendancePreview = async (req, res) => {
  const { employee_id, period_start, period_end, basic_salary, working_days } = req.query;

  if (!employee_id || !period_start || !period_end || !basic_salary)
    return res.status(400).json({ message: 'employee_id, period_start, period_end, basic_salary are required.' });

  try {
    const [attRows] = await db.query(`
      SELECT status, late_minutes, total_hours
      FROM attendance
      WHERE employee_id = ? AND date BETWEEN ? AND ?
    `, [employee_id, period_start, period_end]);

    let days_present = 0, days_late = 0, days_absent = 0,
        days_on_leave = 0, half_day_count = 0,
        total_late_minutes = 0, total_hours = 0;

    for (const r of attRows) {
      const s = (r.status || '').toLowerCase();
      if      (s === 'present')               days_present++;
      else if (s === 'late')                  { days_late++; total_late_minutes += Number(r.late_minutes || 0); }
      else if (s === 'absent')                days_absent++;
      else if (s === 'leave' || s === 'on-leave') days_on_leave++;
      else if (s === 'half-day')              half_day_count++;
      total_hours += Number(r.total_hours || 0);
    }

    const wd = working_days && Number(working_days) > 0
      ? Number(working_days)
      : countWeekdays(period_start, period_end);

    const sal              = Number(basic_salary);
    const daily_rate       = wd > 0 ? sal / wd : 0;
    const hourly_rate      = daily_rate / 8;
    const late_deduction   = (total_late_minutes / 60) * hourly_rate;
    const absence_deduction = days_absent * daily_rate;
    const half_day_deduction = half_day_count * (daily_rate / 2);

    res.json({
      working_days: wd,
      days_present, days_late, days_absent, days_on_leave, half_day_count,
      total_late_minutes, total_hours: round2(total_hours),
      daily_rate:        round2(daily_rate),
      hourly_rate:       round2(hourly_rate),
      late_deduction:    round2(late_deduction),
      absence_deduction: round2(absence_deduction),
      half_day_deduction: round2(half_day_deduction),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}