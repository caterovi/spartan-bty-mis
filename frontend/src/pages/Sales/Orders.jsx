import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axiosConfig";
import {
  FaShoppingCart,
  FaPlus,
  FaTimes,
  FaSearch,
  FaSave,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaTruck,
  FaUser,
  FaPhone,
  FaCalendar,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaBoxOpen,
  FaClipboardList,
} from "react-icons/fa";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [items, setItems] = useState([
    { item_id: null, item_name: "", quantity: 1, unit_price: "" },
  ]);

  const [form, setForm] = useState({
    order_code: "",
    customer_name: "",
    customer_phone: "+63",
    customer_address: "",
    order_date: "",
    notes: "",
    salesperson: "",
  });

  useEffect(() => {
    fetchOrders();
    fetchInventoryItems();
    fetchNextCode();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/sales/orders");
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const res = await api.get("/inventory/items");
      setInventoryItems((res.data || []).filter((i) => i.status !== "out-of-stock"));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNextCode = async () => {
    try {
      const res = await api.get("/sales/next-code");
      setForm((prev) => ({ ...prev, order_code: res.data.order_code }));
    } catch (err) {
      console.error(err);
    }
  };

  const addItemRow = () => {
    setItems([...items, { item_id: null, item_name: "", quantity: 1, unit_price: "" }]);
  };

  const removeItemRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const selectInventoryItem = (index, itemId) => {
    const selected = inventoryItems.find((i) => i.id === Number(itemId));
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      item_id: selected ? selected.id : null,
      item_name: selected ? selected.name : "",
      unit_price: selected ? selected.unit_price : updated[index].unit_price,
    };

    setItems(updated);
  };

  const getTotal = () => {
    return items.reduce(
      (sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) || 0),
      0
    );
  };

  const handleOpenForm = async () => {
    if (!showForm) await fetchNextCode();
    setShowForm(!showForm);
  };

  const handleSubmit = async () => {
    try {
      await api.post("/sales/orders", { ...form, items });
      setMessage("success:Order created successfully!");
      setShowForm(false);
      setItems([{ item_id: null, item_name: "", quantity: 1, unit_price: "" }]);
      fetchOrders();
      fetchInventoryItems();
      fetchNextCode();
    } catch (err) {
      setMessage("error:Error creating order.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      if (status === "confirmed") {
        if (
          !window.confirm(
            "Confirm this order? This will automatically reduce inventory stock for linked items."
          )
        ) {
          return;
        }

        await api.put(`/sales/orders/${id}/confirm`);
        setMessage("success:Order confirmed and inventory stock reduced automatically!");
        fetchInventoryItems();
      } else {
        await api.put(`/sales/orders/${id}/status`, { status });
      }

      fetchOrders();
    } catch (err) {
      setMessage("error:" + (err.response?.data?.message || "Error updating order."));
    } finally {
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this order?")) return;

    try {
      await api.delete(`/sales/orders/${id}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleForward = async (order) => {
    if (!window.confirm(`Forward order ${order.order_code} to Logistics?`)) return;

    try {
      const shipment_code = "SHIP-" + order.order_code + "-" + Date.now();

      await api.post("/logistics/shipments", {
        shipment_code,
        order_code: order.order_code,
        customer_name: order.customer_name,
        customer_address: order.customer_address || "N/A",
        customer_phone: order.customer_phone || "",
        courier: "",
        tracking_number: "",
        ship_date: null,
        estimated_delivery: null,
        notes: order.notes || "",
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error creating shipment";
      setMessage("error:" + errorMsg);
      return;
    }

    try {
      await api.put(`/sales/orders/${order.id}/status`, { status: "forwarded" });
      setMessage("success:Order forwarded to Logistics successfully!");
      fetchOrders();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Error updating order status";
      setMessage("error:" + errorMsg);
    } finally {
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const filtered = orders.filter((order) => {
    const matchFilter = filter === "all" || order.status === filter;
    const searchText = search.toLowerCase();

    const matchSearch =
      (order.order_code || "").toLowerCase().includes(searchText) ||
      (order.customer_name || "").toLowerCase().includes(searchText) ||
      (order.customer_phone || "").includes(search) ||
      (order.salesperson || "").toLowerCase().includes(searchText) ||
      (order.status || "").toLowerCase().includes(searchText);

    return matchFilter && matchSearch;
  });

  const statusStyles = {
    pending: { backgroundColor: "#fff7e8", color: "#9a5f0f", borderColor: "#d98a1f" },
    confirmed: { backgroundColor: "#fff1f5", color: "#b5536b", borderColor: "#c4607a" },
    forwarded: { backgroundColor: "#ecfdf3", color: "#2f7d56", borderColor: "#2f9d6a" },
    cancelled: { backgroundColor: "#f8f3f5", color: "#6b5b63", borderColor: "#c9b6bf" },
  };

  const isError = message.startsWith("error:");
  const msgText = message.replace(/^(success:|error:)/, "");

  const money = (value) => `₱${Number(value || 0).toLocaleString()}`;

  const formatStatus = (value) => String(value || "pending").replaceAll("-", " ");

  return (
    <Layout>
      <style>{ordersCss}</style>

      <div className="orders-page">
        <div className="orders-hero">
          <div>
            <p className="orders-eyebrow">Sales Management</p>
            <h3 className="orders-title">Orders</h3>
            <p className="orders-subtitle">
              Manage customer orders, order items, inventory confirmation, and logistics forwarding.
            </p>
          </div>

          <div className="orders-hero-icon">
            <FaShoppingCart />
          </div>
        </div>

        <div className="orders-toolbar">
          <div className="orders-search-wrap">
            <FaSearch className="orders-search-icon" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="orders-search"
            />
          </div>

          <button onClick={handleOpenForm} className="orders-add-btn">
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Cancel" : "New Order"}
          </button>
        </div>

        {message && (
          <div className={`orders-message ${isError ? "orders-message-error" : "orders-message-success"}`}>
            {msgText}
          </div>
        )}

        <div className="orders-filter-row">
          {["all", "pending", "confirmed", "forwarded", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`orders-filter-btn ${filter === status ? "orders-filter-active" : ""}`}
            >
              {status === "all" ? "All" : formatStatus(status)}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="orders-form">
            <div className="orders-form-header">
              <div className="orders-form-icon">
                <FaPlus />
              </div>

              <div>
                <h4 className="orders-form-title">Create New Order</h4>
                <p className="orders-form-note">
                  Add customer details, sales person, order items, and total amount.
                </p>
              </div>
            </div>

            <div className="orders-grid">
              <div className="orders-field">
                <label className="orders-label">Order Code</label>
                <div className="orders-auto-code">
                  <span className="orders-auto-code-text">{form.order_code}</span>
                  <span className="orders-auto-code-badge">AUTO</span>
                </div>
              </div>

              <div className="orders-field">
                <label className="orders-label">Salesperson</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.salesperson}
                  onChange={(e) => setForm({ ...form, salesperson: e.target.value })}
                  className="orders-input"
                />
              </div>

              <div className="orders-field">
                <label className="orders-label">Customer Name</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="orders-input"
                />
              </div>

              <div className="orders-field">
                <label className="orders-label">Customer Phone</label>
                <div className="orders-phone-wrap">
                  <span className="orders-phone-prefix">+63</span>
                  <input
                    type="text"
                    placeholder="9123456789"
                    value={form.customer_phone.replace("+63", "").replace(/^\s/, "")}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.startsWith("0")) val = val.slice(1);
                      if (val.length > 10) val = val.slice(0, 10);
                      setForm({ ...form, customer_phone: "+63" + val });
                    }}
                    className="orders-phone-input"
                    maxLength={10}
                  />
                </div>
                <span className="orders-hint">Enter 10-digit number, example 9123456789</span>
              </div>

              <div className="orders-field">
                <label className="orders-label">Order Date</label>
                <input
                  type="date"
                  value={form.order_date}
                  onChange={(e) => setForm({ ...form, order_date: e.target.value })}
                  className="orders-input"
                />
              </div>

              <div className="orders-field orders-span-2">
                <label className="orders-label">Customer Address</label>
                <input
                  type="text"
                  placeholder="Delivery address"
                  value={form.customer_address}
                  onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
                  className="orders-input"
                />
              </div>

              <div className="orders-field orders-span-2">
                <label className="orders-label">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="orders-input"
                />
              </div>
            </div>

            <div className="orders-items-panel">
              <div className="orders-items-header">
                <div className="orders-items-title-wrap">
                  <div className="orders-small-icon">
                    <FaBoxOpen />
                  </div>
                  <div>
                    <h4 className="orders-items-title">Order Items</h4>
                    <p className="orders-items-note">Link items from inventory or enter manual items.</p>
                  </div>
                </div>

                <button onClick={addItemRow} className="orders-row-btn">
                  <FaPlus />
                  Add Row
                </button>
              </div>

              <div className="orders-table-wrap">
                <table className="orders-items-table">
                  <thead>
                    <tr>
                      <th>Select from Inventory</th>
                      <th>Item Name</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <select
                            value={item.item_id || ""}
                            onChange={(e) => selectInventoryItem(index, e.target.value)}
                            className="orders-table-input"
                          >
                            <option value="">Select Item</option>
                            {inventoryItems.map((inventoryItem) => (
                              <option key={inventoryItem.id} value={inventoryItem.id}>
                                {inventoryItem.name} (Stock: {inventoryItem.quantity})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <input
                            type="text"
                            placeholder="Or type manually"
                            value={item.item_name}
                            onChange={(e) => updateItem(index, "item_name", e.target.value)}
                            className="orders-table-input"
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                            className="orders-table-input orders-qty-input"
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                            className="orders-table-input orders-price-input"
                          />
                        </td>

                        <td className="orders-money">
                          {money(Number(item.quantity) * Number(item.unit_price) || 0)}
                        </td>

                        <td>
                          {items.length > 1 && (
                            <button onClick={() => removeItemRow(index)} className="orders-remove-btn">
                              <FaTrash />
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    <tr>
                      <td colSpan="4" className="orders-total-label">
                        Total:
                      </td>
                      <td className="orders-total-value">{money(getTotal())}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <button onClick={handleSubmit} className="orders-submit-btn">
              <FaSave />
              Create Order
            </button>
          </div>
        )}

        <p className="orders-count">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""} found
        </p>

        <div className="orders-table-panel">
          <div className="orders-table-wrap">
            <table className="orders-main-table">
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Salesperson</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="orders-empty">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr>
                        <td className="orders-code">{order.order_code}</td>

                        <td>
                          <div className="orders-customer">
                            <FaUser />
                            <div>
                              <div className="orders-customer-name">
                                {order.customer_name || "Not provided"}
                              </div>
                              <div className="orders-customer-address">
                                <FaMapMarkerAlt />
                                {order.customer_address || "No address"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="orders-cell-icon">
                            <FaPhone />
                            {order.customer_phone || "N/A"}
                          </span>
                        </td>

                        <td>{order.salesperson || "N/A"}</td>

                        <td>
                          <span className="orders-cell-icon">
                            <FaCalendar />
                            {order.order_date
                              ? new Date(order.order_date).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </td>

                        <td className="orders-money">{money(order.total_amount)}</td>

                        <td>
                          <span
                            className="orders-badge"
                            style={statusStyles[order.status] || statusStyles.pending}
                          >
                            {formatStatus(order.status)}
                          </span>
                        </td>

                        <td>
                          <div className="orders-action-row">
                            <button
                              onClick={() => toggleExpand(order.id)}
                              className={expanded === order.id ? "orders-view-active" : "orders-view-btn"}
                            >
                              {expanded === order.id ? <FaEyeSlash /> : <FaEye />}
                              {expanded === order.id ? "Hide" : "View"}
                            </button>

                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="orders-status-select"
                            >
                              {["pending", "confirmed", "forwarded", "cancelled"].map((status) => (
                                <option key={status} value={status}>
                                  {formatStatus(status)}
                                </option>
                              ))}
                            </select>

                            {order.status === "confirmed" && (
                              <button onClick={() => handleForward(order)} className="orders-forward-btn">
                                <FaTruck />
                                Forward
                              </button>
                            )}

                            <button onClick={() => handleDelete(order.id)} className="orders-delete-btn">
                              <FaTrash />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expanded === order.id && (
                        <tr>
                          <td colSpan="8" className="orders-expanded-cell">
                            <OrderItems orderId={order.id} money={money} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

function OrderItems({ orderId, money }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    api
      .get(`/sales/orders/${orderId}`)
      .then((res) => setItems(res.data.items || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="order-items-box">
      <div className="order-items-header">
        <div className="orders-small-icon">
          <FaClipboardList />
        </div>
        <div>
          <h4 className="order-items-title">Order Items</h4>
          <p className="order-items-note">Detailed item breakdown for this order.</p>
        </div>
      </div>

      {loading ? (
        <p className="order-items-loading">Loading items...</p>
      ) : (
        <div className="orders-table-wrap">
          <table className="order-items-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
                <th>Linked to Inventory</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="orders-empty">
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.item_name}</td>
                    <td>{item.quantity}</td>
                    <td>{money(item.unit_price)}</td>
                    <td className="orders-money">{money(item.subtotal)}</td>
                    <td>
                      {item.item_id ? (
                        <span className="orders-linked-badge">Linked</span>
                      ) : (
                        <span className="orders-manual-badge">Manual</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const ordersCss = `
.orders-page {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  animation: ordersFadeUp 0.35s ease both;
}

.orders-hero {
  background:
    radial-gradient(circle at top right, rgba(196, 96, 122, 0.18), transparent 34%),
    linear-gradient(135deg, #fff7fa 0%, #ffffff 100%);
  border: 1px solid #ead1d9;
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.orders-eyebrow {
  margin: 0 0 8px;
  color: #b5536b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.orders-title {
  margin: 0;
  color: #1f2937;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.orders-subtitle {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  max-width: 760px;
}

.orders-hero-icon {
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

.orders-toolbar,
.orders-form,
.orders-table-panel {
  background: #ffffff;
  border: 1px solid #e2c6cf;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
}

.orders-toolbar {
  padding: 16px;
  margin-bottom: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.orders-search-wrap {
  position: relative;
  width: 300px;
  max-width: 100%;
}

.orders-search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: #b5536b;
  font-size: 13px;
  pointer-events: none;
}

.orders-search,
.orders-input,
.orders-table-input,
.orders-status-select {
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

.orders-search {
  padding-left: 36px;
  background: #fff7fa;
}

.orders-search:focus,
.orders-input:focus,
.orders-table-input:focus,
.orders-status-select:focus,
.orders-phone-wrap:focus-within {
  border-color: #c4607a;
  box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
  background: #fffafa;
}

.orders-add-btn,
.orders-submit-btn,
.orders-row-btn {
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

.orders-add-btn:hover,
.orders-submit-btn:hover,
.orders-row-btn:hover,
.orders-view-btn:hover,
.orders-view-active:hover,
.orders-forward-btn:hover,
.orders-delete-btn:hover,
.orders-remove-btn:hover {
  transform: translateY(-1px);
}

.orders-message {
  margin-bottom: 18px;
  padding: 13px 15px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  border: 1px solid;
}

.orders-message-success {
  background: #ecfdf3;
  color: #2f7d56;
  border-color: #2f9d6a;
}

.orders-message-error {
  background: #fff1f5;
  color: #b5536b;
  border-color: #c4607a;
}

.orders-filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.orders-filter-btn {
  padding: 8px 13px;
  border-radius: 9999px;
  border: 1px solid #d8b8c2;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
}

.orders-filter-active {
  background: linear-gradient(135deg, #c4607a, #e58ca3);
  color: #ffffff;
  border-color: #c4607a;
  box-shadow: 0 8px 18px rgba(196, 96, 122, 0.18);
}

.orders-form {
  padding: 22px;
  margin-bottom: 20px;
}

.orders-form-header,
.orders-items-header,
.order-items-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.orders-items-header {
  justify-content: space-between;
}

.orders-items-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.orders-form-icon,
.orders-small-icon {
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

.orders-form-title,
.orders-items-title,
.order-items-title {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.orders-form-note,
.orders-items-note,
.order-items-note {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.orders-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.orders-span-2 {
  grid-column: span 2;
}

.orders-label {
  font-size: 13px;
  font-weight: 800;
  color: #374151;
}

.orders-auto-code,
.orders-phone-wrap {
  min-height: 43px;
  display: flex;
  align-items: center;
  border-radius: 12px;
  border: 1px solid #d8b8c2;
  background: #fff7fa;
  box-sizing: border-box;
  overflow: hidden;
}

.orders-auto-code {
  justify-content: space-between;
  padding: 10px 12px;
}

.orders-auto-code-text {
  font-size: 15px;
  font-weight: 900;
  color: #b5536b;
  letter-spacing: 0.8px;
}

.orders-auto-code-badge {
  background: linear-gradient(135deg, #c4607a, #e58ca3);
  color: #ffffff;
  font-size: 10px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 9999px;
}

.orders-phone-prefix {
  padding: 11px 12px;
  background: #fff1f5;
  border-right: 1px solid #d8b8c2;
  font-size: 14px;
  font-weight: 800;
  color: #1f2937;
  white-space: nowrap;
}

.orders-phone-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  padding: 11px 12px;
  font-size: 14px;
  background: #ffffff;
}

.orders-hint {
  font-size: 11px;
  color: #64748b;
}

.orders-items-panel {
  background: #fff7fa;
  border: 1px solid #ead1d9;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
}

.orders-table-panel {
  padding: 16px;
  max-width: 100%;
  overflow: hidden;
}

.orders-table-wrap {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  border: 1px solid #ead1d9;
  border-radius: 14px;
}

.orders-main-table,
.orders-items-table,
.order-items-table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
}

.orders-main-table {
  min-width: 1080px;
}

.orders-items-table {
  min-width: 880px;
}

.order-items-table {
  min-width: 720px;
}

.orders-main-table thead,
.orders-items-table thead,
.order-items-table thead {
  background: #fff7fa;
}

.orders-main-table th,
.orders-items-table th,
.order-items-table th {
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

.orders-main-table td,
.orders-items-table td,
.order-items-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3e8ec;
  white-space: nowrap;
  vertical-align: middle;
}

.orders-main-table tbody tr:hover,
.orders-items-table tbody tr:hover,
.order-items-table tbody tr:hover {
  background: #fff7fa;
}

.orders-code {
  color: #64748b;
  font-size: 13px;
  font-weight: 850;
}

.orders-customer,
.orders-cell-icon {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.orders-customer svg,
.orders-cell-icon svg {
  color: #b5536b;
  flex: 0 0 auto;
}

.orders-customer-name {
  font-weight: 850;
  color: #1f2937;
}

.orders-customer-address {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
  color: #94a3b8;
  font-size: 12px;
}

.orders-money,
.orders-total-value {
  font-weight: 900;
  color: #b5536b;
}

.orders-total-label {
  text-align: right;
  font-weight: 900;
  color: #1f2937;
}

.orders-badge,
.orders-linked-badge,
.orders-manual-badge {
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

.orders-linked-badge {
  background: #ecfdf3;
  color: #2f7d56;
  border-color: #2f9d6a;
}

.orders-manual-badge {
  background: #f8f3f5;
  color: #6b5b63;
  border-color: #c9b6bf;
}

.orders-action-row {
  display: flex;
  gap: 7px;
  align-items: center;
  flex-wrap: wrap;
}

.orders-view-btn,
.orders-view-active,
.orders-forward-btn,
.orders-delete-btn,
.orders-remove-btn {
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

.orders-view-btn {
  background: #fff7e8;
  color: #9a5f0f;
  border-color: #d98a1f;
}

.orders-view-active {
  background: #d98a1f;
  color: #ffffff;
  border-color: #d98a1f;
}

.orders-forward-btn {
  background: #ecfdf3;
  color: #2f7d56;
  border-color: #2f9d6a;
}

.orders-delete-btn,
.orders-remove-btn {
  background: #fff1f5;
  color: #b5536b;
  border-color: #c4607a;
}

.orders-status-select {
  width: auto;
  min-width: 130px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 800;
}

.orders-qty-input {
  width: 90px;
}

.orders-price-input {
  width: 130px;
}

.orders-empty {
  padding: 40px !important;
  text-align: center;
  color: #94a3b8 !important;
  font-size: 14px !important;
  font-weight: 700;
}

.orders-expanded-cell {
  padding: 0 !important;
  background: #fff7fa;
}

.order-items-box {
  padding: 18px;
}

.order-items-loading {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.orders-count {
  margin: 0 0 12px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

@keyframes ordersFadeUp {
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
  .orders-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .orders-span-2 {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .orders-hero {
    align-items: flex-start;
    padding: 20px;
  }

  .orders-title {
    font-size: 24px;
  }

  .orders-hero-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .orders-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .orders-search-wrap,
  .orders-add-btn {
    width: 100%;
  }

  .orders-filter-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .orders-filter-btn {
    width: 100%;
  }

  .orders-grid {
    grid-template-columns: 1fr;
  }

  .orders-span-2 {
    grid-column: span 1;
  }

  .orders-items-header {
    flex-direction: column;
    align-items: stretch;
  }

  .orders-row-btn,
  .orders-submit-btn {
    width: 100%;
  }

  .orders-table-panel {
    padding: 12px;
  }

  .orders-main-table {
    min-width: 980px;
  }

  .orders-main-table th,
  .orders-main-table td,
  .orders-items-table th,
  .orders-items-table td,
  .order-items-table th,
  .order-items-table td {
    padding: 11px 12px;
    font-size: 12px;
  }
}

@media (max-width: 520px) {
  .orders-hero {
    flex-direction: column-reverse;
  }

  .orders-filter-row {
    grid-template-columns: 1fr;
  }
}
`;

export default Orders;