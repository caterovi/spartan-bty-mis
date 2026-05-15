import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import {
  FaBars, FaCamera, FaPalette, FaVideo, FaGlobe, FaCalendar,
  FaLightbulb, FaMicrophone, FaArrowLeft, FaPlus, FaTimes,
  FaTrash, FaEdit, FaCheck, FaBullhorn, FaClipboardList,
  FaBox, FaImage, FaTag, FaChartLine, FaStar, FaRegStar, FaFire,
} from "react-icons/fa";

const TASK_CATEGORIES = [
  { key:'tasks',        icon:<FaBars />,    label:'Tasks' },
  { key:'photoshoot',   icon:<FaCamera />,  label:'Photoshoot' },
  { key:'graphics',     icon:<FaPalette />, label:'Graphics' },
  { key:'video-editing',icon:<FaVideo />,   label:'Video Editing' },
];

const MATERIAL_TYPES = [
  'poster','flyer','facebook_post','instagram_post','tiktok_video',
  'promo_video','cover_photo','landing_banner','product_photo','caption','other',
];
const MATERIAL_STATUS_FLOW = ['draft','in-progress','for-review','approved','scheduled','published','rejected'];
const PROMO_MECHANICS = [
  { icon:'🎁', label:'Buy 1 Take 1', desc:'Customer gets a free item with purchase' },
  { icon:'📦', label:'Bundle Promo', desc:'Multiple products sold together at a discount' },
  { icon:'%',  label:'Percentage Discount', desc:'e.g. 10%, 15%, 20% off' },
  { icon:'🎀', label:'Freebie Promo', desc:'Free item included with minimum order' },
  { icon:'🌟', label:'Seasonal Sale', desc:'Limited-time discount tied to a season or event' },
  { icon:'⏰', label:'Limited-Time Offer', desc:'Urgency-based promo for flash sales' },
];

const STATUS_STYLES = {
  draft:        {background:'#f8f3f5',color:'#6b5b63',border:'1px solid #c9b6bf'},
  'in-progress':{background:'#fff7e8',color:'#9a5f0f',border:'1px solid #d98a1f'},
  'for-review': {background:'#e8f4ff',color:'#1a5f9a',border:'1px solid #4a90d9'},
  approved:     {background:'#ecfdf3',color:'#2f7d56',border:'1px solid #2f9d6a'},
  scheduled:    {background:'#f0f0ff',color:'#4f46e5',border:'1px solid #818cf8'},
  published:    {background:'#ecfdf3',color:'#2f7d56',border:'1px solid #2f9d6a'},
  rejected:     {background:'#fff1f5',color:'#b5536b',border:'1px solid #c4607a'},
  completed:    {background:'#ecfdf3',color:'#2f7d56',border:'1px solid #2f9d6a'},
  cancelled:    {background:'#fff1f5',color:'#b5536b',border:'1px solid #c4607a'},
};
const APPROVAL_FLOW = ['draft','in-progress','for-review','approved','published','completed'];
const PRIORITY_STYLES = {
  low:   {background:'#ecfdf3',color:'#2f7d56',border:'1px solid #2f9d6a'},
  medium:{background:'#fff7e8',color:'#9a5f0f',border:'1px solid #d98a1f'},
  high:  {background:'#fff1f5',color:'#b5536b',border:'1px solid #c4607a'},
};

const fmt = (v) => String(v||'').replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) : '—';
const fmtType = (t) => String(t||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());

const emptyMaterial = {
  title:'', material_type:'poster', description:'', file_url:'', caption:'',
  hashtags:'', platform:'', call_to_action:'', status:'draft',
  assigned_to:'', due_date:'', scheduled_date:'', publish_to_landing:false,
};

const MAIN_TABS = [
  {key:'overview',  icon:<FaBullhorn />,      label:'Overview'},
  {key:'products',  icon:<FaBox />,           label:'Products'},
  {key:'promos',    icon:<FaTag />,           label:'Promotions'},
  {key:'materials', icon:<FaImage />,         label:'Materials'},
  {key:'tasks',     icon:<FaClipboardList />, label:'Tasks'},
  {key:'equipment', icon:<FaCamera />,        label:'Equipment'},
  {key:'approval',  icon:<FaCheck />,         label:'Approval'},
  {key:'performance',icon:<FaChartLine />,   label:'Performance'},
];

function CampaignDetail({ campaignId, onBack }) {
  const [campaign, setCampaign]     = useState(null);
  const [tasks, setTasks]           = useState([]);
  const [products, setProducts]     = useState([]);
  const [materials, setMaterials]   = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [mainTab, setMainTab]       = useState('overview');
  const [taskTab, setTaskTab]       = useState('tasks');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editMaterialId, setEditMaterialId] = useState(null);
  const [message, setMessage]       = useState('');
  const [isError, setIsError]       = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({});
  const [newTask, setNewTask]       = useState({title:'',description:''});
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [equipment, setEquipment]   = useState({equip_lights:false,equip_mic:false,equip_camera:false});
  const [approvalForm, setApprovalForm] = useState({approval_status:'',review_comments:'',approved_by:''});
  const [selectedProduct, setSelectedProduct] = useState({inventory_item_id:'',promo_role:'main_product',notes:''});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  useEffect(() => { fetchCampaign(); fetchTasks(); }, [campaignId]);
  useEffect(() => {
    if (mainTab==='products') { fetchProducts(); fetchInventory(); }
    if (mainTab==='materials') fetchMaterials();
  }, [mainTab]);

  const fetchCampaign = async () => {
    try {
      const r = await api.get(`/marketing/campaigns/${campaignId}`);
      setCampaign(r.data);
      setEquipment({ equip_lights:!!r.data.equip_lights, equip_mic:!!r.data.equip_mic, equip_camera:!!r.data.equip_camera });
      setApprovalForm({ approval_status:r.data.approval_status||'draft', review_comments:r.data.review_comments||'', approved_by:r.data.approved_by||'' });
    } catch(e){ console.error(e); }
  };
  const fetchTasks = async () => {
    try { const r = await api.get(`/marketing/campaigns/${campaignId}/tasks`); setTasks(r.data||[]); }
    catch(e){ console.error(e); }
  };
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try { const r = await api.get(`/marketing/campaigns/${campaignId}/products`); setProducts(r.data||[]); }
    catch(e){ console.error(e); }
    finally { setLoadingProducts(false); }
  };
  const fetchMaterials = async () => {
    setLoadingMaterials(true);
    try { const r = await api.get(`/marketing/campaigns/${campaignId}/materials`); setMaterials(r.data||[]); }
    catch(e){ console.error(e); }
    finally { setLoadingMaterials(false); }
  };
  const fetchInventory = async () => {
    try { const r = await api.get('/inventory/items?archived=false'); setInventoryItems(r.data||[]); }
    catch(e){ console.error(e); }
  };

  const notify = (msg, err=false) => {
    setMessage(msg); setIsError(err);
    setTimeout(()=>setMessage(''), 3500);
  };

  // TASKS
  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      await api.post(`/marketing/campaigns/${campaignId}/tasks`, { category:taskTab, title:newTask.title, description:newTask.description });
      notify('Task added!');
      setNewTask({title:'',description:''}); setShowTaskForm(false);
      fetchTasks(); fetchCampaign();
    } catch(e){ notify('Error adding task.', true); }
  };
  const handleToggleTask = async (task) => {
    const newStatus = task.status==='done'?'todo':'done';
    try { await api.put(`/marketing/tasks/${task.id}`,{status:newStatus,title:task.title,description:task.description||''}); fetchTasks(); fetchCampaign(); }
    catch(e){ console.error(e); }
  };
  const handleUpdateTask = async () => {
    try { await api.put(`/marketing/tasks/${editTaskId}`,editTaskForm); notify('Task updated!'); setEditTaskId(null); fetchTasks(); fetchCampaign(); }
    catch(e){ notify('Error updating task.', true); }
  };
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/marketing/tasks/${id}`); fetchTasks(); fetchCampaign(); }
    catch(e){ console.error(e); }
  };

  // EQUIPMENT
  const handleEquipmentChange = async (key, value) => {
    const updated = {...equipment, [key]:value}; setEquipment(updated);
    try { await api.put(`/marketing/campaigns/${campaignId}/equipment`, updated); }
    catch(e){ console.error(e); }
  };

  // PRODUCTS
  const handleAddProduct = async () => {
    if (!selectedProduct.inventory_item_id) return notify('Please select an inventory item.', true);
    try {
      await api.post(`/marketing/campaigns/${campaignId}/products`, selectedProduct);
      notify('Product added to campaign!');
      setSelectedProduct({inventory_item_id:'',promo_role:'main_product',notes:''});
      fetchProducts();
    } catch(e){ notify(e.response?.data?.message||'Error adding product.', true); }
  };
  const handleRemoveProduct = async (productId) => {
    if (!window.confirm('Remove this product from the campaign?')) return;
    try { await api.delete(`/marketing/campaigns/${campaignId}/products/${productId}`); fetchProducts(); }
    catch(e){ notify('Error removing product.', true); }
  };

  // MATERIALS
  const handleAddMaterial = async () => {
    if (!materialForm.title.trim()) return notify('Material title is required.', true);
    if (!materialForm.material_type) return notify('Material type is required.', true);
    try {
      if (editMaterialId) {
        await api.put(`/marketing/materials/${editMaterialId}`, materialForm);
        notify('Material updated!');
        setEditMaterialId(null);
      } else {
        await api.post(`/marketing/campaigns/${campaignId}/materials`, materialForm);
        notify('Material added!');
      }
      setMaterialForm(emptyMaterial); setShowMaterialForm(false);
      fetchMaterials();
    } catch(e){ notify(e.response?.data?.message||'Error saving material.', true); }
  };
  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try { await api.delete(`/marketing/materials/${id}`); fetchMaterials(); }
    catch(e){ notify('Error deleting.', true); }
  };

  // APPROVAL
  const handleApprovalUpdate = async () => {
    try {
      await api.put(`/marketing/campaigns/${campaignId}`, { ...approvalForm });
      notify('Approval status updated!');
      fetchCampaign();
    } catch(e){ notify('Error updating approval.', true); }
  };

  if (!campaign) return <div className="cd-loading">Loading campaign...</div>;

  const tabTasks  = tasks.filter(t=>t.category===taskTab);
  const doneTasks = tabTasks.filter(t=>t.status==='done').length;
  const activeCategory = TASK_CATEGORIES.find(t=>t.key===taskTab);

  const progressColor = campaign.progress===100?'#2f9d6a':campaign.progress>=50?'#d98a1f':'#c4607a';

  return (
    <div className="cd-page">
      <style>{`
        .cd-page { width:100%; animation:cdFadeUp 0.35s ease both; }
        .cd-loading { min-height:240px; display:grid; place-items:center; color:#b5536b; font-size:14px; font-weight:700; }
        .cd-back-btn { margin-bottom:18px; border:1px solid #d8b8c2; border-radius:12px; padding:10px 14px; background:#fff; color:#b5536b; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:all 180ms ease; }
        .cd-back-btn:hover { transform:translateY(-1px); border-color:#c4607a; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .cd-header { background:radial-gradient(circle at top right,rgba(196,96,122,.18),transparent 34%),linear-gradient(135deg,#fff7fa,#fff); border:1px solid #ead1d9; border-radius:18px; padding:24px; margin-bottom:18px; box-shadow:0 4px 16px rgba(0,0,0,.07); display:flex; align-items:flex-start; justify-content:space-between; gap:20px; }
        .cd-header-left { flex:1; min-width:0; }
        .cd-header-top { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:10px; }
        .cd-campaign-icon { width:44px; height:44px; border-radius:14px; display:grid; place-items:center; background:#fff1f5; color:#b5536b; border:1px solid #e8b9c6; flex:0 0 auto; }
        .cd-title { margin:0; color:#1f2937; font-size:26px; font-weight:850; letter-spacing:-.04em; line-height:1.2; }
        .cd-badge { display:inline-flex; align-items:center; justify-content:center; padding:5px 10px; border-radius:9999px; font-size:11px; font-weight:800; white-space:nowrap; text-transform:capitalize; }
        .cd-desc { margin:0 0 12px; color:#64748b; font-size:14px; line-height:1.6; max-width:760px; }
        .cd-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .cd-meta-pill { display:inline-flex; align-items:center; gap:7px; padding:7px 11px; border-radius:9999px; background:#fff; border:1px solid #ead1d9; color:#374151; font-size:12px; font-weight:700; }
        .cd-progress-card { width:140px; flex:0 0 auto; text-align:center; background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .cd-progress-circle { position:relative; width:88px; height:88px; margin:0 auto 8px; }
        .cd-progress-text { position:absolute; inset:0; display:grid; place-items:center; color:#1f2937; font-size:18px; font-weight:850; }
        .cd-progress-label { margin:0 0 3px; color:#1f2937; font-size:12px; font-weight:800; }
        .cd-progress-sub { margin:0; color:#64748b; font-size:11px; font-weight:600; }

        /* MAIN TABS */
        .cd-main-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:18px; background:#fff; border:1px solid #e2c6cf; border-radius:16px; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .cd-main-tab { padding:9px 14px; border-radius:10px; border:none; background:transparent; color:#64748b; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:all 180ms ease; }
        .cd-main-tab:hover { background:#fff7fa; color:#b5536b; }
        .cd-main-tab-active { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; box-shadow:0 4px 12px rgba(196,96,122,.25); }

        /* PANELS */
        .cd-panel { background:#fff; border:1px solid #e2c6cf; border-radius:18px; padding:22px; margin-bottom:18px; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .cd-panel-header { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:18px; }
        .cd-panel-title-wrap { display:flex; align-items:center; gap:12px; }
        .cd-panel-icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:#fff1f5; border:1px solid #e8b9c6; color:#b5536b; flex:0 0 auto; }
        .cd-panel-title { margin:0; color:#1f2937; font-size:18px; font-weight:800; letter-spacing:-.02em; }
        .cd-panel-note { margin:4px 0 0; color:#64748b; font-size:13px; }
        .cd-section-divider { font-size:11px; font-weight:800; color:#b5536b; text-transform:uppercase; letter-spacing:.08em; margin:16px 0 12px; padding-bottom:8px; border-bottom:1px solid #f3e8ec; }

        /* INFO GRID */
        .cd-info-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; }
        .cd-info-section { }
        .cd-info-title { font-size:11px; font-weight:800; color:#b5536b; text-transform:uppercase; letter-spacing:.08em; margin-bottom:12px; }
        .cd-info-row { display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid #f3e8ec; font-size:13px; }
        .cd-info-row:last-of-type { border-bottom:none; }
        .cd-info-key { color:#64748b; font-weight:700; }
        .cd-info-val { color:#1f2937; font-weight:800; text-align:right; max-width:55%; }

        /* MESSAGE */
        .cd-message { margin-bottom:18px; padding:13px 15px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid; }
        .cd-msg-ok  { background:#ecfdf3; color:#2f7d56; border-color:#2f9d6a; }
        .cd-msg-err { background:#fff1f5; color:#b5536b; border-color:#c4607a; }

        /* BUTTONS */
        .cd-add-btn,.cd-submit-btn { border:none; border-radius:12px; padding:11px 15px; background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; font-size:14px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 18px rgba(196,96,122,.22); transition:all 180ms ease; white-space:nowrap; }
        .cd-add-btn:hover,.cd-submit-btn:hover { transform:translateY(-1px); }
        .cd-cancel-btn { border:1px solid #d8b8c2; border-radius:12px; padding:11px 15px; background:#fff; color:#64748b; font-size:14px; font-weight:800; cursor:pointer; }
        .cd-edit-btn { border-radius:10px; padding:8px 10px; cursor:pointer; font-size:12px; font-weight:800; display:inline-flex; align-items:center; gap:6px; border:1px solid #d98a1f; background:#fff7e8; color:#9a5f0f; transition:all 180ms ease; }
        .cd-delete-btn { border-radius:10px; padding:8px 10px; cursor:pointer; font-size:12px; font-weight:800; display:inline-flex; align-items:center; gap:6px; border:1px solid #c4607a; background:#fff1f5; color:#b5536b; transition:all 180ms ease; }
        .cd-edit-btn:hover,.cd-delete-btn:hover { transform:translateY(-1px); }
        .cd-form-actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; }

        /* FORMS */
        .cd-form-box { background:#fff7fa; border:1px solid #ead1d9; border-radius:16px; padding:16px; margin-bottom:16px; }
        .cd-form-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:12px; }
        .cd-field { display:flex; flex-direction:column; gap:6px; }
        .cd-label { font-size:13px; font-weight:800; color:#374151; }
        .cd-input { width:100%; box-sizing:border-box; padding:11px 12px; border-radius:12px; border:1px solid #d8b8c2; background:#fff; color:#1f2937; font-size:14px; outline:none; font-family:Segoe UI,sans-serif; transition:all 180ms ease; }
        .cd-input:focus { border-color:#c4607a; box-shadow:0 0 0 4px rgba(196,96,122,.12); background:#fffafa; }
        .cd-span-2 { grid-column:span 2; }
        .cd-span-3 { grid-column:span 3; }
        .cd-toggle-label { display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; font-weight:700; color:#374151; }

        /* TASK TABS */
        .cd-task-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
        .cd-tab-btn { border:1px solid #d8b8c2; border-radius:12px; padding:10px 13px; background:#fff; color:#374151; cursor:pointer; font-size:13px; font-weight:800; display:inline-flex; align-items:center; gap:7px; transition:all 180ms ease; }
        .cd-tab-btn:hover { border-color:#c4607a; transform:translateY(-1px); }
        .cd-tab-btn-active { background:linear-gradient(135deg,#c4607a,#e58ca3); color:#fff; border-color:#c4607a; box-shadow:0 8px 18px rgba(196,96,122,.22); }
        .cd-tab-badge { padding:3px 7px; border-radius:9999px; font-size:11px; font-weight:850; background:#fff1f5; color:#b5536b; border:1px solid #e8b9c6; }
        .cd-tab-btn-active .cd-tab-badge { background:rgba(255,255,255,.24); color:#fff; border-color:rgba(255,255,255,.34); }
        .cd-task-header { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:12px; }
        .cd-tab-progress { height:8px; border-radius:9999px; background:#f3e8ec; overflow:hidden; border:1px solid #ead1d9; margin-bottom:14px; }
        .cd-tab-progress-fill { height:100%; border-radius:9999px; transition:width 320ms ease; min-width:6px; }

        /* TASK LIST */
        .cd-task-list { display:grid; gap:10px; }
        .cd-task-item { background:#fff; border:1px solid #e2c6cf; border-radius:14px; padding:13px; display:flex; align-items:center; gap:12px; transition:all 180ms ease; }
        .cd-task-item:hover { transform:translateY(-1px); border-color:#c4607a; box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .cd-checkbox { width:26px; height:26px; border-radius:9999px; border:2px solid; display:grid; place-items:center; cursor:pointer; flex-shrink:0; transition:all 180ms ease; }
        .cd-task-info { flex:1; min-width:0; }
        .cd-task-title { margin:0 0 3px; color:#1f2937; font-size:14px; font-weight:800; line-height:1.4; }
        .cd-task-desc { margin:0; color:#64748b; font-size:12px; }
        .cd-task-actions { display:flex; gap:7px; flex-shrink:0; }

        /* EQUIPMENT */
        .cd-equip-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
        .cd-equip-item { border-radius:16px; padding:16px; display:flex; align-items:center; gap:12px; cursor:pointer; border:1px solid; transition:all 180ms ease; }
        .cd-equip-item:hover { transform:translateY(-2px); }
        .cd-equip-icon { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; background:rgba(255,255,255,.72); border:1px solid rgba(255,255,255,.9); flex-shrink:0; font-size:17px; }
        .cd-equip-label { flex:1; color:#1f2937; font-size:14px; font-weight:800; }
        .cd-equip-check { width:24px; height:24px; border-radius:9999px; display:grid; place-items:center; color:#fff; font-size:12px; flex-shrink:0; }

        /* PRODUCT CARDS */
        .cd-product-card { background:#fff; border:1px solid #e2c6cf; border-radius:14px; padding:14px; display:flex; align-items:center; justify-content:space-between; gap:12px; transition:all 180ms ease; margin-bottom:8px; }
        .cd-product-card:hover { border-color:#c4607a; transform:translateY(-1px); }
        .cd-product-name { font-weight:850; color:#1f2937; font-size:14px; margin-bottom:3px; }
        .cd-product-meta { font-size:11px; color:#64748b; display:flex; gap:8px; flex-wrap:wrap; }
        .cd-product-suggestion { font-size:11px; color:#9a5f0f; font-weight:700; margin-top:4px; }

        /* MATERIAL CARDS */
        .cd-material-card { background:#fff; border:1px solid #e2c6cf; border-radius:14px; padding:14px; margin-bottom:10px; transition:all 180ms ease; }
        .cd-material-card:hover { border-color:#c4607a; transform:translateY(-1px); }
        .cd-material-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px; }
        .cd-material-title { font-weight:850; color:#1f2937; font-size:14px; }
        .cd-material-caption { font-size:12px; color:#64748b; margin:6px 0; font-style:italic; }
        .cd-material-meta { display:flex; gap:7px; flex-wrap:wrap; margin-top:8px; align-items:center; }

        /* PROMO MECHANICS */
        .cd-promo-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
        .cd-promo-card { background:#fff7fa; border:1px solid #ead1d9; border-radius:14px; padding:14px; display:flex; align-items:flex-start; gap:10px; transition:all 180ms ease; }
        .cd-promo-card:hover { border-color:#c4607a; transform:translateY(-1px); box-shadow:0 2px 8px rgba(0,0,0,.05); }
        .cd-promo-icon { font-size:22px; flex-shrink:0; }
        .cd-promo-label { font-weight:800; color:#1f2937; font-size:13px; margin-bottom:3px; }
        .cd-promo-desc { font-size:12px; color:#64748b; }

        /* APPROVAL */
        .cd-approval-flow { display:flex; align-items:center; gap:0; overflow-x:auto; padding-bottom:8px; margin-bottom:18px; }
        .cd-approval-step { display:flex; align-items:center; gap:5px; flex-shrink:0; }
        .cd-approval-dot { width:12px; height:12px; border-radius:9999px; flex-shrink:0; }
        .cd-approval-label { font-size:12px; font-weight:700; white-space:nowrap; }
        .cd-approval-line { width:24px; height:2px; background:#ead1d9; flex-shrink:0; margin:0 4px; border-radius:2px; }
        .cd-approval-active .cd-approval-dot { background:#c4607a; box-shadow:0 0 0 3px rgba(196,96,122,.25); }
        .cd-approval-done .cd-approval-dot { background:#2f9d6a; }

        /* PERFORMANCE PLACEHOLDER */
        .cd-perf-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
        .cd-perf-card { background:#fff7fa; border:1px solid #ead1d9; border-radius:14px; padding:14px; text-align:center; }
        .cd-perf-value { font-size:22px; font-weight:850; color:#1f2937; margin-bottom:4px; }
        .cd-perf-label { font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase; }

        /* EMPTY */
        .cd-empty { background:#fff; border:1px dashed #e2c6cf; border-radius:14px; padding:28px 18px; text-align:center; color:#94a3b8; font-size:14px; font-weight:700; margin-top:10px; }

        @keyframes cdFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width:900px) {
          .cd-header { flex-direction:column; }
          .cd-progress-card { width:100%; }
          .cd-equip-grid,.cd-form-grid { grid-template-columns:1fr; }
          .cd-info-grid,.cd-promo-grid { grid-template-columns:1fr; }
          .cd-perf-grid { grid-template-columns:repeat(2,1fr); }
          .cd-task-header { flex-direction:column; align-items:stretch; }
          .cd-span-2,.cd-span-3 { grid-column:span 1; }
        }
        @media (max-width:768px) {
          .cd-back-btn { width:100%; justify-content:center; }
          .cd-header,.cd-panel { padding:16px; }
          .cd-title { font-size:22px; }
          .cd-main-tabs { gap:4px; }
          .cd-main-tab { font-size:11px; padding:8px 10px; }
          .cd-task-tabs { display:grid; grid-template-columns:1fr 1fr; }
          .cd-task-item { flex-direction:column; align-items:flex-start; }
          .cd-task-actions { width:100%; }
          .cd-edit-btn,.cd-delete-btn { flex:1; justify-content:center; }
          .cd-form-actions { flex-direction:column; }
          .cd-submit-btn,.cd-cancel-btn { width:100%; justify-content:center; }
          .cd-add-btn { width:100%; }
        }
        @media (max-width:520px) {
          .cd-main-tabs { display:grid; grid-template-columns:1fr 1fr; }
          .cd-task-tabs { grid-template-columns:1fr; }
          .cd-perf-grid { grid-template-columns:1fr 1fr; }
        }
      `}</style>

      <button onClick={onBack} className="cd-back-btn"><FaArrowLeft /> Back to Campaigns</button>

      {/* HEADER */}
      <div className="cd-header">
        <div className="cd-header-left">
          <div className="cd-header-top">
            <div className="cd-campaign-icon"><FaBullhorn /></div>
            <h2 className="cd-title">{campaign.title}</h2>
            <span className="cd-badge" style={STATUS_STYLES[campaign.status]||STATUS_STYLES.draft}>{fmt(campaign.status)}</span>
            {campaign.approval_status && campaign.approval_status !== 'draft' && (
              <span className="cd-badge" style={STATUS_STYLES[campaign.approval_status]||{}}>{fmt(campaign.approval_status)}</span>
            )}
            {campaign.priority && (
              <span className="cd-badge" style={PRIORITY_STYLES[campaign.priority]||{}}><FaFire style={{fontSize:10}}/> {fmt(campaign.priority)}</span>
            )}
          </div>
          {campaign.description && <p className="cd-desc">{campaign.description}</p>}
          <div className="cd-meta">
            {campaign.platform && <span className="cd-meta-pill"><FaGlobe />{campaign.platform}</span>}
            <span className="cd-meta-pill"><FaCalendar />{fmtDate(campaign.start_date)} → {fmtDate(campaign.end_date)}</span>
            {campaign.is_featured && <span className="cd-meta-pill" style={{color:'#854d0e'}}><FaStar style={{color:'#ca8a04'}}/> Featured</span>}
            {campaign.publish_to_landing && <span className="cd-meta-pill" style={{color:'#4f46e5'}}>🌐 On Landing Page</span>}
          </div>
        </div>
        <div className="cd-progress-card">
          <div className="cd-progress-circle">
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36" fill="none" stroke="#f3e8ec" strokeWidth="8" />
              <circle cx="44" cy="44" r="36" fill="none" stroke={progressColor} strokeWidth="8"
                strokeDasharray={`${2*Math.PI*36}`}
                strokeDashoffset={`${2*Math.PI*36*(1-campaign.progress/100)}`}
                strokeLinecap="round" transform="rotate(-90 44 44)"
                style={{transition:'stroke-dashoffset 320ms ease'}} />
            </svg>
            <div className="cd-progress-text">{campaign.progress}%</div>
          </div>
          <p className="cd-progress-label">Overall Progress</p>
          <p className="cd-progress-sub">{campaign.completed_tasks}/{campaign.total_tasks} tasks done</p>
        </div>
      </div>

      {/* MAIN TABS */}
      <div className="cd-main-tabs">
        {MAIN_TABS.map(t=>(
          <button key={t.key} className={`cd-main-tab${mainTab===t.key?' cd-main-tab-active':''}`}
            onClick={()=>setMainTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {message && <div className={`cd-message ${isError?'cd-msg-err':'cd-msg-ok'}`}>{message}</div>}

      {/* ── OVERVIEW TAB ──────────────────────────────────────── */}
      {mainTab === 'overview' && (
        <div className="cd-panel">
          <div className="cd-panel-header">
            <div className="cd-panel-title-wrap">
              <div className="cd-panel-icon"><FaBullhorn /></div>
              <div>
                <h4 className="cd-panel-title">Campaign Overview</h4>
                <p className="cd-panel-note">Full campaign details, goals, and settings.</p>
              </div>
            </div>
          </div>
          <div className="cd-info-grid">
            <div className="cd-info-section">
              <div className="cd-info-title">Campaign Details</div>
              {[
                ['Objective',       campaign.objective||'—'],
                ['Campaign Type',   campaign.campaign_type||'—'],
                ['Season / Event',  campaign.season_event||'—'],
                ['Campaign Month',  campaign.campaign_month||'—'],
                ['Target Audience', campaign.target_audience||'—'],
                ['Platform',        campaign.platform||'—'],
                ['Priority',        fmt(campaign.priority||'medium')],
              ].map(([k,v])=>(
                <div key={k} className="cd-info-row">
                  <span className="cd-info-key">{k}</span>
                  <span className="cd-info-val">{v}</span>
                </div>
              ))}
            </div>
            <div className="cd-info-section">
              <div className="cd-info-title">Schedule & Status</div>
              {[
                ['Start Date',       fmtDate(campaign.start_date)],
                ['End Date',         fmtDate(campaign.end_date)],
                ['Status',           fmt(campaign.status)],
                ['Approval Status',  fmt(campaign.approval_status)],
                ['Publish to Landing',campaign.publish_to_landing?'Yes':'No'],
                ['Featured',         campaign.is_featured?'Yes':'No'],
                ['Materials',        `${campaign.approved_materials||0} approved / ${campaign.total_materials||0} total`],
              ].map(([k,v])=>(
                <div key={k} className="cd-info-row">
                  <span className="cd-info-key">{k}</span>
                  <span className="cd-info-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
          {campaign.expected_outcome && (
            <>
              <div className="cd-section-divider">Expected Outcome</div>
              <p style={{fontSize:14,color:'#374151',lineHeight:1.7,margin:0}}>{campaign.expected_outcome}</p>
            </>
          )}
          {campaign.landing_headline && (
            <>
              <div className="cd-section-divider">Landing Page Content</div>
              <div style={{background:'#fff7fa',border:'1px solid #ead1d9',borderRadius:12,padding:'14px 16px'}}>
                <div style={{fontWeight:850,fontSize:16,color:'#1f2937',marginBottom:4}}>{campaign.landing_headline}</div>
                {campaign.landing_subtitle && <div style={{fontSize:13,color:'#64748b'}}>{campaign.landing_subtitle}</div>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── PRODUCTS TAB ──────────────────────────────────────── */}
      {mainTab === 'products' && (
        <div className="cd-panel">
          <div className="cd-panel-header">
            <div className="cd-panel-title-wrap">
              <div className="cd-panel-icon"><FaBox /></div>
              <div>
                <h4 className="cd-panel-title">Campaign Products</h4>
                <p className="cd-panel-note">Select inventory products for this campaign. High-stock items are ideal for bundles and promos.</p>
              </div>
            </div>
          </div>

          {/* Add product form */}
          <div className="cd-form-box">
            <div className="cd-section-divider" style={{marginTop:0}}>Add Product from Inventory</div>
            <div className="cd-form-grid">
              <div className="cd-field cd-span-2">
                <label className="cd-label">Select Inventory Item</label>
                <select value={selectedProduct.inventory_item_id}
                  onChange={e=>setSelectedProduct({...selectedProduct,inventory_item_id:e.target.value})}
                  className="cd-input">
                  <option value="">— Select item —</option>
                  {inventoryItems.map(i=>(
                    <option key={i.id} value={i.id}>{i.name} ({i.item_code||'—'}) — Stock: {i.quantity}</option>
                  ))}
                </select>
              </div>
              <div className="cd-field">
                <label className="cd-label">Promo Role</label>
                <select value={selectedProduct.promo_role}
                  onChange={e=>setSelectedProduct({...selectedProduct,promo_role:e.target.value})}
                  className="cd-input">
                  <option value="main_product">Main Product</option>
                  <option value="freebie">Freebie</option>
                  <option value="bundle_item">Bundle Item</option>
                </select>
              </div>
              <div className="cd-field cd-span-3">
                <label className="cd-label">Notes (optional)</label>
                <input type="text" placeholder="e.g. Feature in Buy 1 Take 1 promo..." value={selectedProduct.notes}
                  onChange={e=>setSelectedProduct({...selectedProduct,notes:e.target.value})} className="cd-input" />
              </div>
            </div>
            <button onClick={handleAddProduct} className="cd-submit-btn"><FaPlus /> Add to Campaign</button>
          </div>

          {/* Product list */}
          {loadingProducts ? (
            <div className="cd-empty">⏳ Loading products...</div>
          ) : products.length === 0 ? (
            <div className="cd-empty">No products selected yet. Add inventory items above to feature in this campaign.</div>
          ) : products.map(p=>(
            <div key={p.id} className="cd-product-card">
              <div style={{flex:1,minWidth:0}}>
                <div className="cd-product-name">{p.name}</div>
                <div className="cd-product-meta">
                  <span>{p.item_code||'—'}</span>
                  <span>Stock: <strong style={{color:p.stock_status==='out-of-stock'?'#b5536b':p.stock_status==='low-stock'?'#9a5f0f':'#2f7d56'}}>{p.quantity}</strong></span>
                  <span>{p.category||'—'}</span>
                  <span className="cd-badge" style={{background:'#fff1f5',color:'#b5536b',border:'1px solid #e8b9c6',padding:'3px 8px',fontSize:10}}>{fmt(p.promo_role)}</span>
                </div>
                {p.suggestion && <div className="cd-product-suggestion">{p.suggestion}</div>}
                {p.notes && <div style={{fontSize:11,color:'#64748b',marginTop:4}}>{p.notes}</div>}
              </div>
              <button className="cd-delete-btn" onClick={()=>handleRemoveProduct(p.id)}><FaTrash /></button>
            </div>
          ))}
        </div>
      )}

      {/* ── PROMOTIONS TAB ────────────────────────────────────── */}
      {mainTab === 'promos' && (
        <div className="cd-panel">
          <div className="cd-panel-header">
            <div className="cd-panel-title-wrap">
              <div className="cd-panel-icon"><FaTag /></div>
              <div>
                <h4 className="cd-panel-title">Promotional Mechanics</h4>
                <p className="cd-panel-note">Plan the promo mechanics for this campaign. Create a promotion in the Promotions module to activate.</p>
              </div>
            </div>
          </div>
          <div className="cd-promo-grid">
            {PROMO_MECHANICS.map(p=>(
              <div key={p.label} className="cd-promo-card">
                <div className="cd-promo-icon">{p.icon}</div>
                <div>
                  <div className="cd-promo-label">{p.label}</div>
                  <div className="cd-promo-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:16,padding:'14px 16px',background:'#fff7fa',borderRadius:12,border:'1px solid #ead1d9',fontSize:13,color:'#64748b'}}>
            💡 To activate a promotion for this campaign, go to <strong>Marketing → Promotions</strong> and create a promo linked to campaign ID <strong>#{campaignId}</strong>.
          </div>
        </div>
      )}

      {/* ── MATERIALS TAB ─────────────────────────────────────── */}
      {mainTab === 'materials' && (
        <div className="cd-panel">
          <div className="cd-panel-header">
            <div className="cd-panel-title-wrap">
              <div className="cd-panel-icon"><FaImage /></div>
              <div>
                <h4 className="cd-panel-title">Advertising Materials</h4>
                <p className="cd-panel-note">Posters, flyers, social posts, videos, and other campaign materials.</p>
              </div>
            </div>
            <button className="cd-add-btn" onClick={()=>{setShowMaterialForm(!showMaterialForm);setEditMaterialId(null);setMaterialForm(emptyMaterial);}}>
              {showMaterialForm?<FaTimes />:<FaPlus />} {showMaterialForm?'Cancel':'Add Material'}
            </button>
          </div>

          {showMaterialForm && (
            <div className="cd-form-box">
              <div className="cd-section-divider" style={{marginTop:0}}>{editMaterialId?'Edit':'New'} Material</div>
              <div className="cd-form-grid">
                <div className="cd-field cd-span-2">
                  <label className="cd-label">Title *</label>
                  <input type="text"  placeholder={`e.g. "Mother's Day Poster" or "BTY TikTok Promo Video"`}
                    value={materialForm.title} onChange={e=>setMaterialForm({...materialForm,title:e.target.value})} className="cd-input" />
                </div>
                <div className="cd-field">
                  <label className="cd-label">Type *</label>
                  <select value={materialForm.material_type} onChange={e=>setMaterialForm({...materialForm,material_type:e.target.value})} className="cd-input">
                    {MATERIAL_TYPES.map(t=><option key={t} value={t}>{fmtType(t)}</option>)}
                  </select>
                </div>
                <div className="cd-field">
                  <label className="cd-label">Platform</label>
                  <input type="text" placeholder="e.g. TikTok, Facebook" value={materialForm.platform}
                    onChange={e=>setMaterialForm({...materialForm,platform:e.target.value})} className="cd-input" />
                </div>
                <div className="cd-field">
                  <label className="cd-label">Assigned To</label>
                  <input type="text" placeholder="Staff name" value={materialForm.assigned_to}
                    onChange={e=>setMaterialForm({...materialForm,assigned_to:e.target.value})} className="cd-input" />
                </div>
                <div className="cd-field">
                  <label className="cd-label">Status</label>
                  <select value={materialForm.status} onChange={e=>setMaterialForm({...materialForm,status:e.target.value})} className="cd-input">
                    {MATERIAL_STATUS_FLOW.map(s=><option key={s} value={s}>{fmt(s)}</option>)}
                  </select>
                </div>
                <div className="cd-field">
                  <label className="cd-label">Due Date</label>
                  <input type="date" value={materialForm.due_date} onChange={e=>setMaterialForm({...materialForm,due_date:e.target.value})} className="cd-input" />
                </div>
                <div className="cd-field">
                  <label className="cd-label">Scheduled Date</label>
                  <input type="datetime-local" value={materialForm.scheduled_date} onChange={e=>setMaterialForm({...materialForm,scheduled_date:e.target.value})} className="cd-input" />
                </div>
                <div className="cd-field cd-span-3">
                  <label className="cd-label">Caption</label>
                  <textarea placeholder={'"Shop our BTY Advanced skincare sets. Your skin\'s BFF! 💖"'}
                    value={materialForm.caption} onChange={e=>setMaterialForm({...materialForm,caption:e.target.value})}
                    className="cd-input" style={{minHeight:70,resize:'vertical'}} />
                </div>
                <div className="cd-field cd-span-2">
                  <label className="cd-label">Hashtags</label>
                  <input type="text" placeholder="#BTYAdvance #BTY #BetterThanYesterday #SkincarePH" value={materialForm.hashtags}
                    onChange={e=>setMaterialForm({...materialForm,hashtags:e.target.value})} className="cd-input" />
                </div>
                <div className="cd-field">
                  <label className="cd-label">Call to Action</label>
                  <input type="text" placeholder="Shop Now / View Promo / Learn More" value={materialForm.call_to_action}
                    onChange={e=>setMaterialForm({...materialForm,call_to_action:e.target.value})} className="cd-input" />
                </div>
                <div className="cd-field cd-span-3">
                  <label className="cd-label">File URL (optional)</label>
                  <input type="text" placeholder="https://drive.google.com/..." value={materialForm.file_url}
                    onChange={e=>setMaterialForm({...materialForm,file_url:e.target.value})} className="cd-input" />
                </div>
                <div className="cd-field cd-span-3">
                  <label className="cd-toggle-label">
                    <input type="checkbox" checked={materialForm.publish_to_landing}
                      onChange={e=>setMaterialForm({...materialForm,publish_to_landing:e.target.checked})} />
                    🌐 Publish to Landing Page (only available if status is Approved / Scheduled / Published)
                  </label>
                </div>
              </div>
              <div className="cd-form-actions">
                <button onClick={handleAddMaterial} className="cd-submit-btn"><FaCheck /> Save Material</button>
                <button onClick={()=>{setShowMaterialForm(false);setEditMaterialId(null);setMaterialForm(emptyMaterial);}} className="cd-cancel-btn">Cancel</button>
              </div>
            </div>
          )}

          {loadingMaterials ? (
            <div className="cd-empty">⏳ Loading materials...</div>
          ) : materials.length === 0 ? (
            <div className="cd-empty">No advertising materials yet. Add posters, videos, social posts, and other content above.</div>
          ) : materials.map(m=>(
            <div key={m.id} className="cd-material-card">
              <div className="cd-material-head">
                <div>
                  <div className="cd-material-title">{m.title}</div>
                  <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{fmtType(m.material_type)}{m.platform?` · ${m.platform}`:''}</div>
                </div>
                <div style={{display:'flex',gap:7}}>
                  <button className="cd-edit-btn" onClick={()=>{
                    setEditMaterialId(m.id);
                    setMaterialForm({
                      title:m.title||'', material_type:m.material_type||'poster',
                      description:m.description||'', file_url:m.file_url||'',
                      caption:m.caption||'', hashtags:m.hashtags||'',
                      platform:m.platform||'', call_to_action:m.call_to_action||'',
                      status:m.status||'draft', assigned_to:m.assigned_to||'',
                      due_date:m.due_date?.slice(0,10)||'', scheduled_date:m.scheduled_date?.slice(0,16)||'',
                      publish_to_landing:!!m.publish_to_landing,
                    });
                    setShowMaterialForm(true);
                  }}><FaEdit /> Edit</button>
                  <button className="cd-delete-btn" onClick={()=>handleDeleteMaterial(m.id)}><FaTrash /></button>
                </div>
              </div>
              {m.caption && <p className="cd-material-caption">"{m.caption.slice(0,100)}{m.caption.length>100?'…':''}"</p>}
              {m.hashtags && <p style={{fontSize:11,color:'#4f46e5',margin:'4px 0'}}>{m.hashtags.slice(0,80)}</p>}
              <div className="cd-material-meta">
                <span className="cd-badge" style={STATUS_STYLES[m.status]||{}}>{fmt(m.status)}</span>
                {m.call_to_action && <span style={{fontSize:11,background:'#fff7e8',color:'#9a5f0f',border:'1px solid #d98a1f',borderRadius:9999,padding:'3px 8px',fontWeight:800}}>{m.call_to_action}</span>}
                {m.assigned_to && <span style={{fontSize:11,color:'#64748b'}}>👤 {m.assigned_to}</span>}
                {m.due_date && <span style={{fontSize:11,color:'#64748b'}}>📅 Due: {fmtDate(m.due_date)}</span>}
                {m.publish_to_landing && <span style={{fontSize:11,background:'#f0f0ff',color:'#4f46e5',border:'1px solid #818cf8',borderRadius:9999,padding:'3px 8px',fontWeight:800}}>🌐 Landing Page</span>}
                {m.file_url && <a href={m.file_url} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#b5536b',fontWeight:800}}>📎 File</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TASKS TAB ─────────────────────────────────────────── */}
      {mainTab === 'tasks' && (
        <div className="cd-panel">
          <div className="cd-task-tabs">
            {TASK_CATEGORIES.map(tab=>{
              const tc = tasks.filter(t=>t.category===tab.key).length;
              const dc = tasks.filter(t=>t.category===tab.key && t.status==='done').length;
              return (
                <button key={tab.key} className={`cd-tab-btn${taskTab===tab.key?' cd-tab-btn-active':''}`}
                  onClick={()=>{setTaskTab(tab.key);setShowTaskForm(false);}}>
                  {tab.icon} {tab.label}
                  <span className="cd-tab-badge">{dc}/{tc}</span>
                </button>
              );
            })}
          </div>

          <div className="cd-task-header">
            <div className="cd-panel-title-wrap">
              <div className="cd-panel-icon">{activeCategory?.icon}</div>
              <div>
                <h4 className="cd-panel-title">{activeCategory?.label}</h4>
                <p className="cd-panel-note">{doneTasks}/{tabTasks.length} tasks completed</p>
              </div>
            </div>
            <button onClick={()=>setShowTaskForm(!showTaskForm)} className="cd-add-btn">
              {showTaskForm?<FaTimes />:<FaPlus />} {showTaskForm?'Cancel':'Add Task'}
            </button>
          </div>

          {tabTasks.length > 0 && (
            <div className="cd-tab-progress">
              <div className="cd-tab-progress-fill" style={{
                width:`${tabTasks.length>0?Math.round((doneTasks/tabTasks.length)*100):0}%`,
                backgroundColor:doneTasks===tabTasks.length?'#2f9d6a':'#c4607a'
              }} />
            </div>
          )}

          {showTaskForm && (
            <div className="cd-form-box">
              <div className="cd-form-grid">
                <div className="cd-field">
                  <label className="cd-label">Task Title</label>
                  <input type="text" placeholder="Task title..." value={newTask.title}
                    onChange={e=>setNewTask({...newTask,title:e.target.value})}
                    onKeyDown={e=>e.key==='Enter'&&handleAddTask()} className="cd-input" />
                </div>
                <div className="cd-field cd-span-2">
                  <label className="cd-label">Description</label>
                  <input type="text" placeholder="Brief description..." value={newTask.description}
                    onChange={e=>setNewTask({...newTask,description:e.target.value})} className="cd-input" />
                </div>
              </div>
              <button onClick={handleAddTask} className="cd-submit-btn"><FaPlus /> Add Task</button>
            </div>
          )}

          {editTaskId && (
            <div className="cd-form-box">
              <div className="cd-form-grid">
                <div className="cd-field">
                  <label className="cd-label">Title</label>
                  <input type="text" value={editTaskForm.title}
                    onChange={e=>setEditTaskForm({...editTaskForm,title:e.target.value})} className="cd-input" />
                </div>
                <div className="cd-field">
                  <label className="cd-label">Description</label>
                  <input type="text" value={editTaskForm.description}
                    onChange={e=>setEditTaskForm({...editTaskForm,description:e.target.value})} className="cd-input" />
                </div>
                <div className="cd-field">
                  <label className="cd-label">Status</label>
                  <select value={editTaskForm.status} onChange={e=>setEditTaskForm({...editTaskForm,status:e.target.value})} className="cd-input">
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="cd-form-actions">
                <button onClick={handleUpdateTask} className="cd-submit-btn"><FaCheck /> Save</button>
                <button onClick={()=>setEditTaskId(null)} className="cd-cancel-btn">Cancel</button>
              </div>
            </div>
          )}

          {tabTasks.length === 0 ? (
            <div className="cd-empty">No tasks yet for {activeCategory?.label}. Add one above.</div>
          ) : (
            <div className="cd-task-list">
              {tabTasks.map(task=>{
                const isDone = task.status==='done';
                const borderColor = task.status==='done'?'#2f9d6a':task.status==='in-progress'?'#d98a1f':'#c9b6bf';
                return (
                  <div key={task.id} className="cd-task-item" style={{backgroundColor:isDone?'#f8fff9':'#fff',borderColor}}>
                    <div onClick={()=>handleToggleTask(task)} className="cd-checkbox"
                      style={{backgroundColor:isDone?'#2f9d6a':'#fff',borderColor:isDone?'#2f9d6a':'#c9b6bf',color:'#fff'}}>
                      {isDone && <FaCheck />}
                    </div>
                    <div className="cd-task-info">
                      <p className="cd-task-title" style={{textDecoration:isDone?'line-through':'none',color:isDone?'#94a3b8':'#1f2937'}}>
                        {task.title}
                      </p>
                      {task.description && <p className="cd-task-desc">{task.description}</p>}
                    </div>
                    <span className="cd-badge" style={STATUS_STYLES[task.status]||{}}>{task.status==='in-progress'?'In Progress':task.status==='todo'?'To Do':'Done'}</span>
                    <div className="cd-task-actions">
                      <button className="cd-edit-btn" onClick={()=>{setEditTaskId(task.id);setEditTaskForm({title:task.title,description:task.description||'',status:task.status});}}>
                        <FaEdit /> Edit
                      </button>
                      <button className="cd-delete-btn" onClick={()=>handleDeleteTask(task.id)}>
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── EQUIPMENT TAB ─────────────────────────────────────── */}
      {mainTab === 'equipment' && (
        <div className="cd-panel">
          <div className="cd-panel-header">
            <div className="cd-panel-title-wrap">
              <div className="cd-panel-icon"><FaCamera /></div>
              <div>
                <h4 className="cd-panel-title">Equipment Checklist</h4>
                <p className="cd-panel-note">Prepare equipment needed for photoshoots, product videos, and social media materials.</p>
              </div>
            </div>
          </div>
          <div className="cd-equip-grid">
            {[
              {key:'equip_lights', icon:<FaLightbulb />, label:'Lights'},
              {key:'equip_mic',    icon:<FaMicrophone />,label:'Microphone'},
              {key:'equip_camera', icon:<FaCamera />,    label:'Camera'},
            ].map(item=>{
              const active = equipment[item.key];
              return (
                <div key={item.key} onClick={()=>handleEquipmentChange(item.key,!active)}
                  className="cd-equip-item"
                  style={{backgroundColor:active?'#ecfdf3':'#fff7fa',borderColor:active?'#2f9d6a':'#e2c6cf'}}>
                  <span className="cd-equip-icon" style={{color:active?'#2f9d6a':'#b5536b'}}>{item.icon}</span>
                  <span className="cd-equip-label">{item.label}</span>
                  <span className="cd-equip-check" style={{backgroundColor:active?'#2f9d6a':'#c9b6bf'}}>
                    {active && <FaCheck />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── APPROVAL TAB ──────────────────────────────────────── */}
      {mainTab === 'approval' && (
        <div className="cd-panel">
          <div className="cd-panel-header">
            <div className="cd-panel-title-wrap">
              <div className="cd-panel-icon"><FaCheck /></div>
              <div>
                <h4 className="cd-panel-title">Campaign Approval</h4>
                <p className="cd-panel-note">Only approved or published campaigns should have materials appear on the landing page.</p>
              </div>
            </div>
          </div>

          {/* Approval flow display */}
          <div className="cd-approval-flow">
            {APPROVAL_FLOW.map((step,i)=>{
              const curIdx = APPROVAL_FLOW.indexOf(campaign.approval_status||'draft');
              const isDone = curIdx > i;
              const isCur  = campaign.approval_status === step;
              return (
                <div key={step} className={`cd-approval-step ${isCur?'cd-approval-active':isDone?'cd-approval-done':''}`}>
                  <div className="cd-approval-dot" style={{backgroundColor:isCur?'#c4607a':isDone?'#2f9d6a':'#d8b8c2'}} />
                  <span className="cd-approval-label" style={{color:isCur?'#c4607a':isDone?'#2f9d6a':'#94a3b8',fontWeight:isCur?800:700}}>{fmt(step)}</span>
                  {i < APPROVAL_FLOW.length-1 && <div className="cd-approval-line" style={{backgroundColor:isDone?'#2f9d6a':'#ead1d9'}} />}
                </div>
              );
            })}
          </div>

          {campaign.approved_by && (
            <div style={{background:'#ecfdf3',border:'1px solid #2f9d6a',borderRadius:12,padding:'12px 14px',marginBottom:16,fontSize:13,color:'#2f7d56'}}>
              ✓ Approved by <strong>{campaign.approved_by}</strong>
              {campaign.approved_at && ` on ${new Date(campaign.approved_at).toLocaleDateString()}`}
            </div>
          )}

          <div className="cd-form-grid">
            <div className="cd-field">
              <label className="cd-label">Update Approval Status</label>
              <select value={approvalForm.approval_status}
                onChange={e=>setApprovalForm({...approvalForm,approval_status:e.target.value})} className="cd-input">
                {['draft','in-progress','for-review','approved','published','completed','cancelled','rejected'].map(s=>(
                  <option key={s} value={s}>{fmt(s)}</option>
                ))}
              </select>
            </div>
            <div className="cd-field">
              <label className="cd-label">Approved By</label>
              <input type="text" placeholder="Staff name" value={approvalForm.approved_by}
                onChange={e=>setApprovalForm({...approvalForm,approved_by:e.target.value})} className="cd-input" />
            </div>
            <div className="cd-field cd-span-3">
              <label className="cd-label">Review Comments</label>
              <textarea placeholder="Add reviewer notes, revision feedback, or approval notes..."
                value={approvalForm.review_comments}
                onChange={e=>setApprovalForm({...approvalForm,review_comments:e.target.value})}
                className="cd-input" style={{minHeight:80,resize:'vertical'}} />
            </div>
          </div>
          <button onClick={handleApprovalUpdate} className="cd-submit-btn"><FaCheck /> Save Approval</button>
        </div>
      )}

      {/* ── PERFORMANCE TAB ───────────────────────────────────── */}
      {mainTab === 'performance' && (
        <div className="cd-panel">
          <div className="cd-panel-header">
            <div className="cd-panel-title-wrap">
              <div className="cd-panel-icon"><FaChartLine /></div>
              <div>
                <h4 className="cd-panel-title">Campaign Performance</h4>
                <p className="cd-panel-note">Connect Performance data from the Performance submodule. Data will appear here once linked.</p>
              </div>
            </div>
          </div>
          <div className="cd-perf-grid">
            {[
              ['Total Reach','—'],['Total Views','—'],['Total Likes','—'],
              ['Total Comments','—'],['Total Shares','—'],['Total Clicks','—'],
              ['Engagement Rate','—'],['Sales Generated','—'],
            ].map(([label,value])=>(
              <div key={label} className="cd-perf-card">
                <div className="cd-perf-value" style={{color:'#94a3b8'}}>{value}</div>
                <div className="cd-perf-label">{label}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:16,padding:'14px 16px',background:'#fff7fa',borderRadius:12,border:'1px solid #ead1d9',fontSize:13,color:'#64748b'}}>
            💡 To view real performance data, go to <strong>Marketing → Performance</strong> and add records linked to this campaign (ID: <strong>#{campaignId}</strong>).
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignDetail;