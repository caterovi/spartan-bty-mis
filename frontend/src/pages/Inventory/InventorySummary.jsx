import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axiosConfig';
import {
  FaBoxOpen,
  FaChartLine,
  FaWindowClose,
  FaMoneyBill,
  FaExclamation,
  FaCheckCircle,
  FaBoxes,
} from "react-icons/fa";

function InventorySummary() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchSummary();
    fetchItems();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/inventory/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await api.get('/inventory/items');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!summary) {
    return (
      <Layout>
        <div className="inventory-summary-loading">Loading summary...</div>
      </Layout>
    );
  }

  const lowAndOut = items.filter(
    (item) => item.status === 'low-stock' || item.status === 'out-of-stock'
  );

  const cards = [
    {
      label: 'Total Items',
      value: summary.total_items,
      icon: <FaBoxOpen />,
      helper: 'All inventory records',
    },
    {
      label: 'In Stock',
      value: summary.in_stock,
      icon: <FaChartLine />,
      helper: 'Available items',
    },
    {
      label: 'Low Stock',
      value: summary.low_stock,
      icon: <FaExclamation />,
      helper: 'Needs restocking soon',
    },
    {
      label: 'Out of Stock',
      value: summary.out_of_stock,
      icon: <FaWindowClose />,
      helper: 'Unavailable items',
    },
    {
      label: 'Total Value',
      value: `₱${Number(summary.total_value || 0).toLocaleString()}`,
      icon: <FaMoneyBill />,
      helper: 'Estimated inventory value',
    },
  ];

  return (
    <Layout>
      <style>{`
        .inventory-summary-page {
          width: 100%;
          animation: inventoryFadeUp 0.35s ease both;
        }

        .inventory-summary-hero {
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
          gap: 16px;
        }

        .inventory-summary-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .inventory-summary-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .inventory-summary-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 720px;
        }

        .inventory-summary-hero-icon {
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

        .inventory-summary-cards {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .inventory-summary-card {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 16px;
          padding: 18px;
          min-height: 128px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          position: relative;
          overflow: hidden;
        }

        .inventory-summary-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: linear-gradient(180deg, #c4607a, #e58ca3);
        }

        .inventory-summary-card:hover {
          transform: translateY(-2px);
          border-color: #c4607a;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .inventory-summary-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .inventory-summary-card-label {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .inventory-summary-card-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          color: #b5536b;
          background: #fff1f5;
          border: 1px solid #e8b9c6;
          font-size: 17px;
          flex: 0 0 auto;
        }

        .inventory-summary-card-value {
          margin: 0;
          color: #1f2937;
          font-size: 25px;
          font-weight: 850;
          letter-spacing: -0.04em;
        }

        .inventory-summary-card-helper {
          margin: 7px 0 0;
          color: #7b8794;
          font-size: 12px;
          line-height: 1.4;
        }

        .inventory-panel {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .inventory-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .inventory-panel-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .inventory-panel-icon {
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

        .inventory-panel-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .inventory-panel-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .inventory-attention-badge {
          padding: 7px 11px;
          border-radius: 9999px;
          background: #fff1f5;
          color: #b5536b;
          border: 1px solid #c4607a;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .inventory-table-wrap {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #ead1d9;
          border-radius: 14px;
        }

        .inventory-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
          background: #ffffff;
        }

        .inventory-table thead {
          background: #fff7fa;
        }

        .inventory-table th {
          padding: 13px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #ead1d9;
        }

        .inventory-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #f3e8ec;
          vertical-align: middle;
        }

        .inventory-table tbody tr {
          transition: background-color 180ms ease;
        }

        .inventory-table tbody tr:hover {
          background: #fff7fa;
        }

        .inventory-table tbody tr:last-child td {
          border-bottom: none;
        }

        .inventory-item-name {
          font-weight: 800;
          color: #1f2937;
        }

        .inventory-code {
          color: #64748b;
          font-weight: 700;
        }

        .inventory-qty-low {
          color: #d98a1f;
          font-weight: 850;
        }

        .inventory-qty-out {
          color: #c4607a;
          font-weight: 850;
        }

        .inventory-status-badge {
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

        .inventory-status-low {
          background: #fff7e8;
          color: #b66d10;
          border-color: #d98a1f;
        }

        .inventory-status-out {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .inventory-good-state {
          background:
            radial-gradient(circle at top right, rgba(47, 157, 106, 0.14), transparent 34%),
            linear-gradient(135deg, #ecfdf3 0%, #ffffff 100%);
          border: 1px solid #2f9d6a;
          border-radius: 18px;
          padding: 24px;
          color: #1f2937;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .inventory-good-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #ecfdf3;
          color: #2f9d6a;
          border: 1px solid #2f9d6a;
          flex: 0 0 auto;
          font-size: 20px;
        }

        .inventory-good-title {
          margin: 0;
          color: #1f2937;
          font-size: 17px;
          font-weight: 850;
        }

        .inventory-good-text {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .inventory-summary-loading {
          min-height: 240px;
          display: grid;
          place-items: center;
          color: #b5536b;
          font-size: 14px;
          font-weight: 700;
        }

        @keyframes inventoryFadeUp {
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
          .inventory-summary-cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .inventory-summary-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .inventory-summary-title {
            font-size: 24px;
          }

          .inventory-summary-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .inventory-summary-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .inventory-panel {
            padding: 18px;
          }

          .inventory-panel-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .inventory-good-state {
            align-items: flex-start;
          }
        }

        @media (max-width: 520px) {
          .inventory-summary-hero {
            flex-direction: column-reverse;
          }

          .inventory-summary-cards {
            grid-template-columns: 1fr;
          }

          .inventory-summary-card {
            min-height: auto;
          }
        }
      `}</style>

      <div className="inventory-summary-page">
        <div className="inventory-summary-hero">
          <div>
            <p className="inventory-summary-eyebrow">Inventory Overview</p>
            <h3 className="inventory-summary-title">Inventory Summary</h3>
            <p className="inventory-summary-subtitle">
              Monitor stock levels, inventory value, and items that need immediate restocking.
            </p>
          </div>

          <div className="inventory-summary-hero-icon">
            <FaBoxes />
          </div>
        </div>

        <div className="inventory-summary-cards">
          {cards.map((card) => (
            <div key={card.label} className="inventory-summary-card">
              <div className="inventory-summary-card-top">
                <p className="inventory-summary-card-label">{card.label}</p>
                <span className="inventory-summary-card-icon">{card.icon}</span>
              </div>

              <p className="inventory-summary-card-value">{card.value}</p>
              <p className="inventory-summary-card-helper">{card.helper}</p>
            </div>
          ))}
        </div>

        {lowAndOut.length > 0 ? (
          <div className="inventory-panel">
            <div className="inventory-panel-header">
              <div className="inventory-panel-title-wrap">
                <div className="inventory-panel-icon">
                  <FaExclamation />
                </div>

                <div>
                  <h4 className="inventory-panel-title">Items Needing Attention</h4>
                  <p className="inventory-panel-note">
                    Low-stock and out-of-stock items that may need restocking.
                  </p>
                </div>
              </div>

              <span className="inventory-attention-badge">
                {lowAndOut.length} item{lowAndOut.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Code</th>
                    <th>Current Qty</th>
                    <th>Reorder Level</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {lowAndOut.map((item) => (
                    <tr key={item.id}>
                      <td className="inventory-item-name">{item.name}</td>
                      <td className="inventory-code">{item.item_code}</td>
                      <td
                        className={
                          item.status === 'out-of-stock'
                            ? 'inventory-qty-out'
                            : 'inventory-qty-low'
                        }
                      >
                        {item.quantity}
                      </td>
                      <td>{item.reorder_level}</td>
                      <td>
                        <span
                          className={
                            item.status === 'out-of-stock'
                              ? 'inventory-status-badge inventory-status-out'
                              : 'inventory-status-badge inventory-status-low'
                          }
                        >
                          {item.status.replaceAll('-', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="inventory-good-state">
            <div className="inventory-good-icon">
              <FaCheckCircle />
            </div>

            <div>
              <h4 className="inventory-good-title">All items are sufficiently stocked</h4>
              <p className="inventory-good-text">
                No low-stock or out-of-stock items need attention right now.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default InventorySummary;