import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import {
  FaBars,
  FaCamera,
  FaPalette,
  FaVideo,
  FaGlobe,
  FaCalendar,
  FaLightbulb,
  FaMicrophone,
  FaArrowLeft,
  FaPlus,
  FaTimes,
  FaTrash,
  FaEdit,
  FaCheck,
  FaBullhorn,
  FaClipboardList,
} from "react-icons/fa";

const TASK_CATEGORIES = [
  { key: 'tasks', icon: <FaBars />, label: 'Tasks' },
  { key: 'photoshoot', icon: <FaCamera />, label: 'Photoshoot' },
  { key: 'graphics', icon: <FaPalette />, label: 'Graphics' },
  { key: 'video-editing', icon: <FaVideo />, label: 'Video Editing' },
];

function CampaignDetail({ campaignId, onBack }) {
  const [campaign, setCampaign] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({});
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [equipment, setEquipment] = useState({
    equip_lights: false,
    equip_mic: false,
    equip_camera: false,
  });

  useEffect(() => {
    fetchCampaign();
    fetchTasks();
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      const res = await api.get(`/marketing/campaigns/${campaignId}`);
      setCampaign(res.data);
      setEquipment({
        equip_lights: !!res.data.equip_lights,
        equip_mic: !!res.data.equip_mic,
        equip_camera: !!res.data.equip_camera,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/marketing/campaigns/${campaignId}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      await api.post(`/marketing/campaigns/${campaignId}/tasks`, {
        category: activeTab,
        title: newTask.title,
        description: newTask.description,
      });
      setMessage('success:Task added successfully!');
      setNewTask({ title: '', description: '' });
      setShowForm(false);
      fetchTasks();
      fetchCampaign();
    } catch (err) {
      setMessage('error:Error adding task.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await api.put(`/marketing/tasks/${task.id}`, {
        status: newStatus,
        title: task.title,
        description: task.description || '',
      });
      fetchTasks();
      fetchCampaign();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditTask = (task) => {
    setEditTaskId(task.id);
    setEditTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
    });
  };

  const handleUpdateTask = async () => {
    try {
      await api.put(`/marketing/tasks/${editTaskId}`, editTaskForm);
      setMessage('success:Task updated successfully!');
      setEditTaskId(null);
      fetchTasks();
      fetchCampaign();
    } catch (err) {
      setMessage('error:Error updating task.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/marketing/tasks/${id}`);
      fetchTasks();
      fetchCampaign();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEquipmentChange = async (key, value) => {
    const updated = { ...equipment, [key]: value };
    setEquipment(updated);
    try {
      await api.put(`/marketing/campaigns/${campaignId}/equipment`, updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (!campaign) {
    return <div className="cd-loading">Loading campaign...</div>;
  }

  const tabTasks = tasks.filter(t => t.category === activeTab);
  const doneTasks = tabTasks.filter(t => t.status === 'done').length;
  const totalTasks = tabTasks.length;

  const statusColors = {
    draft: { backgroundColor: '#f8f3f5', color: '#6b5b63', borderColor: '#c9b6bf' },
    'in-progress': { backgroundColor: '#fff7e8', color: '#9a5f0f', borderColor: '#d98a1f' },
    completed: { backgroundColor: '#ecfdf3', color: '#2f7d56', borderColor: '#2f9d6a' },
    cancelled: { backgroundColor: '#fff1f5', color: '#b5536b', borderColor: '#c4607a' },
  };

  const taskStatusColors = {
    todo: { backgroundColor: '#f8f3f5', color: '#6b5b63', borderColor: '#c9b6bf' },
    'in-progress': { backgroundColor: '#fff7e8', color: '#9a5f0f', borderColor: '#d98a1f' },
    done: { backgroundColor: '#ecfdf3', color: '#2f7d56', borderColor: '#2f9d6a' },
  };

  const isError = message.startsWith('error:');
  const msgText = message.replace(/^(success:|error:)/, '');

  const progressColor =
    campaign.progress === 100 ? '#2f9d6a' :
    campaign.progress >= 50 ? '#d98a1f' :
    '#c4607a';

  const activeCategory = TASK_CATEGORIES.find(t => t.key === activeTab);
  const tabProgressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="cd-page">
      <style>{`
        .cd-page {
          width: 100%;
          animation: cdFadeUp 0.35s ease both;
        }

        .cd-loading {
          min-height: 240px;
          display: grid;
          place-items: center;
          color: #b5536b;
          font-size: 14px;
          font-weight: 700;
        }

        .cd-back-btn {
          margin-bottom: 18px;
          border: 1px solid #d8b8c2;
          border-radius: 12px;
          padding: 10px 14px;
          background: #ffffff;
          color: #b5536b;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .cd-back-btn:hover {
          transform: translateY(-1px);
          border-color: #c4607a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .cd-header {
          background:
            radial-gradient(circle at top right, rgba(196, 96, 122, 0.18), transparent 34%),
            linear-gradient(135deg, #fff7fa 0%, #ffffff 100%);
          border: 1px solid #ead1d9;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 18px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .cd-header-left {
          flex: 1;
          min-width: 0;
        }

        .cd-header-top {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .cd-campaign-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #fff1f5;
          color: #b5536b;
          border: 1px solid #e8b9c6;
          flex: 0 0 auto;
        }

        .cd-title {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 850;
          letter-spacing: -0.04em;
          line-height: 1.2;
        }

        .cd-status-badge,
        .cd-task-badge {
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

        .cd-desc {
          margin: 0 0 14px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          max-width: 760px;
        }

        .cd-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cd-meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 11px;
          border-radius: 9999px;
          background: #ffffff;
          border: 1px solid #ead1d9;
          color: #374151;
          font-size: 13px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .cd-progress-card {
          width: 150px;
          flex: 0 0 auto;
          text-align: center;
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .cd-progress-circle {
          position: relative;
          width: 92px;
          height: 92px;
          margin: 0 auto 8px;
        }

        .cd-progress-text {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #1f2937;
          font-size: 19px;
          font-weight: 850;
        }

        .cd-progress-label {
          margin: 0 0 4px;
          color: #1f2937;
          font-size: 13px;
          font-weight: 800;
        }

        .cd-progress-sub {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .cd-panel {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .cd-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }

        .cd-panel-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cd-panel-icon {
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

        .cd-panel-title {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .cd-panel-note {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .cd-equip-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .cd-equip-item {
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          border: 1px solid;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .cd-equip-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .cd-equip-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.9);
          flex: 0 0 auto;
          font-size: 17px;
        }

        .cd-equip-label {
          flex: 1;
          color: #1f2937;
          font-size: 14px;
          font-weight: 800;
        }

        .cd-equip-check {
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          display: grid;
          place-items: center;
          color: #ffffff;
          font-size: 12px;
          flex: 0 0 auto;
        }

        .cd-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          border: 1px solid;
        }

        .cd-message-success {
          background: #ecfdf3;
          color: #2f7d56;
          border-color: #2f9d6a;
        }

        .cd-message-error {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .cd-tab-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .cd-tab-btn {
          border: 1px solid #d8b8c2;
          border-radius: 14px;
          padding: 11px 14px;
          background: #ffffff;
          color: #374151;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease;
        }

        .cd-tab-btn:hover {
          transform: translateY(-1px);
          border-color: #c4607a;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .cd-tab-btn-active {
          background: linear-gradient(135deg, #c4607a, #e58ca3);
          color: #ffffff;
          border-color: #c4607a;
          box-shadow: 0 8px 18px rgba(196, 96, 122, 0.22);
        }

        .cd-tab-badge {
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 850;
          background: #fff1f5;
          color: #b5536b;
          border: 1px solid #e8b9c6;
        }

        .cd-tab-btn-active .cd-tab-badge {
          background: rgba(255, 255, 255, 0.24);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.34);
        }

        .cd-task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 14px;
        }

        .cd-add-btn,
        .cd-submit-btn {
          border: none;
          border-radius: 12px;
          padding: 11px 15px;
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

        .cd-add-btn:hover,
        .cd-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(196, 96, 122, 0.28);
        }

        .cd-tab-progress-bar {
          height: 10px;
          border-radius: 9999px;
          background: #f3e8ec;
          overflow: hidden;
          border: 1px solid #ead1d9;
          margin-bottom: 16px;
        }

        .cd-tab-progress-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 320ms ease;
          min-width: 8px;
        }

        .cd-form-box {
          background: #fff7fa;
          border: 1px solid #ead1d9;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .cd-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 14px;
        }

        .cd-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .cd-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .cd-input {
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

        .cd-input:focus {
          border-color: #c4607a;
          box-shadow: 0 0 0 4px rgba(196, 96, 122, 0.12);
          background: #fffafa;
        }

        .cd-form-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .cd-cancel-btn {
          border: 1px solid #d8b8c2;
          border-radius: 12px;
          padding: 11px 15px;
          background: #ffffff;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .cd-empty {
          background: #ffffff;
          border: 1px dashed #e2c6cf;
          border-radius: 16px;
          padding: 34px 18px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 700;
        }

        .cd-task-list {
          display: grid;
          gap: 10px;
        }

        .cd-task-item {
          background: #ffffff;
          border: 1px solid #e2c6cf;
          border-radius: 16px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .cd-task-item:hover {
          transform: translateY(-1px);
          border-color: #c4607a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .cd-checkbox {
          width: 26px;
          height: 26px;
          border-radius: 9999px;
          border: 2px solid;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex: 0 0 auto;
          transition: background-color 180ms ease, border-color 180ms ease;
        }

        .cd-task-info {
          flex: 1;
          min-width: 0;
        }

        .cd-task-title {
          margin: 0 0 3px;
          color: #1f2937;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.4;
        }

        .cd-task-desc {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.4;
        }

        .cd-task-actions {
          display: flex;
          gap: 7px;
          flex: 0 0 auto;
        }

        .cd-edit-btn,
        .cd-delete-btn {
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

        .cd-edit-btn {
          background: #fff7e8;
          color: #9a5f0f;
          border-color: #d98a1f;
        }

        .cd-delete-btn {
          background: #fff1f5;
          color: #b5536b;
          border-color: #c4607a;
        }

        .cd-edit-btn:hover,
        .cd-delete-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        @keyframes cdFadeUp {
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
          .cd-header {
            flex-direction: column;
          }

          .cd-progress-card {
            width: 100%;
          }

          .cd-equip-grid,
          .cd-form-grid {
            grid-template-columns: 1fr;
          }

          .cd-task-header {
            flex-direction: column;
            align-items: stretch;
          }

          .cd-add-btn {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .cd-back-btn {
            width: 100%;
            justify-content: center;
          }

          .cd-header,
          .cd-panel {
            padding: 18px;
          }

          .cd-title {
            font-size: 24px;
          }

          .cd-tab-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .cd-tab-btn {
            width: 100%;
            justify-content: center;
          }

          .cd-task-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .cd-task-actions {
            width: 100%;
          }

          .cd-edit-btn,
          .cd-delete-btn {
            flex: 1;
            justify-content: center;
          }

          .cd-form-actions {
            flex-direction: column;
          }

          .cd-submit-btn,
          .cd-cancel-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 520px) {
          .cd-tab-row {
            grid-template-columns: 1fr;
          }

          .cd-meta {
            flex-direction: column;
            align-items: stretch;
          }

          .cd-meta-pill {
            justify-content: center;
          }
        }
      `}</style>

      <button onClick={onBack} className="cd-back-btn">
        <FaArrowLeft />
        Back to Campaigns
      </button>

      <div className="cd-header">
        <div className="cd-header-left">
          <div className="cd-header-top">
            <div className="cd-campaign-icon">
              <FaBullhorn />
            </div>

            <h2 className="cd-title">{campaign.title}</h2>

            <span
              className="cd-status-badge"
              style={statusColors[campaign.status] || statusColors.draft}
            >
              {String(campaign.status).replaceAll('-', ' ')}
            </span>
          </div>

          <p className="cd-desc">{campaign.description || 'No description'}</p>

          <div className="cd-meta">
            <span className="cd-meta-pill">
              <FaGlobe />
              {campaign.platform}
            </span>

            <span className="cd-meta-pill">
              <FaCalendar />
              {new Date(campaign.start_date).toLocaleDateString()} to {new Date(campaign.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="cd-progress-card">
          <div className="cd-progress-circle">
            <svg width="92" height="92" viewBox="0 0 92 92">
              <circle cx="46" cy="46" r="38" fill="none" stroke="#f3e8ec" strokeWidth="8" />
              <circle
                cx="46"
                cy="46"
                r="38"
                fill="none"
                stroke={progressColor}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - campaign.progress / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 46 46)"
                style={{ transition: 'stroke-dashoffset 320ms ease' }}
              />
            </svg>

            <div className="cd-progress-text">{campaign.progress}%</div>
          </div>

          <p className="cd-progress-label">Overall Progress</p>
          <p className="cd-progress-sub">
            {campaign.completed_tasks}/{campaign.total_tasks} tasks done
          </p>
        </div>
      </div>

      <div className="cd-panel">
        <div className="cd-panel-header">
          <div className="cd-panel-title-wrap">
            <div className="cd-panel-icon">
              <FaClipboardList />
            </div>

            <div>
              <h4 className="cd-panel-title">Equipment Checklist</h4>
              <p className="cd-panel-note">Prepare the equipment needed for this campaign.</p>
            </div>
          </div>
        </div>

        <div className="cd-equip-grid">
          {[
            { key: 'equip_lights', icon: <FaLightbulb />, label: 'Lights' },
            { key: 'equip_mic', icon: <FaMicrophone />, label: 'Microphone' },
            { key: 'equip_camera', icon: <FaCamera />, label: 'Camera' },
          ].map(item => {
            const active = equipment[item.key];

            return (
              <div
                key={item.key}
                onClick={() => handleEquipmentChange(item.key, !active)}
                className="cd-equip-item"
                style={{
                  backgroundColor: active ? '#ecfdf3' : '#fff7fa',
                  borderColor: active ? '#2f9d6a' : '#e2c6cf',
                }}
              >
                <span
                  className="cd-equip-icon"
                  style={{ color: active ? '#2f9d6a' : '#b5536b' }}
                >
                  {item.icon}
                </span>

                <span className="cd-equip-label">{item.label}</span>

                <span
                  className="cd-equip-check"
                  style={{ backgroundColor: active ? '#2f9d6a' : '#c9b6bf' }}
                >
                  {active && <FaCheck />}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {message && (
        <div className={`cd-message ${isError ? 'cd-message-error' : 'cd-message-success'}`}>
          {msgText}
        </div>
      )}

      <div className="cd-tab-row">
        {TASK_CATEGORIES.map(tab => {
          const tabCount = tasks.filter(t => t.category === tab.key).length;
          const tabDone = tasks.filter(t => t.category === tab.key && t.status === 'done').length;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setShowForm(false);
              }}
              className={`cd-tab-btn ${isActive ? 'cd-tab-btn-active' : ''}`}
            >
              {tab.icon}
              {tab.label}
              <span className="cd-tab-badge">{tabDone}/{tabCount}</span>
            </button>
          );
        })}
      </div>

      <div className="cd-panel">
        <div className="cd-task-header">
          <div className="cd-panel-title-wrap">
            <div className="cd-panel-icon">
              {activeCategory?.icon}
            </div>

            <div>
              <h4 className="cd-panel-title">{activeCategory?.label}</h4>
              <p className="cd-panel-note">
                {doneTasks}/{totalTasks} tasks completed
                {totalTasks > 0 ? ` (${tabProgressPercent}%)` : ''}
              </p>
            </div>
          </div>

          <button onClick={() => setShowForm(!showForm)} className="cd-add-btn">
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? 'Cancel' : 'Add Task'}
          </button>
        </div>

        {totalTasks > 0 && (
          <div className="cd-tab-progress-bar">
            <div
              className="cd-tab-progress-fill"
              style={{
                width: `${tabProgressPercent}%`,
                backgroundColor: doneTasks === totalTasks ? '#2f9d6a' : '#c4607a',
              }}
            />
          </div>
        )}

        {showForm && (
          <div className="cd-form-box">
            <div className="cd-form-grid">
              <div className="cd-field">
                <label className="cd-label">Task Title</label>
                <input
                  type="text"
                  placeholder={`e.g. ${
                    activeTab === 'tasks'
                      ? 'Plan campaign strategy'
                      : activeTab === 'photoshoot'
                      ? 'Book photographer'
                      : activeTab === 'graphics'
                      ? 'Design banner'
                      : 'Edit promo video'
                  }`}
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="cd-input"
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                />
              </div>

              <div className="cd-field">
                <label className="cd-label">Description</label>
                <input
                  type="text"
                  placeholder="Brief description..."
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className="cd-input"
                />
              </div>
            </div>

            <button onClick={handleAddTask} className="cd-submit-btn">
              <FaPlus />
              Add Task
            </button>
          </div>
        )}

        {editTaskId && (
          <div className="cd-form-box">
            <div className="cd-form-grid">
              <div className="cd-field">
                <label className="cd-label">Task Title</label>
                <input
                  type="text"
                  value={editTaskForm.title}
                  onChange={e => setEditTaskForm({ ...editTaskForm, title: e.target.value })}
                  className="cd-input"
                />
              </div>

              <div className="cd-field">
                <label className="cd-label">Description</label>
                <input
                  type="text"
                  value={editTaskForm.description}
                  onChange={e => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                  className="cd-input"
                />
              </div>

              <div className="cd-field">
                <label className="cd-label">Status</label>
                <select
                  value={editTaskForm.status}
                  onChange={e => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
                  className="cd-input"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div className="cd-form-actions">
              <button onClick={handleUpdateTask} className="cd-submit-btn">
                <FaCheck />
                Save
              </button>

              <button onClick={() => setEditTaskId(null)} className="cd-cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        {tabTasks.length === 0 ? (
          <div className="cd-empty">
            No tasks yet for {activeCategory?.label}. Add one above.
          </div>
        ) : (
          <div className="cd-task-list">
            {tabTasks.map(task => {
              const isDone = task.status === 'done';
              const taskBorder =
                task.status === 'done' ? '#2f9d6a' :
                task.status === 'in-progress' ? '#d98a1f' :
                '#c9b6bf';

              return (
                <div
                  key={task.id}
                  className="cd-task-item"
                  style={{
                    backgroundColor: isDone ? '#f8fff9' : '#ffffff',
                    borderColor: taskBorder,
                  }}
                >
                  <div
                    onClick={() => handleToggleTask(task)}
                    className="cd-checkbox"
                    style={{
                      backgroundColor: isDone ? '#2f9d6a' : '#ffffff',
                      borderColor: isDone ? '#2f9d6a' : '#c9b6bf',
                      color: '#ffffff',
                    }}
                  >
                    {isDone && <FaCheck />}
                  </div>

                  <div className="cd-task-info">
                    <p
                      className="cd-task-title"
                      style={{
                        textDecoration: isDone ? 'line-through' : 'none',
                        color: isDone ? '#94a3b8' : '#1f2937',
                      }}
                    >
                      {task.title}
                    </p>

                    {task.description && (
                      <p className="cd-task-desc">{task.description}</p>
                    )}
                  </div>

                  <span
                    className="cd-task-badge"
                    style={taskStatusColors[task.status] || taskStatusColors.todo}
                  >
                    {task.status === 'in-progress'
                      ? 'In Progress'
                      : task.status === 'todo'
                      ? 'To Do'
                      : 'Done'}
                  </span>

                  <div className="cd-task-actions">
                    <button onClick={() => handleEditTask(task)} className="cd-edit-btn">
                      <FaEdit />
                      Edit
                    </button>

                    <button onClick={() => handleDeleteTask(task.id)} className="cd-delete-btn">
                      <FaTrash />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignDetail;