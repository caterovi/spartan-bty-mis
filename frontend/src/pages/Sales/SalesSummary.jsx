import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axiosConfig';
import {
  FaCartPlus,
  FaMoneyBill,
  FaClock,
  FaTruck,
  FaWindowClose,
  FaChartBar,
  FaCheckCircle,
} from "react-icons/fa";

function SalesSummary() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/sales/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!summary) {
    return (
      <Layout>
        <div className="sales-summary-loading">Loading summary...</div>
      </Layout>
    );
  }

  const statusData = [
    { label: 'Pending', value: summary.pending, color: '#d98a1f', tint: '#fff7e8' },
    { label: 'Confirmed', value: summary.confirmed, color: '#b5536b', tint: '#fff1f5' },
    { label: 'Forwarded', value: summary.forwarded, color: '#2f9d6a', tint: '#ecfdf3' },
    { label: 'Cancelled', value: summary.cancelled, color: '#c4607a', tint: '#fff1f5' },
  ];

  const maxVal = Math.max(...statusData.map((s) => Number(s.value) || 0), 1);

  const cards = [
    {
      label: 'Total Orders',
      value: summary.total_orders,
      icon: <FaCartPlus />,
      helper: 'All recorded sales orders',
    },
    {
      label: 'Total Revenue',
      value: `₱${Number(summary.total_revenue || 0).toLocaleString()}`,
      icon: <FaMoneyBill />,
      helper: 'Estimated sales income',
    },
    {
      label: 'Pending',
      value: summary.pending,
      icon: <FaClock />,
      helper: 'Awaiting confirmation',
    },
    {
      label: 'Forwarded',
      value: summary.forwarded,
      icon: <FaTruck />,
      helper: 'Sent to logistics',
    },
    {
      label: 'Cancelled',
      value: summary.cancelled,
      icon: <FaWindowClose />,
      helper: 'Cancelled transactions',
    },
  ];

  return (
    <Layout>
      <style>{`
        .sales-summary-page {
          width: 100%;
          animation: salesFadeUp 0.35s ease both;
        }

        .sales-summary-hero {
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

        .sales-summary-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .sales-summary-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .sales-summary-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 680px;
        }

        .sales-summary-hero-icon {
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

        .sales-summary-cards {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .sales-summary-card {
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

        .sales-summary-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: linear-gradient(180deg, #c4607a, #e58ca3);
        }

        .sales-summary-card:hover {
          transform: translateY(-2px);
          border-color: #c4607a;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .sales-summary-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .sales-summary-card-label {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .sales-summary-card-icon {
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

        .sales-summary-card-value {
          margin: 0;
          color: #1f2937;
          font-size: 25px;
          font-weight: 850;
          letter-spacing: -0.04em;
        }

        .sales-summary-card-helper {
          margin: 7px 0 0;
          color: #7b8794;
          font-size: 12px;
          line-height: 1.4;
        }

        .sales-summary-chart {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .sales-summary-chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .sales-summary-chart-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sales-summary-chart-icon {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: #fff1f5;
          border: 1px solid #e8b9c6;
          color: #b5536b;
        }

        .sales-summary-chart-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .sales-summary-chart-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .sales-summary-status-list {
          display: grid;
          gap: 14px;
        }

        .sales-summary-bar-row {
          display: grid;
          grid-template-columns: 120px 1fr 52px;
          align-items: center;
          gap: 12px;
        }

        .sales-summary-bar-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #374151;
          font-size: 13px;
          font-weight: 700;
        }

        .sales-summary-dot {
          width: 9px;
          height: 9px;
          border-radius: 9999px;
          flex: 0 0 auto;
        }

        .sales-summary-bar-track {
          height: 14px;
          border-radius: 9999px;
          background: #f3e8ec;
          overflow: hidden;
          border: 1px solid #ead1d9;
        }

        .sales-summary-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 320ms ease;
          min-width: 8px;
        }

        .sales-summary-bar-count {
          justify-self: end;
          min-width: 38px;
          padding: 5px 9px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 800;
          text-align: center;
          color: #1f2937;
          background: #fff7fa;
          border: 1px solid #e8b9c6;
        }

        .sales-summary-loading {
          min-height: 240px;
          display: grid;
          place-items: center;
          color: #b5536b;
          font-size: 14px;
          font-weight: 700;
        }

        @keyframes salesFadeUp {
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
          .sales-summary-cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .sales-summary-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .sales-summary-title {
            font-size: 24px;
          }

          .sales-summary-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .sales-summary-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sales-summary-bar-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .sales-summary-bar-count {
            justify-self: start;
          }

          .sales-summary-chart-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 520px) {
          .sales-summary-hero {
            flex-direction: column-reverse;
          }

          .sales-summary-cards {
            grid-template-columns: 1fr;
          }

          .sales-summary-card {
            min-height: auto;
          }
        }
      `}</style>

      <div className="sales-summary-page">
        <div className="sales-summary-hero">
          <div>
            <p className="sales-summary-eyebrow">Sales Overview</p>
            <h3 className="sales-summary-title">Sales Summary</h3>
            <p className="sales-summary-subtitle">
              Monitor order volume, revenue, and fulfillment status in one clean dashboard view.
            </p>
          </div>

          <div className="sales-summary-hero-icon">
            <FaChartBar />
          </div>
        </div>

        <div className="sales-summary-cards">
          {cards.map((card) => (
            <div key={card.label} className="sales-summary-card">
              <div className="sales-summary-card-top">
                <p className="sales-summary-card-label">{card.label}</p>
                <span className="sales-summary-card-icon">{card.icon}</span>
              </div>

              <p className="sales-summary-card-value">{card.value}</p>
              <p className="sales-summary-card-helper">{card.helper}</p>
            </div>
          ))}
        </div>

        <div className="sales-summary-chart">
          <div className="sales-summary-chart-header">
            <div className="sales-summary-chart-title-wrap">
              <div className="sales-summary-chart-icon">
                <FaCheckCircle />
              </div>
              <div>
                <h4 className="sales-summary-chart-title">Orders by Status</h4>
                <p className="sales-summary-chart-note">
                  Current distribution of sales order progress.
                </p>
              </div>
            </div>
          </div>

          <div className="sales-summary-status-list">
            {statusData.map((status) => (
              <div key={status.label} className="sales-summary-bar-row">
                <span className="sales-summary-bar-label">
                  <span
                    className="sales-summary-dot"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.label}
                </span>

                <div className="sales-summary-bar-track">
                  <div
                    className="sales-summary-bar-fill"
                    style={{
                      width: `${((Number(status.value) || 0) / maxVal) * 100}%`,
                      backgroundColor: status.color,
                    }}
                  />
                </div>

                <span
                  className="sales-summary-bar-count"
                  style={{
                    backgroundColor: status.tint,
                    borderColor: status.color,
                  }}
                >
                  {status.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default SalesSummary;