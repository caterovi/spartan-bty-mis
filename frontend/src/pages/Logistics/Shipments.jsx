import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaImage,
  FaFilePdf,
  FaTruck,
  FaSearch,
  FaEdit,
  FaSave,
  FaTimes,
  FaUpload,
  FaTrash,
  FaEye,
  FaDownload,
  FaBoxOpen,
  FaShippingFast,
  FaUser,
  FaMapMarkerAlt,
  FaCalendar,
  FaStickyNote,
  FaBarcode,
} from "react-icons/fa";

function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editForm, setEditForm] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const [previewReceipt, setPreviewReceipt] = useState(null);

  const fileInputRef = useRef(null);
  const activeUploadId = useRef(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const res = await api.get("/logistics/shipments");
      setShipments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (s) => {
    setEditId(s.id);
    setEditForm({
      courier: s.courier || "",
      tracking_number: s.tracking_number || "",
      packing_status: s.packing_status || "unpacked",
      shipping_status: s.shipping_status || "pending",
      ship_date: s.ship_date ? s.ship_date.split("T")[0] : "",
      estimated_delivery: s.estimated_delivery ? s.estimated_delivery.split("T")[0] : "",
      actual_delivery: s.actual_delivery ? s.actual_delivery.split("T")[0] : "",
      notes: s.notes || "",
    });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/logistics/shipments/${editId}`, editForm);
      setMessage("success:Shipment updated successfully!");
      setEditId(null);
      fetchShipments();
    } catch (err) {
      setMessage("error:Error updating shipment.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleUploadClick = (shipmentId) => {
    activeUploadId.current = shipmentId;
    setUploadingId(shipmentId);
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (!file) {
      setUploadingId(null);
      return;
    }

    const formData = new FormData();
    formData.append("receipt", file);

    try {
      setMessage("success:Uploading receipt...");

      await api.post(`/logistics/shipments/${activeUploadId.current}/receipt`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("success:Receipt uploaded successfully!");
      fetchShipments();
    } catch (err) {
      setMessage("error:" + (err.response?.data?.message || "Upload failed."));
    } finally {
      setUploadingId(null);
      fileInputRef.current.value = "";
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDeleteReceipt = async (shipmentId) => {
    if (!window.confirm("Remove this receipt?")) return;

    try {
      await api.delete(`/logistics/shipments/${shipmentId}/receipt`);
      setMessage("success:Receipt removed.");
      fetchShipments();
    } catch (err) {
      setMessage("error:Error removing receipt.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const filtered = shipments.filter((s) => {
    const searchText = search.toLowerCase();
    const matchFilter = filter === "all" || s.shipping_status === filter;

    const matchSearch =
      (s.shipment_code || "").toLowerCase().includes(searchText) ||
      (s.order_code || "").toLowerCase().includes(searchText) ||
      (s.customer_name || "").toLowerCase().includes(searchText) ||
      (s.courier || "").toLowerCase().includes(searchText) ||
      (s.shipping_status || "").toLowerCase().includes(searchText);

    return matchFilter && matchSearch;
  });

  const packingColors = {
    unpacked: { backgroundColor: "#f8f3f5", color: "#6b5b63", borderColor: "#c9b6bf" },
    packing: { backgroundColor: "#fff7e8", color: "#9a5f0f", borderColor: "#d98a1f" },
    packed: { backgroundColor: "#ecfdf3", color: "#2f7d56", borderColor: "#2f9d6a" },
  };

  const shippingColors = {
    pending: { backgroundColor: "#fff7e8", color: "#9a5f0f", borderColor: "#d98a1f" },
    shipped: { backgroundColor: "#fff1f5", color: "#b5536b", borderColor: "#c4607a" },
    "in-transit": { backgroundColor: "#fff7e8", color: "#9a5f0f", borderColor: "#d98a1f" },
    delivered: { backgroundColor: "#ecfdf3", color: "#2f7d56", borderColor: "#2f9d6a" },
    returned: { backgroundColor: "#f8f3f5", color: "#6b5b63", borderColor: "#c9b6bf" },
  };

  const isError = message.startsWith("error:");
  const msgText = message.replace(/^(success:|error:)/, "");

  const formatStatus = (value) => String(value || "").replaceAll("-", " ");

  const dateText = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString();
  };

  return (
    <Layout>
      <style>{shipmentsCss}</style>

      <div className="shipments-page">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/jpeg,image/png,image/jpg,application/pdf"
          onChange={handleFileChange}
        />

        <div className="shipments-hero">
          <div>
            <p className="shipments-eyebrow">Logistics Management</p>
            <h3 className="shipments-title">Shipments</h3>
            <p className="shipments-subtitle">
              Track forwarded sales orders, shipment progress, packing status, delivery dates, and receipt uploads.
            </p>
          </div>

          <div className="shipments-hero-icon">
            <FaTruck />
          </div>
        </div>

        <div className="shipments-toolbar">
          <div className="shipments-search-wrap">
            <FaSearch className="shipments-search-icon" />
            <input
              type="text"
              placeholder="Search shipments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="shipments-search"
            />
          </div>
        </div>

        {message && (
          <div className={`shipments-message ${isError ? "shipments-message-error" : "shipments-message-success"}`}>
            {msgText}
          </div>
        )}

        <div className="shipments-filter-row">
          {["all", "pending", "shipped", "in-transit", "delivered", "returned"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shipments-filter-btn ${filter === f ? "shipments-filter-active" : ""}`}
            >
              {f === "all" ? "All" : formatStatus(f)}
            </button>
          ))}
        </div>

        {editId && (
          <div className="shipments-form">
            <div className="shipments-form-header">
              <div className="shipments-form-icon">
                <FaEdit />
              </div>

              <div>
                <h4 className="shipments-form-title">Edit Shipment</h4>
                <p className="shipments-form-note">
                  Update courier, tracking number, packing status, shipping status, delivery dates, and notes.
                </p>
              </div>
            </div>

            <div className="shipments-grid">
              <div className="shipments-field">
                <label className="shipments-label">Courier</label>
                <input
                  type="text"
                  placeholder="e.g. LBC, J&T, JRS"
                  value={editForm.courier}
                  onChange={(e) => setEditForm({ ...editForm, courier: e.target.value })}
                  className="shipments-input"
                />
              </div>

              <div className="shipments-field">
                <label className="shipments-label">Tracking Number</label>
                <input
                  type="text"
                  placeholder="Tracking number"
                  value={editForm.tracking_number}
                  onChange={(e) => setEditForm({ ...editForm, tracking_number: e.target.value })}
                  className="shipments-input"
                />
              </div>

              <div className="shipments-field">
                <label className="shipments-label">Packing Status</label>
                <select
                  value={editForm.packing_status}
                  onChange={(e) => setEditForm({ ...editForm, packing_status: e.target.value })}
                  className="shipments-input"
                >
                  <option value="unpacked">Unpacked</option>
                  <option value="packing">Packing</option>
                  <option value="packed">Packed</option>
                </select>
              </div>

              <div className="shipments-field">
                <label className="shipments-label">Shipping Status</label>
                <select
                  value={editForm.shipping_status}
                  onChange={(e) => setEditForm({ ...editForm, shipping_status: e.target.value })}
                  className="shipments-input"
                >
                  <option value="pending">Pending</option>
                  <option value="shipped">Shipped</option>
                  <option value="in-transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              <div className="shipments-field">
                <label className="shipments-label">Ship Date</label>
                <input
                  type="date"
                  value={editForm.ship_date}
                  onChange={(e) => setEditForm({ ...editForm, ship_date: e.target.value })}
                  className="shipments-input"
                />
              </div>

              <div className="shipments-field">
                <label className="shipments-label">Estimated Delivery</label>
                <input
                  type="date"
                  value={editForm.estimated_delivery}
                  onChange={(e) => setEditForm({ ...editForm, estimated_delivery: e.target.value })}
                  className="shipments-input"
                />
              </div>

              <div className="shipments-field">
                <label className="shipments-label">Actual Delivery</label>
                <input
                  type="date"
                  value={editForm.actual_delivery}
                  onChange={(e) => setEditForm({ ...editForm, actual_delivery: e.target.value })}
                  className="shipments-input"
                />
              </div>

              <div className="shipments-field shipments-span-2">
                <label className="shipments-label">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="shipments-input"
                />
              </div>
            </div>

            <div className="shipments-form-actions">
              <button onClick={handleUpdate} className="shipments-submit-btn">
                <FaSave />
                Save Changes
              </button>

              <button onClick={() => setEditId(null)} className="shipments-cancel-btn">
                <FaTimes />
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="shipments-count">
          {filtered.length} shipment{filtered.length !== 1 ? "s" : ""} found
        </p>

        <div className="shipments-table-panel">
          <div className="shipments-table-wrap">
            <table className="shipments-table">
              <thead>
                <tr>
                  <th>Shipment Code</th>
                  <th>Order Code</th>
                  <th>Customer</th>
                  <th>Courier</th>
                  <th>Packing</th>
                  <th>Shipping</th>
                  <th>Est. Delivery</th>
                  <th>Receipt / Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="shipments-empty">
                      No shipments found. Forward an order from Sales to create one.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id}>
                      <td className="shipments-code">
                        <span className="shipments-cell-icon">
                          <FaBarcode />
                          {s.shipment_code}
                        </span>
                      </td>

                      <td>
                        <span className="shipments-cell-icon">
                          <FaBoxOpen />
                          {s.order_code || "N/A"}
                        </span>
                      </td>

                      <td>
                        <div className="shipments-customer">
                          <FaUser />
                          <div>
                            <div className="shipments-customer-name">
                              {s.customer_name || "Not provided"}
                            </div>
                            <div className="shipments-customer-address">
                              <FaMapMarkerAlt />
                              {s.customer_address || "No address"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="shipments-cell-icon">
                          <FaShippingFast />
                          {s.courier || "N/A"}
                        </span>
                      </td>

                      <td>
                        <span
                          className="shipments-badge"
                          style={packingColors[s.packing_status] || packingColors.unpacked}
                        >
                          {formatStatus(s.packing_status || "unpacked")}
                        </span>
                      </td>

                      <td>
                        <span
                          className="shipments-badge"
                          style={shippingColors[s.shipping_status] || shippingColors.pending}
                        >
                          {formatStatus(s.shipping_status || "pending")}
                        </span>
                      </td>

                      <td>
                        <span className="shipments-cell-icon">
                          <FaCalendar />
                          {dateText(s.estimated_delivery)}
                        </span>
                      </td>

                      <td>
                        <div className="shipments-receipt-cell">
                          {s.receipt_path ? (
                            <>
                              <div className="shipments-receipt-info">
                                <span className="shipments-receipt-icon">
                                  {s.receipt_name?.endsWith(".pdf") ? <FaFilePdf /> : <FaImage />}
                                </span>

                                <span className="shipments-receipt-name" title={s.receipt_name}>
                                  {s.receipt_name?.length > 16
                                    ? s.receipt_name.substring(0, 16) + "..."
                                    : s.receipt_name}
                                </span>
                              </div>

                              <div className="shipments-action-row">
                                <button
                                  onClick={() =>
                                    setPreviewReceipt({
                                      path: `http://localhost:5000${s.receipt_path}`,
                                      name: s.receipt_name,
                                      isPdf: s.receipt_name?.endsWith(".pdf"),
                                    })
                                  }
                                  className="shipments-view-btn"
                                >
                                  <FaEye />
                                  View
                                </button>

                                <button
                                  onClick={() => handleDeleteReceipt(s.id)}
                                  className="shipments-remove-btn"
                                >
                                  <FaTrash />
                                  Remove
                                </button>

                                <button onClick={() => handleEdit(s)} className="shipments-edit-btn">
                                  <FaEdit />
                                  Edit
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="shipments-action-row">
                              <button
                                onClick={() => handleUploadClick(s.id)}
                                disabled={uploadingId === s.id}
                                className={uploadingId === s.id ? "shipments-uploading-btn" : "shipments-upload-btn"}
                              >
                                <FaUpload />
                                {uploadingId === s.id ? "Uploading..." : "Upload"}
                              </button>

                              <button onClick={() => handleEdit(s)} className="shipments-edit-btn">
                                <FaEdit />
                                Edit
                              </button>
                            </div>
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

        {previewReceipt && (
          <div className="shipments-modal-overlay" onClick={() => setPreviewReceipt(null)}>
            <div className="shipments-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="shipments-modal-header">
                <h4 className="shipments-modal-title">
                  {previewReceipt.isPdf ? <FaFilePdf /> : <FaImage />}
                  <span>{previewReceipt.name}</span>
                </h4>

                <button onClick={() => setPreviewReceipt(null)} className="shipments-modal-close">
                  <FaTimes />
                  Close
                </button>
              </div>

              <div className="shipments-modal-body">
                {previewReceipt.isPdf ? (
                  <iframe
                    src={previewReceipt.path}
                    title="Receipt PDF"
                    className="shipments-receipt-frame"
                  />
                ) : (
                  <img
                    src={previewReceipt.path}
                    alt="Receipt"
                    className="shipments-receipt-image"
                  />
                )}
              </div>

              <div className="shipments-modal-footer">
                <a
                  href={previewReceipt.path}
                  download={previewReceipt.name}
                  className="shipments-download-btn"
                >
                  <FaDownload />
                  Download Receipt
                </a>

                <button onClick={() => setPreviewReceipt(null)} className="shipments-close-btn">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const shipmentsCss = `
.shipments-page {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  animation: shipmentsFadeUp 0.35s ease both;
}

.shipments-page *,
.shipments-page *::before,
.shipments-page *::after {
  box-sizing: border-box;
}

.shipments-hero {
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

.shipments-eyebrow {
  margin: 0 0 8px;
  color: #b5536b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.shipments-title {
  margin: 0;
  color: #1f2937;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.shipments-subtitle {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  max-width: 760px;
}

.shipments-hero-icon {
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

.shipments-toolbar,
.shipments-form,
.shipments-table-panel {
  background: #ffffff;
  border: 1px solid #e2c6cf;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
}

.shipments-toolbar {
  padding: 16px;
  margin-bottom: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.shipments-search-wrap {
  position: relative;
  width: 320px;
  max-width: 100%;
}

.shipments-search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: #b5536b;
  font-size: 13px;
  pointer-events: none;
}

.shipments-search,
.shipments-input {
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

.shipments-search {
  padding-left: 36px;
  background: #fff7fa;
}

.shipments-search:focus,
.shipments-input:focus {
  border-color: #c4607a;
  box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
  background: #fffafa;
}

.shipments-message {
  margin-bottom: 18px;
  padding: 13px 15px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  border: 1px solid;
}

.shipments-message-success {
  background: #ecfdf3;
  color: #2f7d56;
  border-color: #2f9d6a;
}

.shipments-message-error {
  background: #fff1f5;
  color: #b5536b;
  border-color: #c4607a;
}

.shipments-filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.shipments-filter-btn {
  padding: 8px 13px;
  border-radius: 9999px;
  border: 1px solid #d8b8c2;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  text-transform: capitalize;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.shipments-filter-btn:hover {
  transform: translateY(-1px);
  border-color: #c4607a;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.shipments-filter-active {
  background: linear-gradient(135deg, #c4607a, #e58ca3);
  color: #ffffff;
  border-color: #c4607a;
  box-shadow: 0 8px 18px rgba(196, 96, 122, 0.18);
}

.shipments-form {
  padding: 22px;
  margin-bottom: 20px;
}

.shipments-form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.shipments-form-icon {
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

.shipments-form-title {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.shipments-form-note {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.shipments-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.shipments-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.shipments-span-2 {
  grid-column: span 2;
}

.shipments-label {
  font-size: 13px;
  font-weight: 800;
  color: #374151;
}

.shipments-form-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.shipments-submit-btn,
.shipments-cancel-btn {
  border-radius: 12px;
  padding: 11px 16px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.shipments-submit-btn {
  border: none;
  background: linear-gradient(135deg, #c4607a, #e58ca3);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(196, 96, 122, 0.22);
}

.shipments-cancel-btn {
  border: 1px solid #d8b8c2;
  background: #ffffff;
  color: #64748b;
}

.shipments-submit-btn:hover,
.shipments-cancel-btn:hover,
.shipments-edit-btn:hover,
.shipments-upload-btn:hover,
.shipments-view-btn:hover,
.shipments-remove-btn:hover,
.shipments-download-btn:hover,
.shipments-close-btn:hover,
.shipments-modal-close:hover {
  transform: translateY(-1px);
}

.shipments-count {
  margin: 0 0 12px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.shipments-table-panel {
  padding: 16px;
  max-width: 100%;
  overflow: hidden;
}

.shipments-table-wrap {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  border: 1px solid #ead1d9;
  border-radius: 14px;
}

.shipments-table {
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;
  background: #ffffff;
}

.shipments-table thead {
  background: #fff7fa;
}

.shipments-table th {
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

.shipments-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3e8ec;
  white-space: nowrap;
  vertical-align: middle;
}

.shipments-table tbody tr {
  transition: background-color 180ms ease;
}

.shipments-table tbody tr:hover {
  background: #fff7fa;
}

.shipments-table tbody tr:last-child td {
  border-bottom: none;
}

.shipments-code {
  color: #64748b;
  font-size: 13px;
  font-weight: 850;
}

.shipments-cell-icon,
.shipments-customer {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.shipments-cell-icon svg,
.shipments-customer svg {
  color: #b5536b;
  flex: 0 0 auto;
}

.shipments-customer-name {
  font-weight: 850;
  color: #1f2937;
}

.shipments-customer-address {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
  color: #94a3b8;
  font-size: 12px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shipments-badge {
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

.shipments-receipt-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
}

.shipments-receipt-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shipments-receipt-icon {
  color: #b5536b;
  font-size: 16px;
  flex: 0 0 auto;
}

.shipments-receipt-name {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  max-width: 145px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shipments-action-row {
  display: flex;
  gap: 7px;
  align-items: center;
  flex-wrap: wrap;
}

.shipments-edit-btn,
.shipments-upload-btn,
.shipments-uploading-btn,
.shipments-view-btn,
.shipments-remove-btn {
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

.shipments-edit-btn {
  background: #fff7e8;
  color: #9a5f0f;
  border-color: #d98a1f;
}

.shipments-upload-btn {
  background: #fff1f5;
  color: #b5536b;
  border-color: #c4607a;
}

.shipments-uploading-btn {
  background: #f8f3f5;
  color: #6b5b63;
  border-color: #c9b6bf;
  cursor: not-allowed;
}

.shipments-view-btn {
  background: #ecfdf3;
  color: #2f7d56;
  border-color: #2f9d6a;
}

.shipments-remove-btn {
  background: #fff1f5;
  color: #b5536b;
  border-color: #c4607a;
}

.shipments-empty {
  padding: 40px !important;
  text-align: center;
  color: #94a3b8 !important;
  font-size: 14px !important;
  font-weight: 700;
}

.shipments-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.58);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.shipments-modal-box {
  background: #ffffff;
  border-radius: 18px;
  width: 100%;
  max-width: 780px;
  max-height: 90vh;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
  overflow: hidden;
  border: 1px solid #e2c6cf;
}

.shipments-modal-header,
.shipments-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 20px;
  background: #fff7fa;
  border-bottom: 1px solid #ead1d9;
}

.shipments-modal-footer {
  border-bottom: none;
  border-top: 1px solid #ead1d9;
  justify-content: flex-end;
}

.shipments-modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 850;
  min-width: 0;
}

.shipments-modal-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shipments-modal-title svg {
  color: #b5536b;
}

.shipments-modal-close,
.shipments-close-btn,
.shipments-download-btn {
  border-radius: 10px;
  padding: 9px 13px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid;
  transition: transform 180ms ease, box-shadow 180ms ease;
  text-decoration: none;
}

.shipments-modal-close,
.shipments-close-btn {
  background: #ffffff;
  color: #64748b;
  border-color: #d8b8c2;
}

.shipments-download-btn {
  background: linear-gradient(135deg, #c4607a, #e58ca3);
  color: #ffffff;
  border-color: #c4607a;
  box-shadow: 0 8px 18px rgba(196, 96, 122, 0.22);
}

.shipments-modal-body {
  padding: 20px;
  max-height: calc(90vh - 142px);
  overflow: auto;
}

.shipments-receipt-frame {
  width: 100%;
  height: 520px;
  border: 1px solid #ead1d9;
  border-radius: 14px;
}

.shipments-receipt-image {
  width: 100%;
  max-height: 520px;
  object-fit: contain;
  border-radius: 14px;
  border: 1px solid #ead1d9;
}

@keyframes shipmentsFadeUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .shipments-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .shipments-span-2 {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .shipments-hero {
    align-items: flex-start;
    padding: 20px;
  }

  .shipments-title {
    font-size: 24px;
  }

  .shipments-hero-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .shipments-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .shipments-search-wrap {
    width: 100%;
  }

  .shipments-filter-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .shipments-filter-btn {
    width: 100%;
  }

  .shipments-grid {
    grid-template-columns: 1fr;
  }

  .shipments-span-2 {
    grid-column: span 1;
  }

  .shipments-form-actions {
    flex-direction: column;
  }

  .shipments-submit-btn,
  .shipments-cancel-btn {
    width: 100%;
  }

  .shipments-table-panel {
    padding: 12px;
  }

  .shipments-table {
    min-width: 980px;
  }

  .shipments-table th,
  .shipments-table td {
    padding: 11px 12px;
    font-size: 12px;
  }

  .shipments-modal-overlay {
    padding: 12px;
  }

  .shipments-modal-header,
  .shipments-modal-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .shipments-modal-close,
  .shipments-close-btn,
  .shipments-download-btn {
    width: 100%;
  }

  .shipments-receipt-frame {
    height: 420px;
  }
}

@media (max-width: 520px) {
  .shipments-hero {
    flex-direction: column-reverse;
  }

  .shipments-filter-row {
    grid-template-columns: 1fr;
  }
}
`;

export default Shipments;