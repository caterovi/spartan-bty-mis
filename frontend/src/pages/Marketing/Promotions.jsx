import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import Layout from '../../components/Layout';
import {
  FaTicketAlt,
  FaPlus,
  FaTimes,
  FaSearch,
  FaSave,
  FaTrash,
  FaCalendar,
  FaMoneyBillWave,
  FaPercent,
} from "react-icons/fa";

function Promotions() {
  const [promos, setPromos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    promo_code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order: '0',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const res = await api.get('/marketing/promotions');
      setPromos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/marketing/promotions', form);
      setMessage('Promotion created successfully!');
      setIsError(false);
      setShowForm(false);
      setForm({
        promo_code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order: '0',
        start_date: '',
        end_date: '',
      });
      fetchPromos();
    } catch (err) {
      setMessage('Error creating promotion.');
      setIsError(true);
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/marketing/promotions/${id}/status`, { status });
      fetchPromos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promotion?')) return;
    try {
      await api.delete(`/marketing/promotions/${id}`);
      fetchPromos();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = promos.filter(
    (p) =>
      p.promo_code.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    active: { backgroundColor: '#ecfdf3', color: '#2f7d56', borderColor: '#2f9d6a' },
    inactive: { backgroundColor: '#f8f3f5', color: '#6b5b63', borderColor: '#c9b6bf' },
    expired: { backgroundColor: '#fff1f5', color: '#b5536b', borderColor: '#c4607a' },
  };

  return (
    <Layout>
      <style>{`
        .promo-page {
          width: 100%;
          min-width: 0;
          animation: promoFadeUp 0.35s ease both;
        }

        .promo-hero {
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

        .promo-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .promo-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .promo-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .promo-hero-icon {
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

        .promo-toolbar {
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

        .promo-search-wrap {
          position: relative;
          width: 280px;
          max-width: 100%;
        }

        .promo-search-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b5536b;
          font-size: 13px;
          pointer-events: none;
        }

        .promo-search {
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

        .promo-search:focus {
          border-color: #c4607a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
        }

        .promo-add-btn,
        .promo-submit-btn {
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
          transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
          white-space: nowrap;
        }

        .promo-add-btn:hover,
        .promo-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .promo-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .promo-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .promo-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .promo-form {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .promo-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .promo-form-icon {
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

        .promo-form-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .promo-form-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .promo-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .promo-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .promo-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .promo-input {
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

        .promo-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .promo-span-3 {
          grid-column: span 3;
        }

        .promo-result-count {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .promo-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .promo-card {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 18px;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .promo-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: linear-gradient(180deg, #c4607a, #e58ca3);
        }

        .promo-card:hover {
          transform: translateY(-2px);
          border-color: #c4607a;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .promo-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .promo-code {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #b5536b;
          background: #fff1f5;
          border: 1px solid #e8b9c6;
          border-radius: 9999px;
          padding: 7px 11px;
          font-size: 13px;
          font-weight: 850;
          letter-spacing: 0.04em;
        }

        .promo-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
          border: 1px solid;
          white-space: nowrap;
        }

        .promo-discount {
          margin: 2px 0 0;
          color: #1f2937;
          font-size: 26px;
          font-weight: 850;
          letter-spacing: -0.04em;
        }

        .promo-desc {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
          min-height: 39px;
        }

        .promo-meta-list {
          display: grid;
          gap: 8px;
          margin-top: 2px;
        }

        .promo-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.4;
        }

        .promo-meta svg {
          color: #b5536b;
          flex: 0 0 auto;
        }

        .promo-actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
        }

        .promo-status-select {
          flex: 1;
          min-width: 0;
          padding: 9px 10px;
          border-radius: 10px;
          border: 1px solid #d8b8c2;
          background: #ffffff;
          color: #374151;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          outline: none;
        }

        .promo-delete-btn {
          border: 1px solid #c4607a;
          border-radius: 10px;
          padding: 9px 12px;
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

        .promo-delete-btn:hover {
          background: #ffe4ec;
          transform: translateY(-1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .promo-empty {
          grid-column: 1 / -1;
          background: #ffffff;
          border: 1px dashed #e2c6cf;
          border-radius: 18px;
          padding: 42px 20px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 700;
        }

        @keyframes promoFadeUp {
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
          .promo-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .promo-form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .promo-span-3 {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .promo-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .promo-title {
            font-size: 24px;
          }

          .promo-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .promo-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .promo-search-wrap,
          .promo-add-btn {
            width: 100%;
          }

          .promo-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .promo-hero {
            flex-direction: column-reverse;
          }

          .promo-form-grid {
            grid-template-columns: 1fr;
          }

          .promo-span-3 {
            grid-column: span 1;
          }

          .promo-card-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .promo-actions {
            flex-direction: column;
          }

          .promo-status-select,
          .promo-delete-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="promo-page">
        <div className="promo-hero">
          <div>
            <p className="promo-eyebrow">Marketing Offers</p>
            <h3 className="promo-title">Promotions</h3>
            <p className="promo-subtitle">
              Create and manage promo codes, discount values, minimum order rules, and active campaign offers.
            </p>
          </div>

          <div className="promo-hero-icon">
            <FaTicketAlt />
          </div>
        </div>

        <div className="promo-toolbar">
          <div className="promo-search-wrap">
            <FaSearch className="promo-search-icon" />
            <input
              type="text"
              placeholder="Search promos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="promo-search"
            />
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="promo-add-btn"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'New Promo'}
          </button>
        </div>

        {message && (
          <div className={`promo-message ${isError ? 'promo-message-error' : 'promo-message-success'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="promo-form">
            <div className="promo-form-header">
              <div className="promo-form-icon">
                <FaTicketAlt />
              </div>

              <div>
                <h4 className="promo-form-title">Create Promotion</h4>
                <p className="promo-form-note">
                  Add promo code details, discount rules, and validity period.
                </p>
              </div>
            </div>

            <div className="promo-form-grid">
              <div className="promo-field">
                <label className="promo-label">Promo Code</label>
                <input
                  type="text"
                  placeholder="e.g. SALE20"
                  value={form.promo_code}
                  onChange={(e) => setForm({ ...form, promo_code: e.target.value })}
                  className="promo-input"
                />
              </div>

              <div className="promo-field">
                <label className="promo-label">Discount Type</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                  className="promo-input"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₱)</option>
                </select>
              </div>

              <div className="promo-field">
                <label className="promo-label">Discount Value</label>
                <input
                  type="number"
                  placeholder="e.g. 20"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  className="promo-input"
                />
              </div>

              <div className="promo-field">
                <label className="promo-label">Minimum Order</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.min_order}
                  onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                  className="promo-input"
                />
              </div>

              <div className="promo-field">
                <label className="promo-label">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="promo-input"
                />
              </div>

              <div className="promo-field">
                <label className="promo-label">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="promo-input"
                />
              </div>

              <div className="promo-field promo-span-3">
                <label className="promo-label">Description</label>
                <input
                  type="text"
                  placeholder="Promo description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="promo-input"
                />
              </div>
            </div>

            <button onClick={handleSubmit} className="promo-submit-btn">
              <FaSave />
              Save Promotion
            </button>
          </div>
        )}

        <p className="promo-result-count">
          {filtered.length} promo{filtered.length !== 1 ? 's' : ''} found
        </p>

        <div className="promo-grid">
          {filtered.length === 0 ? (
            <div className="promo-empty">No promotions found.</div>
          ) : (
            filtered.map((p) => (
              <div key={p.id} className="promo-card">
                <div className="promo-card-top">
                  <span className="promo-code">
                    <FaTicketAlt />
                    {p.promo_code}
                  </span>

                  <span
                    className="promo-badge"
                    style={statusColors[p.status] || statusColors.inactive}
                  >
                    {p.status}
                  </span>
                </div>

                <p className="promo-discount">
                  {p.discount_type === 'percentage'
                    ? `${p.discount_value}% OFF`
                    : `₱${Number(p.discount_value).toLocaleString()} OFF`}
                </p>

                <p className="promo-desc">{p.description || 'No description'}</p>

                <div className="promo-meta-list">
                  <p className="promo-meta">
                    {p.discount_type === 'percentage' ? <FaPercent /> : <FaMoneyBillWave />}
                    Minimum order: ₱{Number(p.min_order).toLocaleString()}
                  </p>

                  <p className="promo-meta">
                    <FaCalendar />
                    {new Date(p.start_date).toLocaleDateString()} to {new Date(p.end_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="promo-actions">
                  <select
                    value={p.status}
                    onChange={(e) => handleStatus(p.id, e.target.value)}
                    className="promo-status-select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                  </select>

                  <button
                    onClick={() => handleDelete(p.id)}
                    className="promo-delete-btn"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Promotions;