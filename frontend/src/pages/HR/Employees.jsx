import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axiosConfig';

const DEPARTMENT_POSITIONS = {
  hr: ['HR Assistant', 'Recruiter', 'HR Manager'],
  marketing: ['Content Creator', 'Graphic Designer', 'Marketing Manager', 'Video Editor'],
  sales: ['Sales Associate', 'Sales Supervisor', 'Sales Manager'],
  logistics: ['Logistics Coordinator', 'Delivery Staff', 'Warehouse Staff'],
  crm: ['CRM Specialist', 'Customer Support', 'CRM Manager'],
  inventory: ['Inventory Staff', 'Stock Controller', 'Inventory Manager'],
  admin: ['Admin Assistant', 'Office Manager'],
};

const DEPARTMENTS = Object.keys(DEPARTMENT_POSITIONS);

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    phone: '',
    department: 'hr',
    position: '',
    employment_type: 'full-time',
    date_hired: '',
    salary: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/hr/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const nextEmployeeId = useMemo(() => {
    if (!employees.length) return 'EMP-001';

    const maxNumber = employees.reduce((max, emp) => {
      const match = String(emp.employee_id || '').match(/EMP-(\d+)/i);
      const num = match ? parseInt(match[1], 10) : 0;
      return num > max ? num : max;
    }, 0);

    return `EMP-${String(maxNumber + 1).padStart(3, '0')}`;
  }, [employees]);

  const handleDeptChange = (dept) => {
    setForm({ ...form, department: dept, position: '' });
  };

  const handleEditDeptChange = (dept) => {
    setEditForm({ ...editForm, department: dept, position: '' });
  };

  const handleOpenForm = () => {
    if (!showForm) {
      setForm({
        employee_id: nextEmployeeId,
        full_name: '',
        email: '',
        phone: '',
        department: 'hr',
        position: '',
        employment_type: 'full-time',
        date_hired: '',
        salary: '',
      });
    }
    setShowForm(!showForm);
  };

  const handleSubmit = async () => {
    try {
      await api.post('/hr/employees', {
        ...form,
        employee_id: nextEmployeeId,
      });

      setMessage('success:Employee added successfully!');
      setShowForm(false);
      await fetchEmployees();
      setForm({
        employee_id: '',
        full_name: '',
        email: '',
        phone: '',
        department: 'hr',
        position: '',
        employment_type: 'full-time',
        date_hired: '',
        salary: '',
      });
    } catch (err) {
      console.error(err);
      setMessage('error:Error adding employee.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEdit = (emp) => {
    setEditId(emp.id);
    setEditForm({
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone || '',
      department: emp.department,
      position: emp.position,
      employment_type: emp.employment_type,
      salary: emp.salary,
      status: emp.status,
    });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/hr/employees/${editId}`, editForm);
      setMessage('success:Employee updated successfully!');
      setEditId(null);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      setMessage('error:Error updating employee.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await api.delete(`/hr/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEmployees = employees.filter((e) =>
    String(e.employee_id || '').toLowerCase().includes(search.toLowerCase()) ||
    String(e.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(e.department || '').toLowerCase().includes(search.toLowerCase()) ||
    String(e.position || '').toLowerCase().includes(search.toLowerCase()) ||
    String(e.status || '').toLowerCase().includes(search.toLowerCase())
  );

  const isSuccess = message.startsWith('success:');
  const isError = message.startsWith('error:');
  const msgText = message.replace(/^(success:|error:)/, '');

  return (
    <div>
      <div style={styles.topRow} className="mobile-top-row">
        <h3 style={styles.sectionTitle}>Employee List</h3>
        <div className="mobile-button-group">
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
            className="mobile-search"
          />
          <button onClick={handleOpenForm} style={styles.addBtn} className="mobile-action-btn">
            {showForm ? '× Cancel' : '+ Add Employee'}
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: '500',
            backgroundColor: isError ? '#f8d7da' : '#d4edda',
            color: isError ? '#721c24' : '#155724',
            border: `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`,
          }}
        >
          {isSuccess ? ' ' : ' '}
          {msgText}
        </div>
      )}

      {showForm && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>Create New Employee</h4>
          <div style={styles.grid} className="mobile-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Employee ID</label>
              <div style={styles.autoCodeBox}>
                <span style={styles.autoCodeText}>{nextEmployeeId}</span>
                <span style={styles.autoCodeBadge}>AUTO</span>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                placeholder="Full name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone</label>
              <input
                type="text"
                placeholder="09XXXXXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Department</label>
              <select
                value={form.department}
                onChange={(e) => handleDeptChange(e.target.value)}
                style={styles.input}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Position</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                style={styles.input}
              >
                <option value="">-- Select Position --</option>
                {(DEPARTMENT_POSITIONS[form.department] || []).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Employment Type</label>
              <select
                value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                style={styles.input}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contractual">Contractual</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Date Hired</label>
              <input
                type="date"
                value={form.date_hired}
                onChange={(e) => setForm({ ...form, date_hired: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Salary (₱)</label>
              <input
                type="number"
                placeholder="Monthly salary"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <button onClick={handleSubmit} style={styles.submitBtn}>
            Save Employee
          </button>
        </div>
      )}

      {editId && (
        <div style={styles.form}>
          <h4 style={styles.formTitle}>Edit Employee</h4>
          <div style={styles.grid} className="mobile-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone</label>
              <input
                type="text"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Department</label>
              <select
                value={editForm.department}
                onChange={(e) => handleEditDeptChange(e.target.value)}
                style={styles.input}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Position</label>
              <select
                value={editForm.position}
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                style={styles.input}
              >
                <option value="">-- Select Position --</option>
                {(DEPARTMENT_POSITIONS[editForm.department] || []).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Employment Type</label>
              <select
                value={editForm.employment_type}
                onChange={(e) => setEditForm({ ...editForm, employment_type: e.target.value })}
                style={styles.input}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contractual">Contractual</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Salary (₱)</label>
              <input
                type="number"
                value={editForm.salary || ''}
                onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Status</label>
              <select
                value={editForm.status || 'active'}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                style={styles.input}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleUpdate} style={styles.submitBtn}>
              Save Changes
            </button>
            <button onClick={() => setEditId(null)} style={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <p style={styles.resultCount}>
        {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
      </p>

      
      <div className="resp-table-wrap mobile-table-container">
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Department</th>
            <th style={styles.th}>Position</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Salary</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.length === 0 ? (
            <tr>
              <td colSpan="8" style={styles.empty}>
                No employees found.
              </td>
            </tr>
          ) : (
            filteredEmployees.map((emp) => (
              <tr key={emp.id} style={styles.tr}>
                <td style={styles.td}>{emp.employee_id}</td>
                <td style={styles.td}>
                  <div style={{ fontWeight: '600' }}>{emp.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>{emp.email}</div>
                </td>
                <td style={styles.td}>
                  <span style={styles.deptBadge}>
                    {emp.department.charAt(0).toUpperCase() + emp.department.slice(1)}
                  </span>
                </td>
                <td style={styles.td}>{emp.position}</td>
                <td style={styles.td}>{emp.employment_type}</td>
                <td style={styles.td}>₱{Number(emp.salary).toLocaleString()}</td>
                <td style={styles.td}>
                  <span style={emp.status === 'active' ? styles.badgeActive : styles.badgeInactive}>
                    {emp.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionRow}>
                    <button onClick={() => handleEdit(emp)} style={styles.editBtn}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(emp.id)} style={styles.deleteBtn}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}

const styles = {
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#302e2e', margin: 0 },
  topRight: { display: 'flex', gap: '10px', alignItems: 'center' },
  searchInput: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    width: '220px'
  },
  addBtn: {
    padding: '10px 18px',
    backgroundColor: '#c4607a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },

  form: {
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '24px'
  },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff'
  },

  autoCodeBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid #c4607a',
    backgroundColor: '#fdf0f3'
  },
  autoCodeText: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#c4607a',
    letterSpacing: '1px'
  },
  autoCodeBadge: {
    backgroundColor: '#c4607a',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '10px'
  },

  submitBtn: {
    padding: '11px 24px',
    backgroundColor: '#c4607a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  cancelBtn: {
    padding: '11px 24px',
    backgroundColor: '#f0f0f0',
    color: '#555',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },

  resultCount: { fontSize: '13px', color: '#888', margin: '0 0 12px' },

  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#555',
    borderBottom: '1px solid #eee'
  },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  empty: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },

  deptBadge: {
    backgroundColor: '#fdf0f3',
    color: '#c4607a',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  badgeActive: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  badgeInactive: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },

  actionRow: { display: 'flex', gap: '6px' },
  editBtn: {
    padding: '6px 12px',
    backgroundColor: '#eaf4fb',
    color: '#2980b9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
};

export default Employees;