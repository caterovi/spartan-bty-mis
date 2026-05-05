import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaBoxes,
  FaPlus,
  FaTimes,
  FaSearch,
  FaSave,
  FaEdit,
  FaTrash,
  FaTag,
  FaLayerGroup,
  FaWarehouse,
  FaTruckLoading,
} from "react-icons/fa";

const SUPPLY_NAMES = [
  "Sunstick Daily Radiance",
  "Insta Glow",
  "Overnight Mask",
  "Bright and Light",
  "Glutaslim",
  "Bondpaper",
  "Bubble Wrap",
  "T4 Box",
];

function Items() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editForm, setEditForm] = useState({});

  const [form, setForm] = useState({
    item_code: "",
    name: "",
    category: "",
    quantity: "",
    reorder_level: "10",
    supplier: "",
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get("/inventory/items");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!form.name) {
      setMessage("error:Please select a Supply Name.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await api.post("/inventory/items", form);
      setMessage("success:Item added successfully!");
      setShowForm(false);
      setForm({
        item_code: "",
        name: "",
        category: "",
        quantity: "",
        reorder_level: "10",
        supplier: "",
      });
      fetchItems();
    } catch (err) {
      console.error(err);
      setMessage("error:Error adding item.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setEditForm({
      name: item.name || "",
      category: item.category || "",
      reorder_level: item.reorder_level || "",
      supplier: item.supplier || "",
    });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/inventory/items/${editId}`, editForm);
      setMessage("success:Item updated successfully!");
      setEditId(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      setMessage("error:Error updating item.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      await api.delete(`/inventory/items/${id}`);
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = items.filter((item) => {
    const keyword = search.toLowerCase();
    const matchFilter = filter === "all" || item.status === filter;

    const matchSearch =
      (item.item_code || "").toLowerCase().includes(keyword) ||
      (item.name || "").toLowerCase().includes(keyword) ||
      (item.category || "").toLowerCase().includes(keyword) ||
      (item.supplier || "").toLowerCase().includes(keyword) ||
      (item.status || "").toLowerCase().includes(keyword);

    return matchFilter && matchSearch;
  });

  const statusLabels = {
    "in-stock": "In Stock",
    "low-stock": "Low Stock",
    "out-of-stock": "Out of Stock",
  };

  const statusStyles = {
    "in-stock": {
      backgroundColor: "#ecfdf3",
      color: "#2f7d56",
      borderColor: "#2f9d6a",
    },
    "low-stock": {
      backgroundColor: "#fff7e8",
      color: "#9a5f0f",
      borderColor: "#d98a1f",
    },
    "out-of-stock": {
      backgroundColor: "#fff1f5",
      color: "#b5536b",
      borderColor: "#c4607a",
    },
  };

  const isError = message.startsWith("error:");
  const msgText = message.replace(/^(success:|error:)/, "");

  return (
    <Layout>
      <style>{`
        .items-page {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          animation: itemsFadeUp 0.35s ease both;
        }

        .items-hero {
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

        .items-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .items-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .items-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .items-hero-icon {
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

        .items-toolbar {
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

        .items-search-wrap {
          position: relative;
          width: 300px;
          max-width: 100%;
        }

        .items-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b5536b;
          font-size: 13px;
          pointer-events: none;
        }

        .items-search {
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

        .items-search:focus {
          border-color: #c4607a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
        }

        .items-add-btn,
        .items-submit-btn {
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

        .items-add-btn:hover,
        .items-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .items-cancel-btn {
          border: 1px solid #d8b8c2;
          border-radius: 12px;
          padding: 11px 16px;
          background: #ffffff;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .items-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .items-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .items-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .items-filter-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .items-filter-btn {
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

        .items-filter-btn:hover {
          transform: translateY(-1px);
          border-color: #c4607a;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .items-filter-active {
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          border-color: #c4607a;
          box-shadow: 0 8px 18px rgba(196, 96, 122, 0.18);
        }

        .items-form {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .items-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .items-form-icon {
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

        .items-form-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .items-form-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .items-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .items-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .items-required {
          color: #b5536b;
        }

        .items-optional {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
        }

        .items-input {
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

        .items-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .items-form-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .items-count {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .items-table-panel {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          max-width: 100%;
          overflow: hidden;
        }

        .items-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #ead1d9;
          border-radius: 14px;
        }

        .items-table {
          width: 100%;
          min-width: 940px;
          border-collapse: collapse;
          background: #ffffff;
        }

        .items-table thead {
          background: #fff7fa;
        }

        .items-table th {
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

        .items-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #f3e8ec;
          white-space: nowrap;
          vertical-align: middle;
        }

        .items-table tbody tr {
          transition: background-color 180ms ease;
        }

        .items-table tbody tr:hover {
          background: #fff7fa;
        }

        .items-table tbody tr:last-child td {
          border-bottom: none;
        }

        .items-code {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .items-name {
          font-weight: 850;
          color: #1f2937;
        }

        .items-cell-icon {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .items-cell-icon svg {
          color: #b5536b;
          flex: 0 0 auto;
        }

        .items-qty {
          font-size: 16px;
          font-weight: 900;
        }

        .items-qty.in-stock {
          color: #2f9d6a;
        }

        .items-qty.low-stock {
          color: #d98a1f;
        }

        .items-qty.out-of-stock {
          color: #c4607a;
        }

        .items-badge {
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

        .items-action-row {
          display: flex;
          gap: 7px;
          align-items: center;
          white-space: nowrap;
        }

        .items-edit-btn,
        .items-delete-btn {
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

        .items-edit-btn {
          background: #fff7e8;
          color: #9a5f0f;
          border-color: #d98a1f;
        }

        .items-delete-btn {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .items-edit-btn:hover,
        .items-delete-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .items-empty {
          padding: 40px !important;
          text-align: center;
          color: #94a3b8 !important;
          font-size: 14px !important;
          font-weight: 700;
        }

        @keyframes itemsFadeUp {
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
          .items-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .items-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .items-title {
            font-size: 24px;
          }

          .items-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .items-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .items-search-wrap,
          .items-add-btn {
            width: 100%;
          }

          .items-filter-row {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .items-filter-btn {
            width: 100%;
          }

          .items-grid {
            grid-template-columns: 1fr;
          }

          .items-form-actions {
            flex-direction: column;
          }

          .items-submit-btn,
          .items-cancel-btn {
            width: 100%;
          }

          .items-table-panel {
            padding: 12px;
          }

          .items-table {
            min-width: 880px;
          }

          .items-table th,
          .items-table td {
            padding: 11px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 520px) {
          .items-hero {
            flex-direction: column-reverse;
          }

          .items-filter-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="items-page">
        <div className="items-hero">
          <div>
            <p className="items-eyebrow">Inventory Records</p>
            <h3 className="items-title">Inventory Items</h3>
            <p className="items-subtitle">
              Manage item records, stock levels, reorder thresholds, suppliers, and inventory status.
            </p>
          </div>

          <div className="items-hero-icon">
            <FaBoxes />
          </div>
        </div>

        <div className="items-toolbar">
          <div className="items-search-wrap">
            <FaSearch className="items-search-icon" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="items-search"
            />
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="items-add-btn"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Cancel" : "Add Item"}
          </button>
        </div>

        {message && (
          <div className={`items-message ${isError ? "items-message-error" : "items-message-success"}`}>
            {msgText}
          </div>
        )}

        <div className="items-filter-row">
          {["all", "in-stock", "low-stock", "out-of-stock"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`items-filter-btn ${filter === status ? "items-filter-active" : ""}`}
            >
              {status === "all" ? "All" : statusLabels[status]}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="items-form">
            <div className="items-form-header">
              <div className="items-form-icon">
                <FaPlus />
              </div>

              <div>
                <h4 className="items-form-title">Add New Item</h4>
                <p className="items-form-note">
                  Add item details, quantity, reorder level, and supplier information.
                </p>
              </div>
            </div>

            <div className="items-grid">
              <div className="items-field">
                <label className="items-label">
                  Supply Name <span className="items-required">*</span>
                </label>
                <select
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="items-input"
                >
                  <option value="">Select Supply</option>
                  {SUPPLY_NAMES.map((supply) => (
                    <option key={supply} value={supply}>
                      {supply}
                    </option>
                  ))}
                </select>
              </div>

              <div className="items-field">
                <label className="items-label">
                  Item Code <span className="items-optional">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ITEM-001"
                  value={form.item_code}
                  onChange={(e) => setForm({ ...form, item_code: e.target.value })}
                  className="items-input"
                />
              </div>

              <div className="items-field">
                <label className="items-label">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Skincare, Packaging"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="items-input"
                />
              </div>

              <div className="items-field">
                <label className="items-label">
                  Quantity <span className="items-required">*</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="items-input"
                />
              </div>

              <div className="items-field">
                <label className="items-label">Reorder Level</label>
                <input
                  type="number"
                  placeholder="10"
                  value={form.reorder_level}
                  onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                  className="items-input"
                />
              </div>

              <div className="items-field">
                <label className="items-label">Supplier</label>
                <input
                  type="text"
                  placeholder="Supplier name"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="items-input"
                />
              </div>
            </div>

            <button onClick={handleSubmit} className="items-submit-btn">
              <FaSave />
              Save Item
            </button>
          </div>
        )}

        {editId && (
          <div className="items-form">
            <div className="items-form-header">
              <div className="items-form-icon">
                <FaEdit />
              </div>

              <div>
                <h4 className="items-form-title">Edit Item</h4>
                <p className="items-form-note">
                  Update item name, category, reorder level, and supplier.
                </p>
              </div>
            </div>

            <div className="items-grid">
              <div className="items-field">
                <label className="items-label">Supply Name</label>
                <select
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="items-input"
                >
                  <option value="">Select Supply</option>
                  {SUPPLY_NAMES.map((supply) => (
                    <option key={supply} value={supply}>
                      {supply}
                    </option>
                  ))}
                </select>
              </div>

              <div className="items-field">
                <label className="items-label">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Skincare"
                  value={editForm.category || ""}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="items-input"
                />
              </div>

              <div className="items-field">
                <label className="items-label">Reorder Level</label>
                <input
                  type="number"
                  value={editForm.reorder_level || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, reorder_level: e.target.value })
                  }
                  className="items-input"
                />
              </div>

              <div className="items-field">
                <label className="items-label">Supplier</label>
                <input
                  type="text"
                  value={editForm.supplier || ""}
                  onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                  className="items-input"
                />
              </div>
            </div>

            <div className="items-form-actions">
              <button onClick={handleUpdate} className="items-submit-btn">
                <FaSave />
                Save Changes
              </button>

              <button onClick={() => setEditId(null)} className="items-cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="items-count">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""} found
        </p>

        <div className="items-table-panel">
          <div className="items-table-wrap">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Supply Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Reorder Level</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="items-empty">
                      No items found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id}>
                      <td className="items-code">
                        <span className="items-cell-icon">
                          <FaTag />
                          {item.item_code || "Not provided"}
                        </span>
                      </td>
                      <td className="items-name">
                        <span className="items-cell-icon">
                          <FaBoxes />
                          {item.name || "Not provided"}
                        </span>
                      </td>
                      <td>
                        <span className="items-cell-icon">
                          <FaLayerGroup />
                          {item.category || "Not provided"}
                        </span>
                      </td>
                      <td className={`items-qty ${item.status || ""}`}>
                        {item.quantity ?? "Not provided"}
                      </td>
                      <td>
                        <span className="items-cell-icon">
                          <FaWarehouse />
                          {item.reorder_level ?? "Not provided"}
                        </span>
                      </td>
                      <td>
                        <span className="items-cell-icon">
                          <FaTruckLoading />
                          {item.supplier || "Not provided"}
                        </span>
                      </td>
                      <td>
                        <span
                          className="items-badge"
                          style={statusStyles[item.status] || statusStyles["in-stock"]}
                        >
                          {statusLabels[item.status] || item.status || "Not provided"}
                        </span>
                      </td>
                      <td>
                        <div className="items-action-row">
                          <button onClick={() => handleEdit(item)} className="items-edit-btn">
                            <FaEdit />
                            Edit
                          </button>

                          <button onClick={() => handleDelete(item.id)} className="items-delete-btn">
                            <FaTrash />
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
      </div>
    </Layout>
  );
}

export default Items;