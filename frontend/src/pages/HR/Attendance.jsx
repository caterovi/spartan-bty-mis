import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaCalendarCheck,
  FaPlus,
  FaTimes,
  FaSearch,
  FaSave,
  FaEdit,
  FaUser,
  FaBuilding,
  FaCalendar,
  FaClock,
  FaStickyNote,
} from "react-icons/fa";

const ATTENDANCE_STATUS = ["present", "absent", "late", "half-day", "leave"];

const NOTE_TEMPLATES = {
  present: ["On time", "Regular day", "Overtime"],
  absent: ["No call no show", "Sick leave", "Emergency leave", "Approved absence"],
  late: ["Traffic", "Personal reason", "Transportation issue"],
  "half-day": ["AM half day", "PM half day", "Medical appointment"],
  leave: ["Vacation leave", "Sick leave", "Emergency leave", "Maternity/Paternity leave"],
};

function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [editForm, setEditForm] = useState({});

  const [form, setForm] = useState({
    employee_id: "",
    date: "",
    time_in: "",
    time_out: "",
    status: "present",
    remarks: "",
  });

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await api.get("/hr/attendance");
      setAttendance(res.data || []);
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
    if (!form.employee_id || !form.date) {
      setMessage("error:Please select an employee and date.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await api.post("/hr/attendance", form);
      setMessage("success:Attendance recorded!");
      setShowForm(false);
      setForm({
        employee_id: "",
        date: "",
        time_in: "",
        time_out: "",
        status: "present",
        remarks: "",
      });
      fetchAttendance();
    } catch (err) {
      console.error(err);
      setMessage("error:Error recording attendance.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleEdit = (rec) => {
    setEditId(rec.id);
    setEditForm({
      time_in: rec.time_in || "",
      time_out: rec.time_out || "",
      status: rec.status || "present",
      remarks: rec.remarks || "",
    });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/hr/attendance/${editId}`, editForm);
      setMessage("success:Attendance updated!");
      setEditId(null);
      fetchAttendance();
    } catch (err) {
      console.error(err);
      setMessage("error:Error updating attendance.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const filteredAttendance = attendance.filter((a) => {
    const keyword = search.toLowerCase();

    return (
      String(a.full_name || "").toLowerCase().includes(keyword) ||
      String(a.department || "").toLowerCase().includes(keyword) ||
      String(a.status || "").toLowerCase().includes(keyword) ||
      String(a.remarks || "").toLowerCase().includes(keyword)
    );
  });

  const isError = message.startsWith("error:");
  const msgText = message.replace(/^(success:|error:)/, "");

  const formatStatus = (status) => {
    if (!status) return "Not provided";
    return status
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const statusStyles = {
    present: { backgroundColor: "#ecfdf3", color: "#2f7d56", borderColor: "#2f9d6a" },
    absent: { backgroundColor: "#fff1f5", color: "#b5536b", borderColor: "#c4607a" },
    late: { backgroundColor: "#fff7e8", color: "#9a5f0f", borderColor: "#d98a1f" },
    "half-day": { backgroundColor: "#f8f3f5", color: "#6b5b63", borderColor: "#c9b6bf" },
    leave: { backgroundColor: "#f8f3f5", color: "#6b5b63", borderColor: "#c9b6bf" },
  };

  return (
    <Layout>
      <style>{`
        .attendance-page {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          animation: attendanceFadeUp 0.35s ease both;
        }

        .attendance-hero {
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

        .attendance-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .attendance-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .attendance-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .attendance-hero-icon {
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

        .attendance-toolbar {
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

        .attendance-search-wrap {
          position: relative;
          width: 300px;
          max-width: 100%;
        }

        .attendance-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b5536b;
          font-size: 13px;
          pointer-events: none;
        }

        .attendance-search {
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

        .attendance-search:focus {
          border-color: #c4607a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
        }

        .attendance-add-btn,
        .attendance-submit-btn {
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

        .attendance-add-btn:hover,
        .attendance-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .attendance-cancel-btn {
          border: 1px solid #d8b8c2;
          border-radius: 12px;
          padding: 11px 16px;
          background: #ffffff;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .attendance-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .attendance-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .attendance-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .attendance-form {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .attendance-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .attendance-form-icon {
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

        .attendance-form-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .attendance-form-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .attendance-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .attendance-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .attendance-field-full {
          grid-column: span 3;
        }

        .attendance-field-wide {
          grid-column: span 2;
        }

        .attendance-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .attendance-input {
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

        .attendance-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .attendance-form-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .attendance-count {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .attendance-table-panel {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          max-width: 100%;
          overflow: hidden;
        }

        .attendance-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #ead1d9;
          border-radius: 14px;
        }

        .attendance-table {
          width: 100%;
          min-width: 960px;
          border-collapse: collapse;
          background: #ffffff;
        }

        .attendance-table thead {
          background: #fff7fa;
        }

        .attendance-table th {
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

        .attendance-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #f3e8ec;
          white-space: nowrap;
          vertical-align: middle;
        }

        .attendance-table tbody tr {
          transition: background-color 180ms ease;
        }

        .attendance-table tbody tr:hover {
          background: #fff7fa;
        }

        .attendance-table tbody tr:last-child td {
          border-bottom: none;
        }

        .attendance-name {
          font-weight: 850;
          color: #1f2937;
          max-width: 190px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .attendance-cell-icon {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .attendance-cell-icon svg {
          color: #b5536b;
          flex: 0 0 auto;
        }

        .attendance-dept {
          color: #374151;
          font-weight: 700;
          text-transform: capitalize;
        }

        .attendance-badge {
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

        .attendance-remark {
          display: inline-flex;
          max-width: 240px;
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

        .attendance-edit-btn {
          border-radius: 10px;
          padding: 8px 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #d98a1f;
          background: #fff7e8;
          color: #9a5f0f;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .attendance-edit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .attendance-empty {
          padding: 40px !important;
          text-align: center;
          color: #94a3b8 !important;
          font-size: 14px !important;
          font-weight: 700;
        }

        @keyframes attendanceFadeUp {
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
          .attendance-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .attendance-field-full,
          .attendance-field-wide {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .attendance-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .attendance-title {
            font-size: 24px;
          }

          .attendance-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .attendance-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .attendance-search-wrap,
          .attendance-add-btn {
            width: 100%;
          }

          .attendance-grid {
            grid-template-columns: 1fr;
          }

          .attendance-field-full,
          .attendance-field-wide {
            grid-column: span 1;
          }

          .attendance-form-actions {
            flex-direction: column;
          }

          .attendance-submit-btn,
          .attendance-cancel-btn {
            width: 100%;
          }

          .attendance-table-panel {
            padding: 12px;
          }

          .attendance-table {
            min-width: 900px;
          }

          .attendance-table th,
          .attendance-table td {
            padding: 11px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 520px) {
          .attendance-hero {
            flex-direction: column-reverse;
          }
        }
      `}</style>

      <div className="attendance-page">
        <div className="attendance-hero">
          <div>
            <p className="attendance-eyebrow">Human Resources</p>
            <h3 className="attendance-title">Attendance Records</h3>
            <p className="attendance-subtitle">
              Record daily attendance, track employee status, time logs, and remarks in one organized view.
            </p>
          </div>

          <div className="attendance-hero-icon">
            <FaCalendarCheck />
          </div>
        </div>

        <div className="attendance-toolbar">
          <div className="attendance-search-wrap">
            <FaSearch className="attendance-search-icon" />
            <input
              type="text"
              placeholder="Search attendance..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="attendance-search"
            />
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="attendance-add-btn"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Cancel" : "Record Attendance"}
          </button>
        </div>

        {message && (
          <div className={`attendance-message ${isError ? "attendance-message-error" : "attendance-message-success"}`}>
            {msgText}
          </div>
        )}

        {showForm && (
          <div className="attendance-form">
            <div className="attendance-form-header">
              <div className="attendance-form-icon">
                <FaPlus />
              </div>

              <div>
                <h4 className="attendance-form-title">Record Attendance</h4>
                <p className="attendance-form-note">
                  Select an employee, date, status, time logs, and remarks.
                </p>
              </div>
            </div>

            <div className="attendance-grid">
              <div className="attendance-field">
                <label className="attendance-label">Employee</label>
                <select
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className="attendance-input"
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="attendance-field">
                <label className="attendance-label">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="attendance-input"
                />
              </div>

              <div className="attendance-field">
                <label className="attendance-label">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value,
                      remarks: "",
                    })
                  }
                  className="attendance-input"
                >
                  {ATTENDANCE_STATUS.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="attendance-field">
                <label className="attendance-label">Time In</label>
                <input
                  type="time"
                  value={form.time_in}
                  onChange={(e) => setForm({ ...form, time_in: e.target.value })}
                  className="attendance-input"
                />
              </div>

              <div className="attendance-field">
                <label className="attendance-label">Time Out</label>
                <input
                  type="time"
                  value={form.time_out}
                  onChange={(e) => setForm({ ...form, time_out: e.target.value })}
                  className="attendance-input"
                />
              </div>

              <div className="attendance-field">
                <label className="attendance-label">Quick Note</label>
                <select
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="attendance-input"
                >
                  <option value="">Select a note</option>
                  {(NOTE_TEMPLATES[form.status] || []).map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
              </div>

              <div className="attendance-field attendance-field-full">
                <label className="attendance-label">Custom Remarks</label>
                <input
                  type="text"
                  placeholder="Or type a custom note..."
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="attendance-input"
                />
              </div>
            </div>

            <button onClick={handleSubmit} className="attendance-submit-btn">
              <FaSave />
              Save Attendance
            </button>
          </div>
        )}

        {editId && (
          <div className="attendance-form">
            <div className="attendance-form-header">
              <div className="attendance-form-icon">
                <FaEdit />
              </div>

              <div>
                <h4 className="attendance-form-title">Edit Attendance</h4>
                <p className="attendance-form-note">
                  Update time logs, status, quick note, or custom remarks.
                </p>
              </div>
            </div>

            <div className="attendance-grid">
              <div className="attendance-field">
                <label className="attendance-label">Time In</label>
                <input
                  type="time"
                  value={editForm.time_in || ""}
                  onChange={(e) => setEditForm({ ...editForm, time_in: e.target.value })}
                  className="attendance-input"
                />
              </div>

              <div className="attendance-field">
                <label className="attendance-label">Time Out</label>
                <input
                  type="time"
                  value={editForm.time_out || ""}
                  onChange={(e) => setEditForm({ ...editForm, time_out: e.target.value })}
                  className="attendance-input"
                />
              </div>

              <div className="attendance-field">
                <label className="attendance-label">Status</label>
                <select
                  value={editForm.status || "present"}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      status: e.target.value,
                    })
                  }
                  className="attendance-input"
                >
                  {ATTENDANCE_STATUS.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="attendance-field">
                <label className="attendance-label">Quick Note</label>
                <select
                  value=""
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  className="attendance-input"
                >
                  <option value="">Select quick note</option>
                  {(NOTE_TEMPLATES[editForm.status] || []).map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
              </div>

              <div className="attendance-field attendance-field-wide">
                <label className="attendance-label">Remarks</label>
                <input
                  type="text"
                  placeholder="Custom remarks"
                  value={editForm.remarks || ""}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  className="attendance-input"
                />
              </div>
            </div>

            <div className="attendance-form-actions">
              <button onClick={handleUpdate} className="attendance-submit-btn">
                <FaSave />
                Save Changes
              </button>

              <button onClick={() => setEditId(null)} className="attendance-cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="attendance-count">
          {filteredAttendance.length} record{filteredAttendance.length !== 1 ? "s" : ""} found
        </p>

        <div className="attendance-table-panel">
          <div className="attendance-table-wrap">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="attendance-empty">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((rec) => (
                    <tr key={rec.id}>
                      <td>
                        <span className="attendance-cell-icon">
                          <FaUser />
                          <span className="attendance-name">
                            {rec.full_name || "Not provided"}
                          </span>
                        </span>
                      </td>

                      <td>
                        <span className="attendance-cell-icon attendance-dept">
                          <FaBuilding />
                          {rec.department || "Not provided"}
                        </span>
                      </td>

                      <td>
                        <span className="attendance-cell-icon">
                          <FaCalendar />
                          {rec.date
                            ? new Date(rec.date).toLocaleDateString()
                            : "Not provided"}
                        </span>
                      </td>

                      <td>
                        <span className="attendance-cell-icon">
                          <FaClock />
                          {rec.time_in || "Not provided"}
                        </span>
                      </td>

                      <td>
                        <span className="attendance-cell-icon">
                          <FaClock />
                          {rec.time_out || "Not provided"}
                        </span>
                      </td>

                      <td>
                        <span
                          className="attendance-badge"
                          style={statusStyles[rec.status] || statusStyles.present}
                        >
                          {formatStatus(rec.status)}
                        </span>
                      </td>

                      <td>
                        {rec.remarks ? (
                          <span className="attendance-remark">
                            <FaStickyNote style={{ marginRight: 6, color: "#b5536b" }} />
                            {rec.remarks}
                          </span>
                        ) : (
                          "Not provided"
                        )}
                      </td>

                      <td>
                        <button
                          onClick={() => handleEdit(rec)}
                          className="attendance-edit-btn"
                        >
                          <FaEdit />
                          Edit
                        </button>
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

export default Attendance;