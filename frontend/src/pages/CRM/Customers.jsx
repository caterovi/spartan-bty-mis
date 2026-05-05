import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaUsers,
  FaPlus,
  FaTimes,
  FaSearch,
  FaSave,
  FaTrash,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendar,
} from "react-icons/fa";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/crm/customers");
      setCustomers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!form.full_name.trim()) {
      setMessage("Full name is required.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await api.post("/crm/customers", form);
      setMessage("Customer added successfully!");
      setShowForm(false);
      setForm({ full_name: "", email: "", phone: "", address: "" });
      fetchCustomers();
    } catch (err) {
      console.error(err);
      setMessage("Error adding customer.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;

    try {
      await api.delete(`/crm/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const keyword = search.toLowerCase();

    return (
      (c.full_name || "").toLowerCase().includes(keyword) ||
      (c.email || "").toLowerCase().includes(keyword) ||
      (c.phone || "").toLowerCase().includes(keyword) ||
      (c.address || "").toLowerCase().includes(keyword)
    );
  });

  const isError = message.toLowerCase().includes("error") || message.toLowerCase().includes("required");

  return (
    <Layout>
      <style>{`
        .customers-page {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          animation: customersFadeUp 0.35s ease both;
        }

        .customers-hero {
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

        .customers-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .customers-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .customers-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .customers-hero-icon {
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

        .customers-toolbar {
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

        .customers-search-wrap {
          position: relative;
          width: 300px;
          max-width: 100%;
        }

        .customers-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b5536b;
          font-size: 13px;
          pointer-events: none;
        }

        .customers-search {
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

        .customers-search:focus {
          border-color: #c4607a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
        }

        .customers-add-btn,
        .customers-submit-btn {
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

        .customers-add-btn:hover,
        .customers-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .customers-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .customers-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .customers-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .customers-form {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .customers-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .customers-form-icon {
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

        .customers-form-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .customers-form-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .customers-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .customers-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .customers-field-full {
          grid-column: span 3;
        }

        .customers-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .customers-input {
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

        .customers-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .customers-result-count {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .customers-table-panel {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          max-width: 100%;
          overflow: hidden;
        }

        .customers-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #ead1d9;
          border-radius: 14px;
        }

        .customers-table {
          width: 100%;
          min-width: 820px;
          border-collapse: collapse;
          background: #ffffff;
        }

        .customers-table thead {
          background: #fff7fa;
        }

        .customers-table th {
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

        .customers-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #f3e8ec;
          white-space: nowrap;
          vertical-align: middle;
        }

        .customers-table tbody tr {
          transition: background-color 180ms ease;
        }

        .customers-table tbody tr:hover {
          background: #fff7fa;
        }

        .customers-table tbody tr:last-child td {
          border-bottom: none;
        }

        .customers-name {
          font-weight: 850;
          color: #1f2937;
        }

        .customers-cell-icon {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #374151;
        }

        .customers-cell-icon svg {
          color: #b5536b;
          flex: 0 0 auto;
        }

        .customers-delete-btn {
          border: 1px solid #c4607a;
          border-radius: 10px;
          padding: 8px 12px;
          background: #fff1f5;
          color: #b5536b;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
        }

        .customers-delete-btn:hover {
          background: #ffe4ec;
          transform: translateY(-1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .customers-empty {
          padding: 40px !important;
          text-align: center;
          color: #94a3b8 !important;
          font-size: 14px !important;
          font-weight: 700;
        }

        @keyframes customersFadeUp {
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
          .customers-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .customers-field-full {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .customers-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .customers-title {
            font-size: 24px;
          }

          .customers-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .customers-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .customers-search-wrap,
          .customers-add-btn {
            width: 100%;
          }

          .customers-grid {
            grid-template-columns: 1fr;
          }

          .customers-field-full {
            grid-column: span 1;
          }

          .customers-submit-btn {
            width: 100%;
          }

          .customers-table-panel {
            padding: 12px;
          }

          .customers-table {
            min-width: 760px;
          }

          .customers-table th,
          .customers-table td {
            padding: 11px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 520px) {
          .customers-hero {
            flex-direction: column-reverse;
          }
        }
      `}</style>

      <div className="customers-page">
        <div className="customers-hero">
          <div>
            <p className="customers-eyebrow">CRM Customer Records</p>
            <h3 className="customers-title">Customer List</h3>
            <p className="customers-subtitle">
              Manage customer contact details, addresses, and CRM records in one organized view.
            </p>
          </div>

          <div className="customers-hero-icon">
            <FaUsers />
          </div>
        </div>

        <div className="customers-toolbar">
          <div className="customers-search-wrap">
            <FaSearch className="customers-search-icon" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="customers-search"
            />
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="customers-add-btn"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Cancel" : "Add Customer"}
          </button>
        </div>

        {message && (
          <div className={`customers-message ${isError ? "customers-message-error" : "customers-message-success"}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="customers-form">
            <div className="customers-form-header">
              <div className="customers-form-icon">
                <FaUser />
              </div>

              <div>
                <h4 className="customers-form-title">New Customer</h4>
                <p className="customers-form-note">
                  Add basic customer contact information for CRM tracking.
                </p>
              </div>
            </div>

            <div className="customers-grid">
              <div className="customers-field">
                <label className="customers-label">Full Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="customers-input"
                />
              </div>

              <div className="customers-field">
                <label className="customers-label">Email</label>
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="customers-input"
                />
              </div>

              <div className="customers-field">
                <label className="customers-label">Phone</label>
                <input
                  type="text"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="customers-input"
                />
              </div>

              <div className="customers-field customers-field-full">
                <label className="customers-label">Address</label>
                <input
                  type="text"
                  placeholder="Customer address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="customers-input"
                />
              </div>
            </div>

            <button onClick={handleSubmit} className="customers-submit-btn">
              <FaSave />
              Save Customer
            </button>
          </div>
        )}

        <p className="customers-result-count">
          {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""} found
        </p>

        <div className="customers-table-panel">
          <div className="customers-table-wrap">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="customers-empty">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="customers-name">
                        <span className="customers-cell-icon">
                          <FaUser />
                          {customer.full_name || "Not provided"}
                        </span>
                      </td>
                      <td>
                        <span className="customers-cell-icon">
                          <FaEnvelope />
                          {customer.email || "Not provided"}
                        </span>
                      </td>
                      <td>
                        <span className="customers-cell-icon">
                          <FaPhone />
                          {customer.phone || "Not provided"}
                        </span>
                      </td>
                      <td>
                        <span className="customers-cell-icon">
                          <FaMapMarkerAlt />
                          {customer.address || "Not provided"}
                        </span>
                      </td>
                      <td>
                        <span className="customers-cell-icon">
                          <FaCalendar />
                          {customer.created_at
                            ? new Date(customer.created_at).toLocaleDateString()
                            : "Not provided"}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="customers-delete-btn"
                        >
                          <FaTrash />
                          Delete
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

export default Customers;