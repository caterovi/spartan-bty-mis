import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { FaBars, FaCamera, FaPalette, FaVideo, FaGlobe, FaCalendar, FaLightbulb, FaMicrophone } from "react-icons/fa";

const TASK_CATEGORIES = [
  { key: 'tasks',         icon: <FaBars />, label: 'Tasks' },
  { key: 'photoshoot',    icon: <FaCamera />, label: 'Photoshoot' },
  { key: 'graphics',      icon: <FaPalette />, label: 'Graphics' },
  { key: 'video-editing', icon: <FaVideo />, label: 'Video Editing' },
];

function CampaignDetail({ campaignId, onBack }) {
  const [campaign, setCampaign]   = useState(null);
  const [tasks, setTasks]         = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showForm, setShowForm]   = useState(false);
  const [message, setMessage]     = useState('');
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({});
  const [newTask, setNewTask]     = useState({ title: '', description: '' });
  const [equipment, setEquipment] = useState({
    equip_lights: false, equip_mic: false, equip_camera: false,
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
        equip_lights:  !!res.data.equip_lights,
        equip_mic:     !!res.data.equip_mic,
        equip_camera:  !!res.data.equip_camera,
      });
    } catch (err) { console.error(err); }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/marketing/campaigns/${campaignId}/tasks`);
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      await api.post(`/marketing/campaigns/${campaignId}/tasks`, {
        category:    activeTab,
        title:       newTask.title,
        description: newTask.description,
      });
      setMessage('success:Task added!');
      setNewTask({ title: '', description: '' });
      setShowForm(false);
      fetchTasks();
      fetchCampaign();
    } catch (err) {
      setMessage('error:Error adding task.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await api.put(`/marketing/tasks/${task.id}`, {
        status:      newStatus,
        title:       task.title,
        description: task.description || '',
      });
      fetchTasks();
      fetchCampaign();
    } catch (err) { console.error(err); }
  };

  const handleEditTask = (task) => {
    setEditTaskId(task.id);
    setEditTaskForm({ title: task.title, description: task.description || '', status: task.status });
  };

  const handleUpdateTask = async () => {
    try {
      await api.put(`/marketing/tasks/${editTaskId}`, editTaskForm);
      setMessage('success:Task updated!');
      setEditTaskId(null);
      fetchTasks();
      fetchCampaign();
    } catch (err) {
      setMessage('error:Error updating task.');
    } finally { setTimeout(() => setMessage(''), 3000); }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/marketing/tasks/${id}`);
      fetchTasks();
      fetchCampaign();
    } catch (err) { console.error(err); }
  };

  const handleEquipmentChange = async (key, value) => {
    const updated = { ...equipment, [key]: value };
    setEquipment(updated);
    try {
      await api.put(`/marketing/campaigns/${campaignId}/equipment`, updated);
    } catch (err) { console.error(err); }
  };

  const tabTasks = tasks.filter(t => t.category === activeTab);
  const doneTasks = tabTasks.filter(t => t.status === 'done').length;
  const totalTasks = tabTasks.length;

  const statusColors = {
    draft:         { backgroundColor: '#f0f0f0', color: '#888' },
    'in-progress': { backgroundColor: '#fff3cd', color: '#856404' },
    completed:     { backgroundColor: '#d4edda', color: '#155724' },
    cancelled:     { backgroundColor: '#f8d7da', color: '#721c24' },
  };

  const taskStatusColors = {
    todo:          { backgroundColor: '#f0f0f0', color: '#888' },
    'in-progress': { backgroundColor: '#fff3cd', color: '#856404' },
    done:          { backgroundColor: '#d4edda', color: '#155724' },
  };

  const isSuccess = message.startsWith('success:');
  const isError   = message.startsWith('error:');
  const msgText   = message.replace(/^(success:|error:)/, '');

  if (!campaign) return <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Loading...</div>;


  <style>{`
@media (max-width: 768px) {
  .cd-header {
    flex-direction: column;
    gap: 16px;
  }

  .cd-progress {
    margin-left: 0 !important;
    align-self: center;
  }

  .cd-meta {
    flex-direction: column;
    gap: 6px;
  }

  .cd-equip {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .cd-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .cd-form {
    grid-template-columns: 1fr !important;
  }

  .cd-task {
    flex-direction: column;
    align-items: flex-start;
  }

  .cd-actions {
    width: 100%;
    justify-content: space-between;
  }
}
`}</style>


  return (
    <div>
      <style>{`
@media (max-width: 768px) {
  .cd-back-btn {
    width: 100%;
  }

  .cd-header {
    flex-direction: column;
    align-items: stretch !important;
    gap: 18px;
    padding: 18px !important;
  }

  .cd-header-top {
    flex-wrap: wrap;
    gap: 8px;
  }

  .cd-header-left {
    width: 100%;
    min-width: 0;
  }

  .cd-progress {
    margin-left: 0 !important;
    width: 100%;
    align-self: center;
  }

  .cd-meta {
    flex-direction: column;
    gap: 8px;
  }

  .cd-equipment-box {
    padding: 16px !important;
  }

  .cd-equip-grid {
    display: grid !important;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .cd-equip-item {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  .cd-tab-row {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .cd-tab-btn {
    width: 100%;
    min-width: 0;
    justify-content: center;
    text-align: center;
    padding: 10px 12px !important;
    border-radius: 8px !important;
    border-bottom: 1px solid #ddd !important;
  }

  .cd-tab-btn-active {
    width: 100%;
    min-width: 0;
    justify-content: center;
    text-align: center;
    padding: 10px 12px !important;
    border-radius: 8px !important;
    border-bottom: 1px solid #c4607a !important;
  }

  .cd-task-box {
    border-radius: 12px !important;
    padding: 16px !important;
  }

  .cd-task-header {
    flex-direction: column;
    align-items: stretch !important;
    gap: 12px;
  }

  .cd-add-task-btn {
    width: 100%;
  }

  .cd-form-grid {
    grid-template-columns: 1fr !important;
  }

  .cd-form-actions {
    flex-direction: column;
  }

  .cd-form-actions button {
    width: 100%;
  }

  .cd-task-item {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 10px;
  }

  .cd-task-badge {
    align-self: flex-start;
  }

  .cd-task-actions {
    width: 100%;
    justify-content: stretch;
  }

  .cd-task-actions button {
    flex: 1;
  }
}
`}</style>

      {/* Back Button */}
      <button onClick={onBack} style={styles.backBtn} className="cd-back-btn">
        ← Back to Campaigns
      </button>

      {/* Campaign Header */}
      <div style={styles.campaignHeader} className="cd-header">
        <div style={styles.campaignHeaderLeft} className="cd-header-left">
          <div style={styles.headerTop} className="cd-header-top">
            <h2 style={styles.campaignTitle}>{campaign.title}</h2>
            <span style={{ ...styles.statusBadge, ...statusColors[campaign.status] }}>
              {campaign.status}
            </span>
          </div>
          <p style={styles.campaignDesc}>{campaign.description || 'No description'}</p>
          <div style={styles.campaignMeta} className="cd-meta">
            <span><FaGlobe/> {campaign.platform}</span>
            <span><FaCalendar/> {new Date(campaign.start_date).toLocaleDateString()} – {new Date(campaign.end_date).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Overall Progress */}
        <div style={styles.overallProgress} className="cd-progress">
          <div style={styles.progressCircleWrapper}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="38" fill="none" stroke="#f0f0f0" strokeWidth="8" />
              <circle
                cx="45" cy="45" r="38"
                fill="none"
                stroke={campaign.progress === 100 ? '#27ae60' : campaign.progress >= 50 ? '#f39c12' : '#c4607a'}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - campaign.progress / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 45 45)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={styles.progressCircleText}>
              <span style={styles.progressPct}>{campaign.progress}%</span>
            </div>
          </div>
          <p style={styles.progressLabel}>Overall Progress</p>
          <p style={styles.progressSub}>{campaign.completed_tasks}/{campaign.total_tasks} tasks done</p>
        </div>
      </div>

      {/* Equipment Checklist */}
      <div style={styles.equipmentBox} className="cd-equipment-box">
        <h4 style={styles.equipTitle}>🎬 Equipment Checklist</h4>
        <div style={styles.equipmentBox} className="cd-equipment-box">
          {[
            { key: 'equip_lights', icon: <FaLightbulb />, label: 'Lights' },
            { key: 'equip_mic',    icon: <FaMicrophone />, label: 'Microphone' },
            { key: 'equip_camera', icon: <FaCamera />, label: 'Camera' },
          ].map(item => (
            <div
              key={item.key}
              className="cd-equip-item"
              onClick={() => handleEquipmentChange(item.key, !equipment[item.key])}
              style={{
                ...styles.equipItem,
                backgroundColor: equipment[item.key] ? '#d4edda' : '#f8f9fa',
                border: `2px solid ${equipment[item.key] ? '#27ae60' : '#eee'}`,
              }}
            >
              <span style={styles.equipIcon}>{item.icon}</span>
              <span style={{ ...styles.equipLabel, color: equipment[item.key] ? '#155724' : '#888' }}>
                {item.label}
              </span>
              <span style={{
                ...styles.equipCheck,
                backgroundColor: equipment[item.key] ? '#27ae60' : '#ddd',
              }}>
                {equipment[item.key] ? '✓' : ''}
              </span>
            </div>
          ))}
        </div>
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

      {/* Task Tabs */}
      <div style={styles.tabRow} className="cd-tabs">
        {TASK_CATEGORIES.map(tab => {
          const tabCount  = tasks.filter(t => t.category === tab.key).length;
          const tabDone   = tasks.filter(t => t.category === tab.key && t.status === 'done').length;
          const isActive  = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setShowForm(false); }}
              className={isActive ? "cd-tab-btn-active" : "cd-tab-btn"}
              style={isActive ? styles.tabActive : styles.tab}
            >
              {tab.icon} {tab.label}
              <span style={{
                ...styles.tabBadge,
                backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : '#f0f0f0',
                color: isActive ? '#fff' : '#555',
              }}>
                {tabDone}/{tabCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={styles.taskBox} className="cd-task-box">
        <div style={styles.taskHeader} className="cd-task-header">
          <div>
            <h4 style={styles.taskBoxTitle}>
              {TASK_CATEGORIES.find(t => t.key === activeTab)?.icon}{' '}
              {TASK_CATEGORIES.find(t => t.key === activeTab)?.label}
            </h4>
            <p style={styles.taskBoxSub}>
              {doneTasks}/{totalTasks} tasks completed
              {totalTasks > 0 && (
                <span style={styles.tabProgress}>
                  — {Math.round((doneTasks / totalTasks) * 100)}%
                </span>
              )}
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={styles.addTaskBtn} className="cd-add-task-btn">
            {showForm ? '✕ Cancel' : '+ Add Task'}
          </button>
        </div>

        {/* Tab Progress Bar */}
        {totalTasks > 0 && (
          <div style={styles.tabProgressBar}>
            <div style={{
              ...styles.tabProgressFill,
              width: `${Math.round((doneTasks / totalTasks) * 100)}%`,
              backgroundColor: doneTasks === totalTasks ? '#27ae60' : '#c4607a',
            }} />
          </div>
        )}

        {/* Add Task Form */}
        {showForm && (
          <div style={styles.addForm}>
            <div style={styles.addFormGrid} className="cd-form">
              <div style={styles.inputGroup}>
                <label style={styles.label}>Task Title</label>
                <input
                  type="text"
                  placeholder={`e.g. ${activeTab === 'tasks' ? 'Plan campaign strategy' : activeTab === 'photoshoot' ? 'Book photographer' : activeTab === 'graphics' ? 'Design banner' : 'Edit promo video'}`}
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  style={styles.input}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Description (optional)</label>
                <input
                  type="text"
                  placeholder="Brief description..."
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>
            <button onClick={handleAddTask} style={styles.submitBtn}>Add Task</button>
          </div>
        )}

        {/* Edit Task Form */}
        {editTaskId && (
          <div style={{ ...styles.addForm, borderLeft: '4px solid #c4607a' }}>
            <div style={styles.addFormGrid} className="cd-form">
              <div style={styles.inputGroup}>
                <label style={styles.label}>Task Title</label>
                <input
                  type="text"
                  value={editTaskForm.title}
                  onChange={e => setEditTaskForm({ ...editTaskForm, title: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Description</label>
                <input
                  type="text"
                  value={editTaskForm.description}
                  onChange={e => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Status</label>
                <select
                  value={editTaskForm.status}
                  onChange={e => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
                  style={styles.input}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }} className="cd-form-actions">
              <button onClick={handleUpdateTask} style={styles.submitBtn}>Save</button>
              <button onClick={() => setEditTaskId(null)} style={styles.cancelBtn}>Cancel</button>
            </div>
          </div>
        )}

        {/* Task List */}
        {tabTasks.length === 0 ? (
          <div style={styles.emptyTasks}>
            <p style={{ fontSize: '14px', color: '#aaa', margin: 0 }}>
              No tasks yet for {TASK_CATEGORIES.find(t => t.key === activeTab)?.label}. Add one above!
            </p>
          </div>
        ) : (
          <div style={styles.taskList}>
            {tabTasks.map(task => (
              <div
                key={task.id}
                className="cd-task-item"
                style={{
                  ...styles.taskItem,
                  backgroundColor: task.status === 'done' ? '#f8fff9' : '#fff',
                  borderLeft: `4px solid ${task.status === 'done' ? '#27ae60' : task.status === 'in-progress' ? '#f39c12' : '#ddd'}`,
                }}
              >
                {/* Checkbox */}
                <div
                  onClick={() => handleToggleTask(task)}
                  style={{
                    ...styles.checkbox,
                    backgroundColor: task.status === 'done' ? '#27ae60' : '#fff',
                    borderColor: task.status === 'done' ? '#27ae60' : '#ddd',
                  }}
                >
                  {task.status === 'done' && <span style={styles.checkmark}>✓</span>}
                </div>

                {/* Task Info */}
                <div style={styles.taskInfo}>
                  <p style={{
                    ...styles.taskTitle,
                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    color: task.status === 'done' ? '#aaa' : '#302e2e',
                  }}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p style={styles.taskDesc}>{task.description}</p>
                  )}
                </div>

                {/* Task Status Badge */}
                <span className="cd-task-badge" style={{ ...styles.taskBadge, ...taskStatusColors[task.status] }}>
                  {task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
                </span>

                {/* Task Actions */}
                <div style={styles.taskActions} className="cd-actions">
                  <button onClick={() => handleEditTask(task)} style={styles.editTaskBtn}>Edit</button>
                  <button onClick={() => handleDeleteTask(task.id)} style={styles.delTaskBtn}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  backBtn: { padding: '9px 18px', backgroundColor: '#f8f9fa', color: '#555', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginBottom: '20px' },

  // Campaign Header
  campaignHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '16px' },
  campaignHeaderLeft: { flex: 1 },
  headerTop: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  campaignTitle: { fontSize: '22px', fontWeight: '700', color: '#302e2e', margin: 0 },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  campaignDesc: { fontSize: '14px', color: '#888', margin: '0 0 12px' },
  campaignMeta: { display: 'flex', gap: '20px', fontSize: '13px', color: '#555', flexWrap: 'wrap' },

  // Progress Circle
  overallProgress: { textAlign: 'center', flexShrink: 0, marginLeft: '24px' },
  progressCircleWrapper: { position: 'relative', width: '90px', height: '90px', margin: '0 auto 8px' },
  progressCircleText: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' },
  progressPct: { fontSize: '18px', fontWeight: '700', color: '#302e2e' },
  progressLabel: { fontSize: '13px', fontWeight: '600', color: '#302e2e', margin: '0 0 4px' },
  progressSub: { fontSize: '12px', color: '#aaa', margin: 0 },

  // Equipment
  equipmentBox: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '16px' },
  equipTitle: { fontSize: '15px', fontWeight: '600', color: '#302e2e', margin: '0 0 16px' },
  equipGrid: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  equipItem: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' },
  equipIcon: { fontSize: '22px' },
  equipLabel: { flex: 1, fontSize: '14px', fontWeight: '600' },
  equipCheck: { width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#fff', fontWeight: '700', flexShrink: 0 },

  // Task Tabs
  tabRow: { display: 'flex', gap: '8px', marginBottom: '0', flexWrap: 'wrap' },
  tab: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '8px 8px 0 0', border: '1px solid #ddd', borderBottom: 'none', backgroundColor: '#f8f9fa', cursor: 'pointer', fontSize: '14px', color: '#555' },
  tabActive: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '8px 8px 0 0', border: '1px solid #c4607a', borderBottom: '2px solid #fff', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', color: '#c4607a', fontWeight: '600' },
  tabBadge: { padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' },

  // Task Box
  taskBox: { backgroundColor: '#fff', borderRadius: '0 12px 12px 12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  taskHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  taskBoxTitle: { fontSize: '16px', fontWeight: '600', color: '#302e2e', margin: '0 0 4px' },
  taskBoxSub: { fontSize: '13px', color: '#888', margin: 0 },
  tabProgress: { color: '#c4607a', fontWeight: '600' },
  addTaskBtn: { padding: '9px 18px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  tabProgressBar: { backgroundColor: '#f0f0f0', borderRadius: '10px', height: '6px', overflow: 'hidden', marginBottom: '16px' },
  tabProgressFill: { height: '6px', borderRadius: '10px', transition: 'width 0.5s ease' },

  // Add/Edit Form
  addForm: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '16px', marginBottom: '16px' },
  addFormGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#555' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', backgroundColor: '#fff' },
  submitBtn: { padding: '10px 20px', backgroundColor: '#c4607a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#f0f0f0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },

  // Task List
  emptyTasks: { padding: '32px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  taskItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '10px', border: '1px solid #eee', transition: 'all 0.2s' },
  checkbox: { width: '22px', height: '22px', borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' },
  checkmark: { fontSize: '12px', color: '#fff', fontWeight: '700' },
  taskInfo: { flex: 1, minWidth: 0 },
  taskTitle: { fontSize: '14px', fontWeight: '500', margin: '0 0 2px' },
  taskDesc: { fontSize: '12px', color: '#aaa', margin: 0 },
  taskBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', flexShrink: 0 },
  taskActions: { display: 'flex', gap: '6px', flexShrink: 0 },
  editTaskBtn: { padding: '5px 10px', backgroundColor: '#eaf4fb', color: '#2980b9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  delTaskBtn: { padding: '5px 10px', backgroundColor: '#f8d7da', color: '#721c24', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
};

export default CampaignDetail;