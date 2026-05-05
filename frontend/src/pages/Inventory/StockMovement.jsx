import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaArrowDown,
  FaArrowUp,
  FaBoxes,
  FaSearch,
  FaSave,
  FaTag,
  FaClock,
  FaFileAlt,
} from "react-icons/fa";

function StockMovement() {
  const [logs, setLogs] = useState([]);
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState("stock-in");
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({
    item_id: "",
    quantity: "",
    remarks: "",
  });

  useEffect(() => {
    fetchLogs();
    fetchItems();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/inventory/logs");
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await api.get("/inventory/items");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openForm = (selectedMode) => {
    if (mode === selectedMode) {
      setShowForm(!showForm);
    } else {
      setMode(selectedMode);
      setShowForm(true);
    }
  };

  const handleSubmit = async () => {
    if (!form.item_id || !form.quantity) {
      setMessage("error:Please select an item and enter quantity.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      const endpoint =
        mode === "stock-in" ? "/inventory/stock-in" : "/inventory/stock-out";

      await api.post(endpoint, form);

      setMessage(
        mode === "stock-in"
          ? "success:Stock added successfully!"
          : "success:Stock removed successfully!"
      );

      setShowForm(false);
      setForm({ item_id: "", quantity: "", remarks: "" });
      fetchLogs();
      fetchItems();
    } catch (err) {
      setMessage(
        `error:${err.response?.data?.message || "Error processing stock movement."}`
      );
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const keyword = search.toLowerCase();
    const matchFilter = filter === "all" || l.type === filter;

    const matchSearch =
      (l.item_name || "").toLowerCase().includes(keyword) ||
      (l.item_code || "").toLowerCase().includes(keyword) ||
      (l.type || "").toLowerCase().includes(keyword) ||
      (l.remarks || "").toLowerCase().includes(keyword);

    return matchFilter && matchSearch;
  });

  const typeLabels = {
    "stock-in": "Stock In",
    "stock-out": "Stock Out",
    adjustment: "Adjustment",
  };

  const isError = message.startsWith("error:");
  const msgText = message.replace(/^(success:|error:)/, "");

  return (
    <Layout>
      <style>{`
        .stock-page {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          animation: stockFadeUp 0.35s ease both;
        }

        .stock-hero {
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

        .stock-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .stock-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .stock-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .stock-hero-icon {
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

        .stock-toolbar {
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

        .stock-search-wrap {
          position: relative;
          width: 300px;
          max-width: 100%;
        }

        .stock-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b5536b;
          font-size: 13px;
          pointer-events: none;
        }

        .stock-search {
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

        .stock-search:focus {
          border-color: #c4607a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
        }

        .stock-action-btn,
        .stock-submit-btn {
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

        .stock-action-btn:hover,
        .stock-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .stock-action-btn.in {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          box-shadow: 0 8px 18px rgba(34, 197, 94, 0.22);
        }

        .stock-action-btn.in:hover {
          box-shadow: 0 10px 22px rgba(34, 197, 94, 0.28);
        }

        .stock-action-btn.out {
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          box-shadow: 0 8px 18px rgba(196, 96, 122, 0.22);
        }

        .stock-cancel-btn {
          border: 1px solid #d8b8c2;
          border-radius: 12px;
          padding: 11px 16px;
          background: #ffffff;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .stock-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .stock-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .stock-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .stock-filter-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .stock-filter-btn {
          padding: 8px 13px;
          border-radius: 9999px;
          border: 1px solid #d8b8c2;
          background: #ffffff;
          color: #64748b;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .stock-filter-btn:hover {
          transform: translateY(-1px);
          border-color: #c4607a;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .stock-filter-active {
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          border-color: #c4607a;
          box-shadow: 0 8px 18px rgba(196, 96, 122, 0.18);
        }

        .stock-form {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .stock-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .stock-form-icon {
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

        .stock-form-icon.in {
          background: #dcfce7;
          border-color: #86efac;
          color: #16a34a;
        }

        .stock-form-icon.out {
          background: #fff1f5;
          border-color: #e8b9c6;
          color: #b5536b;
        }

        .stock-form-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .stock-form-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .stock-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .stock-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .stock-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .stock-required {
          color: #b5536b;
        }

        .stock-optional {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
        }

        .stock-input {
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

        .stock-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .stock-form-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .stock-count {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .stock-table-panel {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          max-width: 100%;
          overflow: hidden;
        }

        .stock-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #ead1d9;
          border-radius: 14px;
        }

        .stock-table {
          width: 100%;
          min-width: 940px;
          border-collapse: collapse;
          background: #ffffff;
        }

        .stock-table thead {
          background: #fff7fa;
        }

        .stock-table th {
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

        .stock-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #f3e8ec;
          white-space: nowrap;
          vertical-align: middle;
        }

        .stock-table tbody tr {
          transition: background-color 180ms ease;
        }

        .stock-table tbody tr:hover {
          background: #fff7fa;
        }

        .stock-table tbody tr:last-child td {
          border-bottom: none;
        }

        .stock-item-name {
          font-weight: 850;
          color: #1f2937;
        }

        .stock-code {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .stock-cell-icon {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .stock-cell-icon svg {
          color: #b5536b;
          flex: 0 0 auto;
        }

        .stock-badge {
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

        .stock-badge.stock-in {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .stock-badge.stock-out {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .stock-badge.adjustment {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #3b82f6;
        }

        .stock-qty {
          font-size: 16px;
          font-weight: 900;
        }

        .stock-qty.stock-in {
          color: #2f9d6a;
        }

        .stock-qty.stock-out {
          color: #c4607a;
        }

        .stock-qty.adjustment {
          color: #3b82f6;
        }

        .stock-empty {
          padding: 40px !important;
          text-align: center;
          color: #94a3b8 !important;
          font-size: 14px !important;
          font-weight: 700;
        }

        @keyframes stockFadeUp {
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
          .stock-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .stock-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .stock-title {
            font-size: 24px;
          }

          .stock-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .stock-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .stock-search-wrap,
          .stock-action-btn {
            width: 100%;
          }

          .stock-filter-row {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .stock-filter-btn {
            width: 100%;
          }

          .stock-grid {
            grid-template-columns: 1fr;
          }

          .stock-form-actions {
            flex-direction: column;
          }

          .stock-submit-btn,
          .stock-cancel-btn {
            width: 100%;
          }

          .stock-table-panel {
            padding: 12px;
          }

          .stock-table {
            min-width: 880px;
          }

          .stock-table th,
          .stock-table td {
            padding: 11px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 520px) {
          .stock-hero {
            flex-direction: column-reverse;
          }

          .stock-filter-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="stock-page">
        <div className="stock-hero">
          <div>
            <p className="stock-eyebrow">Inventory Records</p>
            <h3 className="stock-title">Stock Movement</h3>
            <p className="stock-subtitle">
              Track stock-in and stock-out movements, view history, and manage inventory levels.
            </p>
          </div>

          <div className="stock-hero-icon">
            <FaBoxes />
          </div>
        </div>

        <div className="stock-toolbar">
          <div className="stock-search-wrap">
            <FaSearch className="stock-search-icon" />
            <input
              type="text"
              placeholder="Search movements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="stock-search"
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => openForm("stock-in")}
              className="stock-action-btn in"
            >
              <FaArrowUp />
              Stock In
            </button>

            <button
              onClick={() => openForm("stock-out")}
              className="stock-action-btn out"
            >
              <FaArrowDown />
              Stock Out
            </button>
          </div>
        </div>

        {message && (
          <div className={`stock-message ${isError ? "stock-message-error" : "stock-message-success"}`}>
            {msgText}
          </div>
        )}

        <div className="stock-filter-row">
          {["all", "stock-in", "stock-out"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`stock-filter-btn ${filter === type ? "stock-filter-active" : ""}`}
            >
              {type === "all" ? "All" : typeLabels[type]}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="stock-form">
            <div className="stock-form-header">
              <div className={`stock-form-icon ${mode === "stock-in" ? "in" : "out"}`}>
                {mode === "stock-in" ? <FaArrowUp /> : <FaArrowDown />}
              </div>

              <div>
                <h4 className="stock-form-title">
                  {mode === "stock-in" ? "Stock In" : "Stock Out"}
                </h4>
                <p className="stock-form-note">
                  {mode === "stock-in"
                    ? "Add stock to inventory items."
                    : "Remove stock from inventory items."}
                </p>
              </div>
            </div>

            <div className="stock-grid">
              <div className="stock-field">
                <label className="stock-label">
                  Item <span className="stock-required">*</span>
                </label>
                <select
                  value={form.item_id}
                  onChange={(e) =>
                    setForm({ ...form, item_id: e.target.value })
                  }
                  className="stock-input"
                >
                  <option value="">Select item</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Current: {i.quantity} {i.unit || ""})
                    </option>
                  ))}
                </select>
              </div>

              <div className="stock-field">
                <label className="stock-label">
                  Quantity <span className="stock-required">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  className="stock-input"
                />
              </div>

              <div className="stock-field">
                <label className="stock-label">
                  Remarks <span className="stock-optional">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Optional remarks"
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                  className="stock-input"
                />
              </div>
            </div>

            <div className="stock-form-actions">
              <button
                onClick={handleSubmit}
                className={`stock-submit-btn ${mode === "stock-in" ? "in" : "out"}`}
              >
                <FaSave />
                Confirm {mode === "stock-in" ? "Stock In" : "Stock Out"}
              </button>

              <button
                onClick={() => setShowForm(false)}
                className="stock-cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="stock-count">
          {filteredLogs.length} movement{filteredLogs.length !== 1 ? "s" : ""} found
        </p>

        <div className="stock-table-panel">
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Remarks</th>
                  <th>Date & Time</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="stock-empty">
                      No stock movements found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="stock-item-name">
                        <span className="stock-cell-icon">
                          <FaBoxes />
                          {log.item_name || "Not provided"}
                        </span>
                      </td>
                      <td className="stock-code">
                        <span className="stock-cell-icon">
                          <FaTag />
                          {log.item_code || "Not provided"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`stock-badge ${log.type || ""}`}
                        >
                          {typeLabels[log.type] || log.type || "Not provided"}
                        </span>
                      </td>
                      <td className={`stock-qty ${log.type || ""}`}>
                        {log.type === "stock-in"
                          ? "+"
                          : log.type === "stock-out"
                          ? "-"
                          : ""}
                        {log.quantity ?? "Not provided"}
                      </td>
                      <td>
                        <span className="stock-cell-icon">
                          <FaFileAlt />
                          {log.remarks || "Not provided"}
                        </span>
                      </td>
                      <td>
                        <span className="stock-cell-icon">
                          <FaClock />
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString()
                            : "Not provided"}
                        </span>
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

export default StockMovement;