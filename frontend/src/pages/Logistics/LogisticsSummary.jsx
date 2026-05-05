import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/axiosConfig';
import {
  FaBox,
  FaTruck,
  FaClock,
  FaWindowClose,
  FaCheck,
  FaChartBar,
  FaClipboardCheck,
} from "react-icons/fa";

function LogisticsSummary() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/logistics/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!summary) {
    return (
      <Layout>
        <div className="logistics-summary-loading">Loading summary...</div>
      </Layout>
    );
  }

  const shippingData = [
    { label: 'Pending', value: summary.pending, color: '#8b7280', tint: '#f8f3f5' },
    { label: 'Shipped', value: summary.shipped || 0, color: '#b5536b', tint: '#fff1f5' },
    { label: 'In Transit', value: summary.in_transit, color: '#d98a1f', tint: '#fff7e8' },
    { label: 'Delivered', value: summary.delivered, color: '#2f9d6a', tint: '#ecfdf3' },
    { label: 'Failed', value: summary.failed, color: '#c4607a', tint: '#fff1f5' },
  ];

  const packingData = [
    { label: 'Packed', value: summary.packed, color: '#2f9d6a', tint: '#ecfdf3' },
    { label: 'Unpacked', value: summary.unpacked, color: '#c4607a', tint: '#fff1f5' },
  ];

  const maxShipping = Math.max(...shippingData.map((s) => Number(s.value) || 0), 1);
  const maxPacking = Math.max(...packingData.map((s) => Number(s.value) || 0), 1);

  const cards = [
    {
      label: 'Total Shipments',
      value: summary.total,
      icon: <FaBox />,
      helper: 'All logistics records',
    },
    {
      label: 'Delivered',
      value: summary.delivered,
      icon: <FaCheck />,
      helper: 'Completed deliveries',
    },
    {
      label: 'In Transit',
      value: summary.in_transit,
      icon: <FaTruck />,
      helper: 'Currently moving',
    },
    {
      label: 'Pending',
      value: summary.pending,
      icon: <FaClock />,
      helper: 'Waiting for shipment',
    },
    {
      label: 'Failed',
      value: summary.failed,
      icon: <FaWindowClose />,
      helper: 'Unsuccessful delivery',
    },
  ];

  return (
    <Layout>
      <style>{`
        .logistics-summary-page {
          width: 100%;
          animation: logisticsFadeUp 0.35s ease both;
        }

        .logistics-summary-hero {
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

        .logistics-summary-eyebrow {
          margin: 0 0 8px;
          color: #b5536b;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .logistics-summary-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .logistics-summary-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 700px;
        }

        .logistics-summary-hero-icon {
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

        .logistics-summary-cards {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .logistics-summary-card {
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

        .logistics-summary-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: linear-gradient(180deg, #c4607a, #e58ca3);
        }

        .logistics-summary-card:hover {
          transform: translateY(-2px);
          border-color: #c4607a;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .logistics-summary-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .logistics-summary-card-label {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .logistics-summary-card-icon {
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

        .logistics-summary-card-value {
          margin: 0;
          color: #1f2937;
          font-size: 25px;
          font-weight: 850;
          letter-spacing: -0.04em;
        }

        .logistics-summary-card-helper {
          margin: 7px 0 0;
          color: #7b8794;
          font-size: 12px;
          line-height: 1.4;
        }

        .logistics-summary-charts {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 20px;
        }

        .logistics-summary-chart {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .logistics-summary-chart-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .logistics-summary-chart-icon {
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

        .logistics-summary-chart-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .logistics-summary-chart-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .logistics-summary-status-list {
          display: grid;
          gap: 14px;
        }

        .logistics-summary-bar-row {
          display: grid;
          grid-template-columns: 120px 1fr 52px;
          align-items: center;
          gap: 12px;
        }

        .logistics-summary-bar-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #374151;
          font-size: 13px;
          font-weight: 700;
        }

        .logistics-summary-dot {
          width: 9px;
          height: 9px;
          border-radius: 9999px;
          flex: 0 0 auto;
        }

        .logistics-summary-bar-track {
          height: 14px;
          border-radius: 9999px;
          background: #f3e8ec;
          overflow: hidden;
          border: 1px solid #ead1d9;
        }

        .logistics-summary-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 320ms ease;
          min-width: 8px;
        }

        .logistics-summary-bar-count {
          justify-self: end;
          min-width: 38px;
          padding: 5px 9px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 800;
          text-align: center;
          color: #1f2937;
          border: 1px solid #e8b9c6;
        }

        .logistics-summary-loading {
          min-height: 240px;
          display: grid;
          place-items: center;
          color: #b5536b;
          font-size: 14px;
          font-weight: 700;
        }

        @keyframes logisticsFadeUp {
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
          .logistics-summary-cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .logistics-summary-charts {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .logistics-summary-hero {
            align-items: flex-start;
            padding: 20px;
          }

          .logistics-summary-title {
            font-size: 24px;
          }

          .logistics-summary-hero-icon {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }

          .logistics-summary-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .logistics-summary-bar-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .logistics-summary-bar-count {
            justify-self: start;
          }
        }

        @media (max-width: 520px) {
          .logistics-summary-hero {
            flex-direction: column-reverse;
          }

          .logistics-summary-cards {
            grid-template-columns: 1fr;
          }

          .logistics-summary-card {
            min-height: auto;
          }
        }
      `}</style>

      <div className="logistics-summary-page">
        <div className="logistics-summary-hero">
          <div>
            <p className="logistics-summary-eyebrow">Logistics Overview</p>
            <h3 className="logistics-summary-title">Logistics Summary</h3>
            <p className="logistics-summary-subtitle">
              Track shipment progress, delivery performance, and packing status in one organized dashboard view.
            </p>
          </div>

          <div className="logistics-summary-hero-icon">
            <FaTruck />
          </div>
        </div>

        <div className="logistics-summary-cards">
          {cards.map((card) => (
            <div key={card.label} className="logistics-summary-card">
              <div className="logistics-summary-card-top">
                <p className="logistics-summary-card-label">{card.label}</p>
                <span className="logistics-summary-card-icon">{card.icon}</span>
              </div>

              <p className="logistics-summary-card-value">{card.value}</p>
              <p className="logistics-summary-card-helper">{card.helper}</p>
            </div>
          ))}
        </div>

        <div className="logistics-summary-charts">
          <div className="logistics-summary-chart">
            <div className="logistics-summary-chart-header">
              <div className="logistics-summary-chart-icon">
                <FaChartBar />
              </div>
              <div>
                <h4 className="logistics-summary-chart-title">Shipments by Status</h4>
                <p className="logistics-summary-chart-note">
                  Current movement and delivery distribution.
                </p>
              </div>
            </div>

            <div className="logistics-summary-status-list">
              {shippingData.map((status) => (
                <div key={status.label} className="logistics-summary-bar-row">
                  <span className="logistics-summary-bar-label">
                    <span
                      className="logistics-summary-dot"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.label}
                  </span>

                  <div className="logistics-summary-bar-track">
                    <div
                      className="logistics-summary-bar-fill"
                      style={{
                        width: `${((Number(status.value) || 0) / maxShipping) * 100}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>

                  <span
                    className="logistics-summary-bar-count"
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

          <div className="logistics-summary-chart">
            <div className="logistics-summary-chart-header">
              <div className="logistics-summary-chart-icon">
                <FaClipboardCheck />
              </div>
              <div>
                <h4 className="logistics-summary-chart-title">Packing Status</h4>
                <p className="logistics-summary-chart-note">
                  Packed and unpacked shipment preparation.
                </p>
              </div>
            </div>

            <div className="logistics-summary-status-list">
              {packingData.map((status) => (
                <div key={status.label} className="logistics-summary-bar-row">
                  <span className="logistics-summary-bar-label">
                    <span
                      className="logistics-summary-dot"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.label}
                  </span>

                  <div className="logistics-summary-bar-track">
                    <div
                      className="logistics-summary-bar-fill"
                      style={{
                        width: `${((Number(status.value) || 0) / maxPacking) * 100}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>

                  <span
                    className="logistics-summary-bar-count"
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
      </div>
    </Layout>
  );
}

export default LogisticsSummary;