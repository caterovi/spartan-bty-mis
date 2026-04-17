import { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';
import { FaImage, FaFilePdf, } from "react-icons/fa";

function Shipments() {
  const [shipments, setShipments]   = useState([]);
  const [editId, setEditId]         = useState(null);
  const [message, setMessage]       = useState('');
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [editForm, setEditForm]     = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const fileInputRef = useRef(null);
  const activeUploadId = useRef(null);

  useEffect(() => { fetchShipments(); }, []);

  const fetchShipments = async () => {
    try {
      const res = await api.get('/logistics/shipments');
      setShipments(res.data);
    } catch (err) { console.error(err); }
  };

  const handleEdit = (s) => {
    setEditId(s.id);
    setEditForm({
      courier:            s.courier            || '',
      tracking_number:    s.tracking_number    || '',
      packing_status:     s.packing_status     || 'unpacked',
      shipping_status:    s.shipping_status    || 'pending',
      ship_date:          s.ship_date          ? s.ship_date.split('T')[0]          : '',
      estimated_delivery: s.estimated_delivery ? s.estimated_delivery.split('T')[0] : '',
      actual_delivery:    s.actual_delivery    ? s.actual_delivery.split('T')[0]    : '',
      notes:              s.notes              || '',
    });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/logistics/shipments/${editId}`, editForm);
      setMessage('success:Shipment updated successfully!');
      setEditId(null);
      fetchShipments();
    } catch (err) {
      setMessage('error:Error updating shipment.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  // Upload receipt
  const handleUploadClick = (shipmentId) => {
    activeUploadId.current = shipmentId;
    setUploadingId(shipmentId);
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) { setUploadingId(null); return; }

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      setMessage('success:Uploading receipt...');
      await api.post(`/logistics/shipments/${activeUploadId.current}/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('success:Receipt uploaded successfully!');
      fetchShipments();
    } catch (err) {
      setMessage('error:' + (err.response?.data?.message || 'Upload failed.'));
    } finally {
      setUploadingId(null);
      fileInputRef.current.value = '';
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteReceipt = async (shipmentId) => {
    if (!window.confirm('Remove this receipt?')) return;
    try {
      await api.delete(`/logistics/shipments/${shipmentId}/receipt`);
      setMessage('success:Receipt removed.');
      fetchShipments();
    } catch (err) {
      setMessage('error:Error removing receipt.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const filtered = shipments.filter(s => {
    const matchFilter = filter === 'all' || s.shipping_status === filter;
    const matchSearch =
      s.shipment_code.toLowerCase().includes(search.toLowerCase()) ||
      (s.order_code || '').toLowerCase().includes(search.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.courier || '').toLowerCase().includes(search.toLowerCase()) ||
      s.shipping_status.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const packingColors = {
    unpacked: { backgroundColor: '#f0f0f0', color: '#888' },
    packing:  { backgroundColor: '#fff3cd', color: '#856404' },
    packed:   { backgroundColor: '#d4edda', color: '#155724' },
  };

  const shippingColors = {
    pending:    { backgroundColor: '#f0f0f0', color: '#888' },
    shipped:    { backgroundColor: '#eaf4fb', color: '#2980b9' },
    'in-transit':{ backgroundColor: '#fff3cd', color: '#856404' },
    delivered:  { backgroundColor: '#d4edda', color: '#155724' },
    returned:   { backgroundColor: '#f8d7da', color: '#721c24' },
  };

  const isSuccess = message.startsWith('success:');
  const isError   = message.startsWith('error:');
  const msgText   = message.replace(/^(success:|error:)/, '');

  return (
    <div>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/jpeg,image/png,image/jpg,application/pdf"
        onChange={handleFileChange}
      />

      <div style={styles.topRow} className="mobile-top-row">
        <h3 style={styles.sectionTitle}>Shipments</h3>
        <div className="mobile-button-group">
          <input
            type="text"
            placeholder="Search shipments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
            className="mobile-search"
          />
        </div>
      </div>
      <div style={styles.hint}>
         Shipments are created automatically when Sales forwards an order
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          fontSize: '14px', fontWeight: '500',
          backgroundColor: isError ? '#f8d7da' : '#d4edda',
          color:           isError ? '#721c24' : '#155724',
          border:          `1px solid ${isError ? '#f5c6cb' : '#c3e6cb'}`,
        }}>
          {isSuccess ? '' : ''}{msgText}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={styles.filterRow} className="resp-filters mobile-filter-row">
        {['all','pending','shipped','in-transit','delivered','returned'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={filter === f ? styles.filterActive : styles.filter}
          >
            {f === 'all' ? 'All' : f.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      <p style={styles.resultCount}>
        {filtered.length} shipment{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Edit Form */}
      {editId && (
        <div style={styles.editForm}>
          <h4 style={styles.formTitle}>Edit Shipment</h4>
          <div style={styles.grid} className="mobile-form-grid">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Courier</label>
              <input
                type="text"
                placeholder="e.g. LBC, J&T, JRS"
                value={editForm.courier}
                onChange={e => setEditForm({ ...editForm, courier: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Tracking Number</label>
              <input
                type="text"
                placeholder="Tracking number"
                value={editForm.tracking_number}
                onChange={e => setEditForm({ ...editForm, tracking_number: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Packing Status</label>
              <select value={editForm.packing_status} onChange={e => setEditForm({ ...editForm, packing_status: e.target.value })} style={styles.input}>
                <option value="unpacked">Unpacked</option>
                <option value="packing">Packing</option>
                <option value="packed">Packed</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Shipping Status</label>
              <select value={editForm.shipping_status} onChange={e => setEditForm({ ...editForm, shipping_status: e.target.value })} style={styles.input}>
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="in-transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="returned">Returned</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Ship Date</label>
              <input type="date" value={editForm.ship_date} onChange={e => setEditForm({ ...editForm, ship_date: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Est. Delivery</label>
              <input type="date" value={editForm.estimated_delivery} onChange={e => setEditForm({ ...editForm, estimated_delivery: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Actual Delivery</label>
              <input type="date" value={editForm.actual_delivery} onChange={e => setEditForm({ ...editForm, actual_delivery: e.target.value })} style={styles.input} />
            </div>
            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Notes</label>
              <input type="text" placeholder="Optional notes" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} style={styles.input} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleUpdate} style={styles.submitBtn}>Save Changes</button>
            <button onClick={() => setEditId(null)} style={styles.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Shipments Table */}
      
      <div className="resp-table-wrap mobile-table-container">
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Shipment Code</th>
            <th style={styles.th}>Order Code</th>
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Courier</th>
            <th style={styles.th}>Packing</th>
            <th style={styles.th}>Shipping</th>
            <th style={styles.th}>Est. Delivery</th>
            <th style={styles.th}>E-Receipt</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="9" style={styles.empty}>
                No shipments found. Forward an order from Sales to create one.
              </td>
            </tr>
          ) : filtered.map(s => (
            <tr key={s.id} style={styles.tr}>
              <td style={styles.td}>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>{s.shipment_code}</div>
              </td>
              <td style={styles.td}>{s.order_code || '—'}</td>
              <td style={styles.td}>
                <div style={{ fontWeight: '500' }}>{s.customer_name}</div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>{s.customer_address || ''}</div>
              </td>
              <td style={styles.td}>{s.courier || '—'}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, ...packingColors[s.packing_status] }}>
                  {s.packing_status}
                </span>
              </td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, ...shippingColors[s.shipping_status] }}>
                  {s.shipping_status}
                </span>
              </td>
              <td style={styles.td}>
                {s.estimated_delivery
                  ? new Date(s.estimated_delivery).toLocaleDateString()
                  : '—'
                }
              </td>

              {/* E-Receipt Column */}
              <td style={styles.td}>
                {s.receipt_path ? (
                  <div style={styles.receiptCell}>
                    <div style={styles.receiptInfo}>
                      <span style={styles.receiptIcon}>
                        {s.receipt_name?.endsWith('.pdf') ? <FaFilePdf/> : <FaImage/>}
                      </span>
                      <span style={styles.receiptName} title={s.receipt_name}>
                        {s.receipt_name?.length > 14
                          ? s.receipt_name.substring(0, 14) + '...'
                          : s.receipt_name
                        }
                      </span>
                    </div>
                    <div style={styles.receiptBtns}>
                      <button
                        onClick={() => setPreviewReceipt({
                          path: `http://localhost:5000${s.receipt_path}`,
                          name: s.receipt_name,
                          isPdf: s.receipt_name?.endsWith('.pdf'),
                        })}
                        style={styles.viewReceiptBtn}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteReceipt(s.id)}
                        style={styles.removeReceiptBtn}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleUploadClick(s.id)}
                    disabled={uploadingId === s.id}
                    style={uploadingId === s.id ? styles.uploadingBtn : styles.uploadBtn}
                  >
                    {uploadingId === s.id ? 'Uploading...' : 'Upload'}
                  </button>
                )}
              </td>

              {/* Actions */}
              <td style={styles.td}>
                <button onClick={() => handleEdit(s)} style={styles.editBtn}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Receipt Preview Modal */}
      {previewReceipt && (
        <div style={styles.modalOverlay} onClick={() => setPreviewReceipt(null)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>
                {previewReceipt.isPdf ? <FaFilePdf/> : <FaImage/>} {previewReceipt.name}
              </h4>
              <button onClick={() => setPreviewReceipt(null)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {previewReceipt.isPdf ? (
                <iframe
                  src={previewReceipt.path}
                  title="Receipt PDF"
                  style={{ width: '100%', height: '500px', border: 'none', borderRadius: '8px' }}
                />
              ) : (
                <img
                  src={previewReceipt.path}
                  alt="Receipt"
                  style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px' }}
                />
              )}
            </div>
            <div style={styles.modalFooter}>
              <a
                href={previewReceipt.path}
                download={previewReceipt.name}
                style={styles.downloadBtn}
              >
                ⬇ Download Receipt
              </a>
              <button onClick={() => setPreviewReceipt(null)} style={styles.closeBtn}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#302e2e', margin: 0 },
  topRight: { display: 'flex', gap: '10px', alignItems: 'center' },
  searchInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', width: '220px' },
  hint: { fontSize: '12px', color: '#aaa', fontStyle: 'italic' },
  filterRow: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  filter: { padding: '6px 16px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', color: '#555' },
  filterActive: { padding: '6px 16px', borderRadius: '20px', border: '1px solid #c4607a', backgroundColor: '#c4607a', cursor: 'pointer', fontSize: '13px', color: '#fff' },
  resultCount: { fontSize: '13px', color: '#888', margin: '0 0 12px' },
  editForm: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '20px', marginBottom: '24px', borderLeft: '4px solid #c4607a' },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', backgroundColor: '#fff' },
  submitBtn: { padding: '11px 24px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  cancelBtn: { padding: '11px 24px', backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#555', borderBottom: '1px solid #eee' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333' },
  empty: { padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  editBtn: { padding: '6px 12px', backgroundColor: '#eaf4fb', color: '#2980b9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },

  // Upload Button
  uploadBtn: { padding: '6px 12px', backgroundColor: '#fdf0f3', color: '#c4607a', border: '1px dashed #c4607a', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' },
  uploadingBtn: { padding: '6px 12px', backgroundColor: '#f8f9fa', color: '#aaa', border: '1px dashed #ddd', borderRadius: '6px', cursor: 'not-allowed', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' },

  // Receipt Cell
  receiptCell: { display: 'flex', flexDirection: 'column', gap: '6px' },
  receiptInfo: { display: 'flex', alignItems: 'center', gap: '6px' },
  receiptIcon: { fontSize: '16px' },
  receiptName: { fontSize: '12px', color: '#555', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  receiptBtns: { display: 'flex', gap: '4px' },
  viewReceiptBtn: { padding: '4px 10px', backgroundColor: '#d4edda', color: '#155724', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  removeReceiptBtn: { padding: '4px 8px', backgroundColor: '#f8d7da', color: '#721c24', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },

  // Modal
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  modalBox: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '700px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #eee' },
  modalTitle: { fontSize: '16px', fontWeight: '600', color: '#302e2e', margin: 0 },
  modalClose: { backgroundColor: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888', padding: '4px 8px' },
  modalBody: { padding: '24px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid #eee' },
  downloadBtn: { padding: '10px 20px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' },
  closeBtn: { padding: '10px 20px', backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
};

export default Shipments;