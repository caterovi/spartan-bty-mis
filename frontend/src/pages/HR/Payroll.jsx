import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaMoneyCheckAlt,
  FaPlus,
  FaTimes,
  FaSearch,
  FaSave,
  FaEdit,
  FaCheck,
  FaUser,
  FaBuilding,
  FaCalendar,
  FaMoneyBillWave,
  FaStickyNote,
} from "react-icons/fa";

const PAYROLL_NOTES = [
  "Regular payroll",
  "13th month pay",
  "Bonus included",
  "Deduction for absences",
  "Deduction for tardiness",
  "Overtime pay included",
  "Final pay",
  "Partial payment",
];

function Payroll() {
  const [payroll, setPayroll] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [editForm, setEditForm] = useState({});

  const [form, setForm] = useState({
    employee_id: "",
    period_start: "",
    period_end: "",
    basic_salary: "",
    deductions: "0",
    notes: "",
  });

  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
  }, []);

  const fetchPayroll = async () => {
    try {
      const res = await api.get("/hr/payroll");
      setPayroll(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/hr/employees");
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.period_start || !form.period_end) {
      setMessage("error:Please select employee and payroll period.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await api.post("/hr/payroll", form);
      setMessage("success:Payroll generated!");
      setShowForm(false);
      setForm({
        employee_id: "",
        period_start: "",
        period_end: "",
        basic_salary: "",
        deductions: "0",
        notes: "",
      });
      fetchPayroll();
    } catch (err) {
      console.error(err);
      setMessage("error:Error generating payroll.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setEditForm({
      basic_salary: p.basic_salary || "",
      deductions: p.deductions || "0",
      status: p.status || "pending",
      notes: p.notes || "",
    });
  };

  const handleUpdate = async () => {
    const net_salary =
      Number(editForm.basic_salary || 0) - Number(editForm.deductions || 0);

    try {
      await api.put(`/hr/payroll/${editId}`, { ...editForm, net_salary });
      setMessage("success:Payroll updated!");
      setEditId(null);
      fetchPayroll();
    } catch (err) {
      console.error(err);
      setMessage("error:Error updating payroll.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.patch(`/hr/payroll/${id}/pay`);
      fetchPayroll();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPayroll = payroll.filter((p) => {
    const keyword = search.toLowerCase();

    return (
      String(p.full_name || "").toLowerCase().includes(keyword) ||
      String(p.department || "").toLowerCase().includes(keyword) ||
      String(p.status || "").toLowerCase().includes(keyword) ||
      String(p.notes || "").toLowerCase().includes(keyword)
    );
  });

  const net = Number(form.basic_salary || 0) - Number(form.deductions || 0);
  const editNet =
    Number(editForm.basic_salary || 0) - Number(editForm.deductions || 0);

  const isError = message.startsWith("error:");
  const msgText = message.replace(/^(success:|error:)/, "");

  const money = (value) => `₱${Number(value || 0).toLocaleString()}`;

  const dateText = (value) => {
    if (!value) return "Not provided";
    return new Date(value).toLocaleDateString();
  };

  const statusStyles = {
    paid: {
      backgroundColor: "#ecfdf3",
      color: "#2f7d56",
      borderColor: "#2f9d6a",
    },
    pending: {
      backgroundColor: "#fff7e8",
      color: "#9a5f0f",
      borderColor: "#d98a1f",
    },
  };

  return (
    <Layout>
      <style>{`
        .payroll-page {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          animation: payrollFadeUp 0.35s ease both;
        }

        .payroll-hero {
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

        .payroll-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .payroll-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .payroll-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .payroll-hero-icon {
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

        .payroll-toolbar {
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

        .payroll-search-wrap {
          position: relative;
          width: 300px;
          max-width: 100%;
        }

        .payroll-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b5536b;
          font-size: 13px;
          pointer-events: none;
        }

        .payroll-search {
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

        .payroll-search:focus {
          border-color: #c4607a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
        }

        .payroll-add-btn,
        .payroll-submit-btn {
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

        .payroll-add-btn:hover,
        .payroll-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .payroll-cancel-btn {
          border: 1px solid #d8b8c2;
          border-radius: 12px;
          padding: 11px 16px;
          background: #ffffff;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .payroll-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .payroll-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .payroll-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .payroll-form {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .payroll-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .payroll-form-icon {
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

        .payroll-form-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .payroll-form-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .payroll-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .payroll-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .payroll-field-wide {
          grid-column: span 2;
        }

        .payroll-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .payroll-input {
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

        .payroll-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .payroll-input-readonly {
          background: #fff7fa;
          font-weight: 900;
          color: #b5536b;
        }

        .payroll-form-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .payroll-count {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .payroll-table-panel {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          max-width: 100%;
          overflow: hidden;
        }

        .payroll-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #ead1d9;
          border-radius: 14px;
        }

        .payroll-table {
          width: 100%;
          min-width: 1080px;
          border-collapse: collapse;
          background: #ffffff;
        }

        .payroll-table thead {
          background: #fff7fa;
        }

        .payroll-table th {
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

        .payroll-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #f3e8ec;
          white-space: nowrap;
          vertical-align: middle;
        }

        .payroll-table tbody tr {
          transition: background-color 180ms ease;
        }

        .payroll-table tbody tr:hover {
          background: #fff7fa;
        }

        .payroll-table tbody tr:last-child td {
          border-bottom: none;
        }

        .payroll-name {
          font-weight: 850;
          color: #1f2937;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .payroll-cell-icon {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .payroll-cell-icon svg {
          color: #b5536b;
          flex: 0 0 auto;
        }

        .payroll-dept {
          color: #374151;
          font-weight: 700;
          text-transform: capitalize;
        }

        .payroll-period {
          color: #475569;
          font-weight: 700;
        }

        .payroll-money {
          font-weight: 800;
          color: #374151;
        }

        .payroll-net {
          font-weight: 900;
          color: #b5536b;
        }

        .payroll-note {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          max-width: 190px;
          padding: 6px 10px;
          border-radius: 10px;
          background: #fff7fa;
          color: #64748b;
          border: 1px solid #ead1d9;
          font-size: 12px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .payroll-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid;
          white-space: nowrap;
          text-transform: capitalize;
        }

        .payroll-action-row {
          display: flex;
          gap: 7px;
          align-items: center;
          white-space: nowrap;
        }

        .payroll-edit-btn,
        .payroll-pay-btn {
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

        .payroll-edit-btn {
          background: #fff7e8;
          color: #9a5f0f;
          border-color: #d98a1f;
        }

        .payroll-pay-btn {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .payroll-edit-btn:hover,
        .payroll-pay-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .payroll-empty {
          padding: 40px !important;
          text-align: center;
          color: #94a3b8 !important;
          font-size: 14px !important;
          font-weight: 700;
        }

        @keyframes payrollFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 900px) {
          .payroll-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .payroll-field-wide {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .payroll-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .payroll-title {
            font-size: 24px;
          }

          .payroll-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .payroll-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .payroll-search-wrap,
          .payroll-add-btn {
            width: 100%;
          }

          .payroll-grid {
            grid-template-columns: 1fr;
          }

          .payroll-field-wide {
            grid-column: span 1;
          }

          .payroll-form-actions {
            flex-direction: column;
          }

          .payroll-submit-btn,
          .payroll-cancel-btn {
            width: 100%;
          }

          .payroll-table-panel {
            padding: 12px;
          }

          .payroll-table {
            min-width: 980px;
          }

          .payroll-table th,
          .payroll-table td {
            padding: 11px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 520px) {
          .payroll-hero {
            flex-direction: column-reverse;
          }
        }
      `}</style>

      <div className="payroll-page">
        <div className="payroll-hero">
          <div>
            <p className="payroll-eyebrow">Human Resources</p>
            <h3 className="payroll-title">Payroll Records</h3>
            <p className="payroll-subtitle">
              Generate payroll, calculate net salary, manage deductions, notes, and payment status.
            </p>
          </div>

          <div className="payroll-hero-icon">
            <FaMoneyCheckAlt />
          </div>
        </div>

        <div className="payroll-toolbar">
          <div className="payroll-search-wrap">
            <FaSearch className="payroll-search-icon" />
            <input
              type="text"
              placeholder="Search payroll..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="payroll-search"
            />
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="payroll-add-btn"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Cancel" : "Generate Payroll"}
          </button>
        </div>

        {message && (
          <div className={`payroll-message ${isError ? "payroll-message-error" : "payroll-message-success"}`}>
            {msgText}
          </div>
        )}

        {showForm && (
          <div className="payroll-form">
            <div className="payroll-form-header">
              <div className="payroll-form-icon">
                <FaPlus />
              </div>

              <div>
                <h4 className="payroll-form-title">Generate Payroll</h4>
                <p className="payroll-form-note">
                  Select employee, payroll period, salary, deductions, and notes.
                </p>
              </div>
            </div>

            <div className="payroll-grid">
              <div className="payroll-field">
                <label className="payroll-label">Employee</label>
                <select
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className="payroll-input"
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="payroll-field">
                <label className="payroll-label">Period Start</label>
                <input
                  type="date"
                  value={form.period_start}
                  onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                  className="payroll-input"
                />
              </div>

              <div className="payroll-field">
                <label className="payroll-label">Period End</label>
                <input
                  type="date"
                  value={form.period_end}
                  onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                  className="payroll-input"
                />
              </div>

              <div className="payroll-field">
                <label className="payroll-label">Basic Salary</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.basic_salary}
                  onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                  className="payroll-input"
                />
              </div>

              <div className="payroll-field">
                <label className="payroll-label">Deductions</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.deductions}
                  onChange={(e) => setForm({ ...form, deductions: e.target.value })}
                  className="payroll-input"
                />
              </div>

              <div className="payroll-field">
                <label className="payroll-label">Net Salary</label>
                <input
                  readOnly
                  value={money(net)}
                  className="payroll-input payroll-input-readonly"
                />
              </div>

              <div className="payroll-field">
                <label className="payroll-label">Quick Note</label>
                <select
                  value=""
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="payroll-input"
                >
                  <option value="">Select a note</option>
                  {PAYROLL_NOTES.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
              </div>

              <div className="payroll-field payroll-field-wide">
                <label className="payroll-label">Custom Notes</label>
                <input
                  type="text"
                  placeholder="Or type a custom note..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="payroll-input"
                />
              </div>
            </div>

            <button onClick={handleSubmit} className="payroll-submit-btn">
              <FaSave />
              Generate Payroll
            </button>
          </div>
        )}

        {editId && (
          <div className="payroll-form">
            <div className="payroll-form-header">
              <div className="payroll-form-icon">
                <FaEdit />
              </div>

              <div>
                <h4 className="payroll-form-title">Edit Payroll</h4>
                <p className="payroll-form-note">
                  Update salary, deductions, net salary, payment status, and notes.
                </p>
              </div>
            </div>

            <div className="payroll-grid">
              <div className="payroll-field">
                <label className="payroll-label">Basic Salary</label>
                <input
                  type="number"
                  value={editForm.basic_salary || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, basic_salary: e.target.value })
                  }
                  className="payroll-input"
                />
              </div>

              <div className="payroll-field">
                <label className="payroll-label">Deductions</label>
                <input
                  type="number"
                  value={editForm.deductions || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, deductions: e.target.value })
                  }
                  className="payroll-input"
                />
              </div>

              <div className="payroll-field">
                <label className="payroll-label">Net Salary</label>
                <input
                  readOnly
                  value={money(editNet)}
                  className="payroll-input payroll-input-readonly"
                />
              </div>

              <div className="payroll-field">
                <label className="payroll-label">Status</label>
                <select
                  value={editForm.status || "pending"}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="payroll-input"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div className="payroll-field">
                <label className="payroll-label">Quick Note</label>
                <select
                  value=""
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="payroll-input"
                >
                  <option value="">Select a note</option>
                  {PAYROLL_NOTES.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
              </div>

              <div className="payroll-field">
                <label className="payroll-label">Custom Notes</label>
                <input
                  type="text"
                  placeholder="Custom note"
                  value={editForm.notes || ""}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="payroll-input"
                />
              </div>
            </div>

            <div className="payroll-form-actions">
              <button onClick={handleUpdate} className="payroll-submit-btn">
                <FaSave />
                Save Changes
              </button>

              <button onClick={() => setEditId(null)} className="payroll-cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="payroll-count">
          {filteredPayroll.length} record{filteredPayroll.length !== 1 ? "s" : ""} found
        </p>

        <div className="payroll-table-panel">
          <div className="payroll-table-wrap">
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Period</th>
                  <th>Basic Salary</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayroll.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="payroll-empty">
                      No payroll records found.
                    </td>
                  </tr>
                ) : (
                  filteredPayroll.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="payroll-cell-icon">
                          <FaUser />
                          <span className="payroll-name">
                            {p.full_name || "Not provided"}
                          </span>
                        </span>
                      </td>

                      <td>
                        <span className="payroll-cell-icon payroll-dept">
                          <FaBuilding />
                          {p.department || "Not provided"}
                        </span>
                      </td>

                      <td>
                        <span className="payroll-cell-icon payroll-period">
                          <FaCalendar />
                          {dateText(p.period_start)} to {dateText(p.period_end)}
                        </span>
                      </td>

                      <td>
                        <span className="payroll-cell-icon payroll-money">
                          <FaMoneyBillWave />
                          {money(p.basic_salary)}
                        </span>
                      </td>

                      <td>{money(p.deductions)}</td>

                      <td className="payroll-net">{money(p.net_salary)}</td>

                      <td>
                        {p.notes ? (
                          <span className="payroll-note">
                            <FaStickyNote />
                            {p.notes}
                          </span>
                        ) : (
                          "Not provided"
                        )}
                      </td>

                      <td>
                        <span
                          className="payroll-status"
                          style={statusStyles[p.status] || statusStyles.pending}
                        >
                          {p.status || "pending"}
                        </span>
                      </td>

                      <td>
                        <div className="payroll-action-row">
                          <button
                            onClick={() => handleEdit(p)}
                            className="payroll-edit-btn"
                          >
                            <FaEdit />
                            Edit
                          </button>

                          {p.status === "pending" && (
                            <button
                              onClick={() => handleMarkPaid(p.id)}
                              className="payroll-pay-btn"
                            >
                              <FaCheck />
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Payroll;