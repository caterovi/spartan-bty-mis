import { useState, useEffect, useMemo } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaUsers,
  FaPlus,
  FaTimes,
  FaSearch,
  FaSave,
  FaEdit,
  FaTrash,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaBriefcase,
  FaMoneyBillWave,
  FaIdBadge,
} from "react-icons/fa";

const DEPARTMENT_POSITIONS = {
  hr: ["HR Assistant", "Recruiter", "HR Manager"],
  marketing: ["Content Creator", "Graphic Designer", "Marketing Manager", "Video Editor"],
  sales: ["Sales Associate", "Sales Supervisor", "Sales Manager"],
  logistics: ["Logistics Coordinator", "Delivery Staff", "Warehouse Staff"],
  crm: ["CRM Specialist", "Customer Support", "CRM Manager"],
  inventory: ["Inventory Staff", "Stock Controller", "Inventory Manager"],
  admin: ["Admin Assistant", "Office Manager"],
};

const DEPARTMENTS = Object.keys(DEPARTMENT_POSITIONS);

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [editForm, setEditForm] = useState({});

  const [form, setForm] = useState({
    employee_id: "",
    full_name: "",
    email: "",
    phone: "",
    department: "hr",
    position: "",
    employment_type: "full-time",
    date_hired: "",
    salary: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/hr/employees");
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const nextEmployeeId = useMemo(() => {
    if (!employees.length) return "EMP-001";

    const maxNumber = employees.reduce((max, emp) => {
      const match = String(emp.employee_id || "").match(/EMP-(\d+)/i);
      const num = match ? parseInt(match[1], 10) : 0;
      return num > max ? num : max;
    }, 0);

    return `EMP-${String(maxNumber + 1).padStart(3, "0")}`;
  }, [employees]);

  const handleDeptChange = (dept) => {
    setForm({ ...form, department: dept, position: "" });
  };

  const handleEditDeptChange = (dept) => {
    setEditForm({ ...editForm, department: dept, position: "" });
  };

  const handleOpenForm = () => {
    if (!showForm) {
      setForm({
        employee_id: nextEmployeeId,
        full_name: "",
        email: "",
        phone: "",
        department: "hr",
        position: "",
        employment_type: "full-time",
        date_hired: "",
        salary: "",
      });
    }

    setShowForm(!showForm);
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.position) {
      setMessage("error:Please complete the required employee details.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await api.post("/hr/employees", {
        ...form,
        employee_id: nextEmployeeId,
      });

      setMessage("success:Employee added successfully!");
      setShowForm(false);
      await fetchEmployees();

      setForm({
        employee_id: "",
        full_name: "",
        email: "",
        phone: "",
        department: "hr",
        position: "",
        employment_type: "full-time",
        date_hired: "",
        salary: "",
      });
    } catch (err) {
      console.error(err);
      setMessage("error:Error adding employee.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleEdit = (emp) => {
    setEditId(emp.id);
    setEditForm({
      full_name: emp.full_name || "",
      email: emp.email || "",
      phone: emp.phone || "",
      department: emp.department || "hr",
      position: emp.position || "",
      employment_type: emp.employment_type || "full-time",
      salary: emp.salary || "",
      status: emp.status || "active",
    });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/hr/employees/${editId}`, editForm);
      setMessage("success:Employee updated successfully!");
      setEditId(null);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      setMessage("error:Error updating employee.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;

    try {
      await api.delete(`/hr/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const keyword = search.toLowerCase();

    return (
      String(emp.employee_id || "").toLowerCase().includes(keyword) ||
      String(emp.full_name || "").toLowerCase().includes(keyword) ||
      String(emp.department || "").toLowerCase().includes(keyword) ||
      String(emp.position || "").toLowerCase().includes(keyword) ||
      String(emp.status || "").toLowerCase().includes(keyword)
    );
  });

  const isError = message.startsWith("error:");
  const msgText = message.replace(/^(success:|error:)/, "");

  const formatDepartment = (dept) => {
    if (!dept) return "Not provided";
    return dept.charAt(0).toUpperCase() + dept.slice(1);
  };

  const formatText = (value) => {
    if (!value) return "Not provided";
    return String(value)
      .replaceAll("-", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatMoney = (value) => {
    const amount = Number(value || 0);
    return `₱${amount.toLocaleString()}`;
  };

  const statusStyles = {
    active: {
      backgroundColor: "#ecfdf3",
      color: "#2f7d56",
      borderColor: "#2f9d6a",
    },
    inactive: {
      backgroundColor: "#fff1f5",
      color: "#b5536b",
      borderColor: "#c4607a",
    },
  };

  return (
    <Layout>
      <style>{`
        .employees-page {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          animation: employeesFadeUp 0.35s ease both;
        }

        .employees-hero {
          background:
            radial-gradient(circle at top right, rgba(196, 96, 122, 0.18), transparent 34%),
            linear-gradient(135deg, #fff7fa 0%, #ffffff 100%);
          border: 1px solid #ead1d9;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .employees-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .employees-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .employees-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .employees-hero-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          font-size: 24px;
          box-shadow: 0 8px 24px rgba(196, 96, 122, 0.25);
          flex: 0 0 auto;
        }

        .employees-toolbar {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .employees-search-wrap {
          position: relative;
          width: 300px;
          max-width: 100%;
        }

        .employees-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b5536b;
          font-size: 13px;
          pointer-events: none;
        }

        .employees-search {
          width: 100%;
          padding: 11px 13px 11px 36px;
          border-radius: 12px;
          border: 1px solid #d8b8c2;
          background: #fff7fa;
          color: #1f2937;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
        }

        .employees-search:focus {
          border-color: #c4607a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
        }

        .employees-add-btn,
        .employees-submit-btn {
          border: none;
          border-radius: 12px;
          padding: 11px 16px;
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 18px rgba(196, 96, 122, 0.22);
          transition: transform 180ms ease, box-shadow 180ms ease;
          white-space: nowrap;
        }

        .employees-add-btn:hover,
        .employees-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .employees-cancel-btn {
          border: 1px solid #d8b8c2;
          border-radius: 12px;
          padding: 11px 16px;
          background: #ffffff;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .employees-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .employees-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .employees-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .employees-form {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .employees-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .employees-form-icon {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: #fff1f5;
          border: 1px solid #e8b9c6;
          color: #b5536b;
          flex: 0 0 auto;
        }

        .employees-form-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .employees-form-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .employees-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .employees-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .employees-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .employees-input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border-radius: 12px;
          border: 1px solid #d8b8c2;
          background: #ffffff;
          color: #1f2937;
          font-size: 14px;
          outline: none;
          font-family: Segoe UI, sans-serif;
          transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
        }

        .employees-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .employees-auto-code {
          min-height: 43px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #d8b8c2;
          background: #fff7fa;
          box-sizing: border-box;
        }

        .employees-auto-code-text {
          font-size: 15px;
          font-weight: 900;
          color: #b5536b;
          letter-spacing: 0.8px;
        }

        .employees-auto-code-badge {
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 9999px;
          white-space: nowrap;
        }

        .employees-form-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .employees-count {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .employees-table-panel {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          max-width: 100%;
          overflow: hidden;
        }

        .employees-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #ead1d9;
          border-radius: 14px;
        }

        .employees-table {
          width: 100%;
          min-width: 980px;
          border-collapse: collapse;
          background: #ffffff;
        }

        .employees-table thead {
          background: #fff7fa;
        }

        .employees-table th {
          padding: 13px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #ead1d9;
          white-space: nowrap;
        }

        .employees-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #f3e8ec;
          white-space: nowrap;
          vertical-align: middle;
        }

        .employees-table tbody tr {
          transition: background-color 180ms ease;
        }

        .employees-table tbody tr:hover {
          background: #fff7fa;
        }

        .employees-table tbody tr:last-child td {
          border-bottom: none;
        }

        .employees-id {
          color: #64748b;
          font-size: 13px;
          font-weight: 850;
        }

        .employees-name {
          font-weight: 850;
          color: #1f2937;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .employees-email {
          font-size: 12px;
          color: #94a3b8;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-top: 3px;
        }

        .employees-cell-icon {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .employees-cell-icon svg {
          color: #b5536b;
          flex: 0 0 auto;
        }

        .employees-dept-badge,
        .employees-status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid;
          white-space: nowrap;
        }

        .employees-dept-badge {
          background: #fff1f5;
          color: #b5536b;
          border-color: #e8b9c6;
        }

        .employees-action-row {
          display: flex;
          gap: 7px;
          align-items: center;
          white-space: nowrap;
        }

        .employees-edit-btn,
        .employees-delete-btn {
          border-radius: 10px;
          padding: 8px 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .employees-edit-btn {
          background: #fff7e8;
          color: #9a5f0f;
          border-color: #d98a1f;
        }

        .employees-delete-btn {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .employees-edit-btn:hover,
        .employees-delete-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .employees-empty {
          padding: 40px !important;
          text-align: center;
          color: #94a3b8 !important;
          font-size: 14px !important;
          font-weight: 700;
        }

        @keyframes employeesFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1180px) {
          .employees-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .employees-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .employees-title {
            font-size: 24px;
          }

          .employees-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .employees-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .employees-search-wrap,
          .employees-add-btn {
            width: 100%;
          }

          .employees-grid {
            grid-template-columns: 1fr;
          }

          .employees-form-actions {
            flex-direction: column;
          }

          .employees-submit-btn,
          .employees-cancel-btn {
            width: 100%;
          }

          .employees-table-panel {
            padding: 12px;
          }

          .employees-table {
            min-width: 920px;
          }

          .employees-table th,
          .employees-table td {
            padding: 11px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 520px) {
          .employees-hero {
            flex-direction: column-reverse;
          }
        }
      `}</style>

      <div className="employees-page">
        <div className="employees-hero">
          <div>
            <p className="employees-eyebrow">Human Resources</p>
            <h3 className="employees-title">Employee List</h3>
            <p className="employees-subtitle">
              Manage employee records, departments, roles, employment type, salary, and active status.
            </p>
          </div>

          <div className="employees-hero-icon">
            <FaUsers />
          </div>
        </div>

        <div className="employees-toolbar">
          <div className="employees-search-wrap">
            <FaSearch className="employees-search-icon" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="employees-search"
            />
          </div>

          <button onClick={handleOpenForm} className="employees-add-btn">
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Cancel" : "Add Employee"}
          </button>
        </div>

        {message && (
          <div className={`employees-message ${isError ? "employees-message-error" : "employees-message-success"}`}>
            {msgText}
          </div>
        )}

        {showForm && (
          <div className="employees-form">
            <div className="employees-form-header">
              <div className="employees-form-icon">
                <FaPlus />
              </div>

              <div>
                <h4 className="employees-form-title">Create New Employee</h4>
                <p className="employees-form-note">
                  Add employee details, department, position, employment type, and salary.
                </p>
              </div>
            </div>

            <div className="employees-grid">
              <div className="employees-field">
                <label className="employees-label">Employee ID</label>
                <div className="employees-auto-code">
                  <span className="employees-auto-code-text">{nextEmployeeId}</span>
                  <span className="employees-auto-code-badge">AUTO</span>
                </div>
              </div>

              <div className="employees-field">
                <label className="employees-label">Full Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="employees-input"
                />
              </div>

              <div className="employees-field">
                <label className="employees-label">Email</label>
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="employees-input"
                />
              </div>

              <div className="employees-field">
                <label className="employees-label">Phone</label>
                <input
                  type="text"
                  placeholder="09XXXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="employees-input"
                />
              </div>

              <div className="employees-field">
                <label className="employees-label">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => handleDeptChange(e.target.value)}
                  className="employees-input"
                >
                  {DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {formatDepartment(department)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="employees-field">
                <label className="employees-label">Position</label>
                <select
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="employees-input"
                >
                  <option value="">Select Position</option>
                  {(DEPARTMENT_POSITIONS[form.department] || []).map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="employees-field">
                <label className="employees-label">Employment Type</label>
                <select
                  value={form.employment_type}
                  onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                  className="employees-input"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contractual">Contractual</option>
                </select>
              </div>

              <div className="employees-field">
                <label className="employees-label">Date Hired</label>
                <input
                  type="date"
                  value={form.date_hired}
                  onChange={(e) => setForm({ ...form, date_hired: e.target.value })}
                  className="employees-input"
                />
              </div>

              <div className="employees-field">
                <label className="employees-label">Salary</label>
                <input
                  type="number"
                  placeholder="Monthly salary"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  className="employees-input"
                />
              </div>
            </div>

            <button onClick={handleSubmit} className="employees-submit-btn">
              <FaSave />
              Save Employee
            </button>
          </div>
        )}

        {editId && (
          <div className="employees-form">
            <div className="employees-form-header">
              <div className="employees-form-icon">
                <FaEdit />
              </div>

              <div>
                <h4 className="employees-form-title">Edit Employee</h4>
                <p className="employees-form-note">
                  Update employee information, department, position, salary, and status.
                </p>
              </div>
            </div>

            <div className="employees-grid">
              <div className="employees-field">
                <label className="employees-label">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="employees-input"
                />
              </div>

              <div className="employees-field">
                <label className="employees-label">Email</label>
                <input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="employees-input"
                />
              </div>

              <div className="employees-field">
                <label className="employees-label">Phone</label>
                <input
                  type="text"
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="employees-input"
                />
              </div>

              <div className="employees-field">
                <label className="employees-label">Department</label>
                <select
                  value={editForm.department || "hr"}
                  onChange={(e) => handleEditDeptChange(e.target.value)}
                  className="employees-input"
                >
                  {DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {formatDepartment(department)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="employees-field">
                <label className="employees-label">Position</label>
                <select
                  value={editForm.position || ""}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  className="employees-input"
                >
                  <option value="">Select Position</option>
                  {(DEPARTMENT_POSITIONS[editForm.department] || []).map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="employees-field">
                <label className="employees-label">Employment Type</label>
                <select
                  value={editForm.employment_type || "full-time"}
                  onChange={(e) =>
                    setEditForm({ ...editForm, employment_type: e.target.value })
                  }
                  className="employees-input"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contractual">Contractual</option>
                </select>
              </div>

              <div className="employees-field">
                <label className="employees-label">Salary</label>
                <input
                  type="number"
                  value={editForm.salary || ""}
                  onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                  className="employees-input"
                />
              </div>

              <div className="employees-field">
                <label className="employees-label">Status</label>
                <select
                  value={editForm.status || "active"}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="employees-input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="employees-form-actions">
              <button onClick={handleUpdate} className="employees-submit-btn">
                <FaSave />
                Save Changes
              </button>

              <button onClick={() => setEditId(null)} className="employees-cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="employees-count">
          {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""} found
        </p>

        <div className="employees-table-panel">
          <div className="employees-table-wrap">
            <table className="employees-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Type</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="employees-empty">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => {
                    const statusStyle =
                      statusStyles[employee.status] || statusStyles.inactive;

                    return (
                      <tr key={employee.id}>
                        <td className="employees-id">
                          <span className="employees-cell-icon">
                            <FaIdBadge />
                            {employee.employee_id || "Not provided"}
                          </span>
                        </td>

                        <td>
                          <div className="employees-cell-icon">
                            <FaUser />
                            <div>
                              <div className="employees-name">
                                {employee.full_name || "Not provided"}
                              </div>
                              <div className="employees-email">
                                <FaEnvelope style={{ marginRight: 5 }} />
                                {employee.email || "No email"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="employees-dept-badge">
                            <FaBuilding style={{ marginRight: 6 }} />
                            {formatDepartment(employee.department)}
                          </span>
                        </td>

                        <td>
                          <span className="employees-cell-icon">
                            <FaBriefcase />
                            {employee.position || "Not provided"}
                          </span>
                        </td>

                        <td>{formatText(employee.employment_type)}</td>

                        <td>
                          <span className="employees-cell-icon">
                            <FaMoneyBillWave />
                            {formatMoney(employee.salary)}
                          </span>
                        </td>

                        <td>
                          <span
                            className="employees-status-badge"
                            style={statusStyle}
                          >
                            {formatText(employee.status || "inactive")}
                          </span>
                        </td>

                        <td>
                          <div className="employees-action-row">
                            <button
                              onClick={() => handleEdit(employee)}
                              className="employees-edit-btn"
                            >
                              <FaEdit />
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(employee.id)}
                              className="employees-delete-btn"
                            >
                              <FaTrash />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Employees;