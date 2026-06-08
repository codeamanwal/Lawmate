import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, LogOut, Search, Filter, ArrowUpDown, Plus, 
  Edit2, Trash2, Calendar, Clock, Phone, MapPin, Tag, RefreshCw,
  AlertTriangle, CheckCircle2, ChevronRight, Database, FileSpreadsheet,
  User, Shield, PhoneCall, Volume2, Award, CheckSquare, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Lead {
  id: string;
  name: string;
  phone: string;
  city: string;
  category: string;
  description: string;
  preferredTime: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  slaStatus?: string;
  retryCount?: number;
  lawyerId?: string | null;
  userId?: string | null;
  lawyerResolution?: string | null;
  feedbackRating?: number | null;
  feedbackText?: string | null;
  callSid?: string | null;
  recordingUrl?: string | null;
  declinedLawyerIds?: string[];
  notifiedLawyerIds?: string[];
  flow?: string;
  user?: {
    id: string;
    email: string;
    phone?: string | null;
    name?: string | null;
  } | null;
  lawyer?: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    categories: string[];
    rating: number;
    user?: {
      email: string;
    } | null;
  } | null;
  booking?: {
    id: string;
    status: string;
    payment?: {
      id: string;
      amount: number;
      status: string;
    } | null;
  } | null;
}

const FLOW_1_SHEET_URL = "https://script.google.com/macros/s/AKfycbwB1E_bF2VSIayBK8AXUsFvI5mhohFB8WZyR-Tb4eCEUfOVsEZgJLscCHI8NaBREf0AfA/exec";

const MOCK_FLOW_1_LEADS: Lead[] = [
  {
    id: "sheet-1",
    name: "Rajesh Kumar",
    phone: "9876543211",
    city: "Delhi",
    category: "Property",
    description: "Property dispute regarding ancestral land in West Delhi.",
    preferredTime: "Callback Requested",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    flow: "Flow 1",
    status: "NEW",
    slaStatus: "CALLBACK_PENDING",
    retryCount: 0
  },
  {
    id: "sheet-2",
    name: "Sunita Sharma",
    phone: "9812345678",
    city: "Gurugram",
    category: "Matrimonial",
    description: "Legal advice required for mutual divorce proceedings.",
    preferredTime: "Callback Requested",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    flow: "Flow 1",
    status: "NEW",
    slaStatus: "CALLBACK_PENDING",
    retryCount: 0
  }
];

const getSlaStatusBadge = (lead: Lead) => {
  const status = lead.slaStatus;
  if (!status) return null;

  let text = status;
  let bgClass = "bg-gray-100 text-gray-700 border-gray-200";

  switch (status) {
    case 'CALLBACK_PENDING':
      text = 'Callback Pending';
      bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'PENDING_ACCEPTANCE':
      text = 'Pending Acceptance';
      bgClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
      break;
    case 'REASSIGNING':
      text = 'Reassigning';
      bgClass = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'NOT_ATTENDED':
      if ((lead.retryCount ?? 0) >= 3 || !lead.lawyerId) {
        text = 'Manual Handled';
        bgClass = 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
      } else {
        text = 'Not Attended';
        bgClass = 'bg-red-50 text-red-700 border-red-200';
      }
      break;
    case 'ACCEPTED':
      text = 'Accepted';
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'COMPLETED':
      text = 'Completed';
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${bgClass}`}>
      {text}
    </span>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Leads Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetStatus, setSheetStatus] = useState<'idle' | 'success' | 'failed' | 'fallback'>('idle');

  // Filter/Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlow, setSelectedFlow] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('All');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Advanced Granular Filter States
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedLawyerFilter, setSelectedLawyerFilter] = useState('All');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('All');
  const [selectedCallFilter, setSelectedCallFilter] = useState('All');
  const [selectedResolutionFilter, setSelectedResolutionFilter] = useState('All');
  const [selectedSlaStatusFilter, setSelectedSlaStatusFilter] = useState('All');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('All');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Form States for CRUD
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    category: '',
    description: '',
    preferredTime: 'ASAP' as 'ASAP' | 'LATER'
  });
  const [crudLoading, setCrudLoading] = useState(false);

  useEffect(() => {
    const sessionAuth = localStorage.getItem('isAdminLoggedIn');
    if (sessionAuth === 'true') {
      setIsLoggedIn(true);
      fetchLeads();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    const isMatch = (email.trim() === 'admin@lawmate.in' && password === 'adminpassword123') ||
                    (email.trim() === 'admin@lawoncall.in' && password === 'admin12345');

    if (isMatch) {
      setTimeout(() => {
        setIsLoggedIn(true);
        localStorage.setItem('isAdminLoggedIn', 'true');
        toast.success('Logged in successfully as Admin.');
        setAuthLoading(false);
        fetchLeads();
      }, 800);
    } else {
      setTimeout(() => {
        toast.error('Invalid admin credentials.');
        setAuthLoading(false);
      }, 800);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isAdminLoggedIn');
    toast.success('Admin session ended.');
  };

  const fetchLeads = async () => {
    setLoading(true);
    let dbLeads: Lead[] = [];
    let sheetLeads: Lead[] = [];

    // 1. Fetch DB Leads
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leads`);
      if (response.ok) {
        const data = await response.json();
        // Categorize DB leads into Flow 1, 2, 3, or 4 based on preferredTime
        dbLeads = data.map((lead: any) => {
          let flow = 'Flow 3'; // Same Day Default
          const time = (lead.preferredTime || '').toLowerCase();
          if (time.includes('callback')) {
            flow = 'Flow 1';
          } else if (time.includes('emergency')) {
            flow = 'Flow 4';
          } else if (time.includes('asap')) {
            flow = 'Flow 2';
          }
          return {
            ...lead,
            flow
          };
        });
      } else {
        toast.error('Failed to load leads from database.');
      }
    } catch (err) {
      console.error('Error fetching DB leads:', err);
      toast.error('Database server unreachable.');
    }

    // 2. Fetch Google Sheet Leads (Flow 1)
    try {
      setSheetStatus('idle');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(FLOW_1_SHEET_URL, { 
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          const data = JSON.parse(text);
          sheetLeads = (Array.isArray(data) ? data : []).map((row: any, index: number) => ({
            id: `sheet-${index}-${Date.now()}`,
            name: row.name || row.Name || 'Anonymous Callback',
            phone: row.phone || row.Phone || 'No Phone',
            city: row.city || row.City || null,
            category: row.category || row.Category || null,
            description: row.message || row.Message || row.description || null,
            preferredTime: 'Callback Requested',
            createdAt: row.timestamp || row.Timestamp || new Date().toISOString(),
            flow: 'Flow 1',
            status: "NEW",
            slaStatus: "CALLBACK_PENDING",
            retryCount: 0
          }));
          setSheetStatus('success');
        } else {
          console.warn('Google Sheet returned HTML (Sign-in required). Loading fallback data.');
          sheetLeads = MOCK_FLOW_1_LEADS;
          setSheetStatus('fallback');
        }
      } else {
        sheetLeads = MOCK_FLOW_1_LEADS;
        setSheetStatus('failed');
      }
    } catch (err) {
      console.warn('Google Sheet fetch error (likely CORS or timeout). Loading fallback data.', err);
      sheetLeads = MOCK_FLOW_1_LEADS;
      setSheetStatus('fallback');
    }

    // 3. Merge & Save Leads
    setLeads([...dbLeads, ...sheetLeads]);
    setLoading(false);
  };

  // Add Flow 4 (Emergency) Lead
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.city || !formData.category) {
      toast.error('All fields except description are required.');
      return;
    }

    setCrudLoading(true);
    try {
      const payload = {
        fullName: formData.name,
        phone: formData.phone,
        city: formData.city,
        category: formData.category,
        description: formData.description || 'Emergency Helpline consultation request.',
        preferredTime: formData.preferredTime === 'ASAP' ? 'Emergency - ASAP' : 'Emergency - LATER'
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        const leadId = result.id;

        // Link the lead to user by phone and create the PENDING booking
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/api/leads/${leadId}/prepare-emergency`, {
            method: 'POST'
          });
        } catch (prepErr) {
          console.warn('Prepare emergency failed (non-critical):', prepErr);
        }

        toast.success('Emergency lead (Flow 4) created! Redirecting to payment...');
        setIsAddModalOpen(false);
        resetForm();
        fetchLeads();
        navigate('/payment', { state: { leadId } });
      } else {
        toast.error('Failed to create lead.');
      }
    } catch (err) {
      toast.error('Network error creating lead.');
    } finally {
      setCrudLoading(false);
    }
  };

  // Edit Flow 4 / Flow 1 Lead — saves details + links to user by phone + triggers SLA match
  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setCrudLoading(true);
    try {
      const isSheetLead = selectedLead.id.startsWith('sheet-');
      
      const isFlow1 = selectedLead.flow === 'Flow 1';
      
      let finalPreferredTime = 'ASAP';
      if (isFlow1) {
        finalPreferredTime = formData.preferredTime === 'ASAP' ? 'Callback - ASAP' : 'Callback - LATER';
      } else {
        finalPreferredTime = formData.preferredTime === 'ASAP' ? 'Emergency - ASAP' : 'Emergency - LATER';
      }

      const payload = {
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        category: formData.category,
        description: formData.description,
        preferredTime: finalPreferredTime
      };

      let response;
      if (isSheetLead) {
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fullName: formData.name,
            phone: formData.phone,
            city: formData.city,
            category: formData.category,
            description: formData.description,
            preferredTime: finalPreferredTime
          })
        });
      } else {
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/leads/${selectedLead.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const result = await response.json();
        const leadId = isSheetLead ? result.id : selectedLead.id;

        // Link the lead to user by phone and create the PENDING booking
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/api/leads/${leadId}/prepare-emergency`, {
            method: 'POST'
          });
        } catch (prepErr) {
          console.warn('Prepare emergency failed (non-critical):', prepErr);
        }
        toast.success('Emergency case created! Redirecting to payment...');
        setIsEditModalOpen(false);
        resetForm();
        fetchLeads();
        navigate('/payment', { state: { leadId } });
      } else {
        toast.error('Failed to update lead.');
      }
    } catch (err) {
      toast.error('Network error updating lead.');
    } finally {
      setCrudLoading(false);
    }
  };

  // Delete Flow 4 Lead
  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Emergency Lead?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leads/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Lead deleted successfully.');
        fetchLeads();
      } else {
        toast.error('Failed to delete lead.');
      }
    } catch (err) {
      toast.error('Network error deleting lead.');
    }
  };

  const openEditModal = (lead: Lead) => {
    setSelectedLead(lead);
    const validCategories = [
      'Family & Marriage',
      'Domestic Violence',
      'Property & Registry',
      'Criminal & Police',
      'Supreme Court Lawyer',
      'Cyber & Digital Fraud',
      'Employment & HR',
      'Consumer Complaints',
      'Other'
    ];
    const resolvedCategory = validCategories.includes(lead.category) ? lead.category : '';
    
    // Parse preferredTime
    let resolvedPreferredTime: 'ASAP' | 'LATER' = 'ASAP';
    if ((lead.preferredTime || '').toLowerCase().includes('later')) {
      resolvedPreferredTime = 'LATER';
    }

    setFormData({
      name: lead.name,
      phone: lead.phone,
      city: lead.city || '',
      category: resolvedCategory,
      description: lead.description || '',
      preferredTime: resolvedPreferredTime
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = (lead: Lead) => {
    setSelectedLead(lead);
    setShowRawJson(false);
    setIsDetailModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      city: '',
      category: '',
      description: '',
      preferredTime: 'ASAP'
    });
    setSelectedLead(null);
  };

  // Filter & Sort Operations
  const filteredLeads = leads
    .filter(lead => {
      // Flow Filter
      if (selectedFlow !== 'All' && lead.flow !== selectedFlow) return false;

      // Status Filter
      if (selectedStatus !== 'All') {
        const leadStatus = lead.status || 'NEW';
        if (leadStatus !== selectedStatus) return false;
      }

      // Category Filter
      if (selectedCategory !== 'All' && lead.category !== selectedCategory) return false;

      // Date Range Filter
      if (selectedDateRange !== 'All') {
        const leadDate = new Date(lead.createdAt);
        const now = new Date();
        
        // Start of today
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        // Start of yesterday
        const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
        const leadTime = leadDate.getTime();

        if (selectedDateRange === 'today') {
          if (leadTime < todayStart) return false;
        } else if (selectedDateRange === 'yesterday') {
          if (leadTime < yesterdayStart || leadTime >= todayStart) return false;
        } else if (selectedDateRange === 'week') {
          const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
          if (leadTime < sevenDaysAgo) return false;
        } else if (selectedDateRange === 'month') {
          const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
          if (leadTime < thirtyDaysAgo) return false;
        }
      }

      // 1. Lawyer Assignment Filter
      if (selectedLawyerFilter === 'Assigned' && !lead.lawyerId) return false;
      if (selectedLawyerFilter === 'Unassigned' && lead.lawyerId) return false;

      // 2. Client Rating Filter
      if (selectedRatingFilter !== 'All') {
        const rating = lead.feedbackRating;
        if (selectedRatingFilter === '5' && rating !== 5) return false;
        if (selectedRatingFilter === '4' && (rating === null || rating < 4)) return false;
        if (selectedRatingFilter === '3' && (rating === null || rating < 3)) return false;
        if (selectedRatingFilter === 'poor' && (rating === null || rating > 2)) return false;
        if (selectedRatingFilter === 'none' && rating !== null && rating !== undefined) return false;
      }

      // 3. Exotel Call Log Filter
      if (selectedCallFilter === 'recording' && !lead.recordingUrl) return false;
      if (selectedCallFilter === 'attempted' && !lead.callSid) return false;
      if (selectedCallFilter === 'none' && lead.callSid) return false;

      // 4. Case Resolution Filter
      if (selectedResolutionFilter !== 'All') {
        const res = lead.lawyerResolution || 'PENDING';
        if (res !== selectedResolutionFilter) return false;
      }

      // 5. SLA Status Filter
      if (selectedSlaStatusFilter !== 'All') {
        const sla = lead.slaStatus || 'NONE';
        if (sla !== selectedSlaStatusFilter) return false;
      }

      // 6. User Account Filter
      if (selectedAccountFilter === 'registered' && !lead.userId) return false;
      if (selectedAccountFilter === 'guest' && lead.userId) return false;
      
      // Search Term
      const query = searchTerm.toLowerCase();
      return (
        (lead.name || '').toLowerCase().includes(query) ||
        (lead.phone || '').toLowerCase().includes(query) ||
        (lead.city || '').toLowerCase().includes(query) ||
        (lead.category || '').toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name-desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      if (sortBy === 'city-asc') {
        return (a.city || '').localeCompare(b.city || '');
      }
      return 0;
    });

  // Dynamically compute unique categories from active leads list
  const uniqueCategories = Array.from(
    new Set(leads.map(lead => lead.category).filter(Boolean))
  );

  const stats = {
    total: leads.length,
    flow1: leads.filter(l => l.flow === 'Flow 1').length,
    flow2: leads.filter(l => l.flow === 'Flow 2').length,
    flow3: leads.filter(l => l.flow === 'Flow 3').length,
    flow4: leads.filter(l => l.flow === 'Flow 4').length
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-6 py-12 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 shadow-2xl relative"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Gateway</h1>
            <p className="text-sm text-gray-400 mt-1">Please authenticate to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Admin Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lawmate.in"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
              />
            </div>

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Authenticate Session'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-950 tracking-tight leading-none">
              Console Control
            </h1>
            <p className="text-gray-500 mt-2">Manage consultation callback flows and database configurations.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchLeads}
              disabled={loading}
              className="p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-gray-700 hover:text-gray-950 transition-colors shadow-sm flex items-center justify-center"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleLogout}
              className="px-5 py-3 bg-red-50 border border-red-200 hover:bg-red-100/80 text-red-700 font-bold rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" /> End Session
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Leads</p>
            <h3 className="text-3xl font-black text-gray-900">{stats.total}</h3>
          </div>
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm border-l-4 border-l-amber-500">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Flow 1 (Sheet)</p>
            <h3 className="text-3xl font-black text-amber-600">{stats.flow1}</h3>
          </div>
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm border-l-4 border-l-blue-500">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Flow 2 (60 Min)</p>
            <h3 className="text-3xl font-black text-blue-600">{stats.flow2}</h3>
          </div>
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm border-l-4 border-l-green-500">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Flow 3 (Same Day)</p>
            <h3 className="text-3xl font-black text-green-600">{stats.flow3}</h3>
          </div>
          <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm border-l-4 border-l-red-500">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Flow 4 (Emergency)</p>
            <h3 className="text-3xl font-black text-red-600">{stats.flow4}</h3>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white border border-gray-200 rounded-[28px] p-6 mb-8 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
            {/* Search and Primary Flow/Status filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search name, phone, city, case..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm w-full"
                />
              </div>

              {/* Filter by Flow */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                  value={selectedFlow}
                  onChange={(e) => setSelectedFlow(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Flows</option>
                  <option value="Flow 1">Flow 1: Callback</option>
                  <option value="Flow 2">Flow 2: 60 Min SLA</option>
                  <option value="Flow 3">Flow 3: Same Day</option>
                  <option value="Flow 4">Flow 4: Emergency</option>
                </select>
              </div>

              {/* Filter by Status */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
                <CheckSquare className="w-4 h-4 text-gray-400" />
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="NEW">New / Unassigned</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                  showAdvancedFilters 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold' 
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                {showAdvancedFilters ? 'Simple Filters' : 'More Filters'}
              </button>

              <button 
                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Add Flow 4 Lead
              </button>
            </div>
          </div>

          {/* Sub Filters & Sort bar */}
          <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center gap-3">
            {/* Filter by Category */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Filter by Date Range */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select 
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest Created</option>
                <option value="oldest">Oldest Created</option>
                <option value="name-asc">Client Name (A-Z)</option>
                <option value="name-desc">Client Name (Z-A)</option>
                <option value="city-asc">City (A-Z)</option>
              </select>
            </div>

            {/* Reset Filters button if any filter is active */}
            {(selectedFlow !== 'All' || selectedStatus !== 'All' || selectedCategory !== 'All' || selectedDateRange !== 'All' || 
              selectedLawyerFilter !== 'All' || selectedRatingFilter !== 'All' || selectedCallFilter !== 'All' || 
              selectedResolutionFilter !== 'All' || selectedSlaStatusFilter !== 'All' || selectedAccountFilter !== 'All' || 
              searchTerm !== '') && (
              <button 
                onClick={() => {
                  setSelectedFlow('All');
                  setSelectedStatus('All');
                  setSelectedCategory('All');
                  setSelectedDateRange('All');
                  setSelectedLawyerFilter('All');
                  setSelectedRatingFilter('All');
                  setSelectedCallFilter('All');
                  setSelectedResolutionFilter('All');
                  setSelectedSlaStatusFilter('All');
                  setSelectedAccountFilter('All');
                  setSearchTerm('');
                  setSortBy('newest');
                  toast.success('Filters reset to default.');
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>

          {/* Advanced Collapsible Filters Panel */}
          {showAdvancedFilters && (
            <div className="border-t border-gray-105 pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Filter by Lawyer Assignment */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lawyer Assignment</span>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <select 
                    value={selectedLawyerFilter}
                    onChange={(e) => setSelectedLawyerFilter(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer w-full"
                  >
                    <option value="All">All Leads</option>
                    <option value="Assigned">Assigned to Lawyer</option>
                    <option value="Unassigned">Unassigned / Awaiting</option>
                  </select>
                </div>
              </div>

              {/* Filter by Client Rating */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client Rating</span>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
                  <Award className="w-4 h-4 text-gray-400" />
                  <select 
                    value={selectedRatingFilter}
                    onChange={(e) => setSelectedRatingFilter(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer w-full"
                  >
                    <option value="All">All Ratings</option>
                    <option value="5">★ 5 Stars Only</option>
                    <option value="4">★ 4+ Stars</option>
                    <option value="3">★ 3+ Stars</option>
                    <option value="poor">★ Poor (1-2 Stars)</option>
                    <option value="none">No Feedback Rated</option>
                  </select>
                </div>
              </div>

              {/* Filter by Call Status */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Exotel Call Logs</span>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
                  <PhoneCall className="w-4 h-4 text-gray-400 animate-pulse" />
                  <select 
                    value={selectedCallFilter}
                    onChange={(e) => setSelectedCallFilter(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer w-full"
                  >
                    <option value="All">All Call Records</option>
                    <option value="recording">Has Call Recording</option>
                    <option value="attempted">Has Call Attempt</option>
                    <option value="none">No Calls Registered</option>
                  </select>
                </div>
              </div>

              {/* Filter by Lawyer Resolution */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Case Resolution State</span>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
                  <CheckSquare className="w-4 h-4 text-gray-400" />
                  <select 
                    value={selectedResolutionFilter}
                    onChange={(e) => setSelectedResolutionFilter(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer w-full"
                  >
                    <option value="All">All Resolutions</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="FORWARDED">FORWARDED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="PENDING">PENDING RESOLUTION</option>
                  </select>
                </div>
              </div>

              {/* Filter by SLA Status */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SLA Matching Alert</span>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <select 
                    value={selectedSlaStatusFilter}
                    onChange={(e) => setSelectedSlaStatusFilter(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer w-full"
                  >
                    <option value="All">All SLA Alerts</option>
                    <option value="PENDING_ACCEPTANCE">Pending Acceptance</option>
                    <option value="NOT_ATTENDED">SLA Breached (Not Attended)</option>
                    <option value="REASSIGNING">Reassigning Lawyer</option>
                  </select>
                </div>
              </div>

              {/* Filter by Account Type */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Client Account Context</span>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <select 
                    value={selectedAccountFilter}
                    onChange={(e) => setSelectedAccountFilter(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer w-full"
                  >
                    <option value="All">All Accounts</option>
                    <option value="registered">Registered User Accounts</option>
                    <option value="guest">Guest / Anonymous Callback</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Unified Table */}
        <div className="bg-white border border-gray-200 rounded-[28px] overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500 font-medium">Reconciling databases...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-24 text-center">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-gray-800">No leads match selection</h4>
              <p className="text-sm text-gray-400 max-w-xs mx-auto mt-1">Try resetting filters or checking your search queries.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    <th className="px-6 py-4.5 text-xs font-black text-gray-400 uppercase tracking-widest">Lead Details</th>
                    <th className="px-6 py-4.5 text-xs font-black text-gray-400 uppercase tracking-widest">Region</th>
                    <th className="px-6 py-4.5 text-xs font-black text-gray-400 uppercase tracking-widest">Case Description</th>
                    <th className="px-6 py-4.5 text-xs font-black text-gray-400 uppercase tracking-widest">SLA Flow</th>
                    <th className="px-6 py-4.5 text-xs font-black text-gray-400 uppercase tracking-widest">Status / SLA</th>
                    <th className="px-6 py-4.5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => openDetailModal(lead)}
                      className="hover:bg-gray-50/40 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <p className="font-bold text-gray-900 leading-snug">{lead.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{lead.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{lead.city || <span className="text-gray-400 italic">—</span>}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          {lead.category ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                              <Tag className="w-2.5 h-2.5" />
                              {lead.category}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-[10px]">No category</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {lead.description || <span className="text-gray-400 italic">No description provided</span>}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        {lead.flow === 'Flow 1' && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            lead.booking?.payment?.status === 'captured' || lead.booking?.status === 'CONFIRMED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            <FileSpreadsheet className="w-3 h-3" /> 
                            {(lead.preferredTime || '').toLowerCase().includes('later') ? 'Callback (Later Today)' : 'Callback (60mins)'}
                            {!(lead.booking?.payment?.status === 'captured' || lead.booking?.status === 'CONFIRMED') && ' - Pending'}
                          </span>
                        )}
                        {lead.flow === 'Flow 2' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-black uppercase tracking-wider">
                            <Clock className="w-3 h-3" /> Flow 2: 60 Min
                          </span>
                        )}
                        {lead.flow === 'Flow 3' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 text-xs font-black uppercase tracking-wider">
                            <Calendar className="w-3 h-3" /> Flow 3: Same Day
                          </span>
                        )}
                        {lead.flow === 'Flow 4' && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            lead.booking?.payment?.status === 'captured' || lead.booking?.status === 'CONFIRMED'
                              ? 'bg-red-50 text-red-700 border border-red-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            <AlertTriangle className="w-3 h-3" /> 
                            {(lead.preferredTime || '').toLowerCase().includes('later') ? 'Emergency - SLA (Later Today)' : 'Emergency - SLA (60mins)'}
                            {!(lead.booking?.payment?.status === 'captured' || lead.booking?.status === 'CONFIRMED') && ' - Pending'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              lead.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              lead.status === 'ASSIGNED' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {lead.status || 'NEW'}
                            </span>
                            
                            {/* Payment Status Tag */}
                            {(lead.flow === 'Flow 1' || lead.flow === 'Flow 4') && (
                              lead.booking?.payment?.status === 'captured' || lead.booking?.status === 'CONFIRMED' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-wider">
                                  Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-black uppercase tracking-wider">
                                  Payment Pending
                                </span>
                              )
                            )}
                          </div>
                          {lead.slaStatus && (
                            <div className="mt-1">
                              {getSlaStatusBadge(lead)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Slot */}
                          <div className="w-9 h-9 flex items-center justify-center">
                            {(lead.flow === 'Flow 4' || lead.flow === 'Flow 1') && 
                             !(lead.booking?.payment?.status === 'captured' || lead.booking?.status === 'CONFIRMED' || lead.status === 'ASSIGNED' || lead.status === 'COMPLETED') ? (
                              <button 
                                onClick={() => openEditModal(lead)}
                                className="p-2 text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg transition-colors cursor-pointer"
                                title="Edit Lead"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>

                          {/* Delete Slot */}
                          <div className="w-9 h-9 flex items-center justify-center">
                            {lead.flow === 'Flow 4' || lead.flow === 'Flow 1' ? (
                              <button 
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-2 text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100/80 rounded-lg transition-colors cursor-pointer"
                                title="Delete Lead"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : null}
                          </div>

                          {/* View/Inspect Slot */}
                          <div className="w-9 h-9 flex items-center justify-center">
                            <button 
                              onClick={() => openDetailModal(lead)}
                              className="p-2 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Inspect Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl relative border border-gray-100 animate-in fade-in duration-200"
            >
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Create Emergency Lead</h3>
              <p className="text-sm text-gray-500 mb-6">Manually inject a case to trigger the Emergency Helpline matching process.</p>

              <form onSubmit={handleAddLead} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+91</span>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone.replace(/^\+91/, '')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: val ? `+91${val}` : '' });
                      }}
                      placeholder="10-digit mobile"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                    <select
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-white cursor-pointer text-sm"
                    >
                      <option value="">Select City</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Gautam Buddha Nagar">Gautam Buddha Nagar</option>
                      <option value="Ghaziabad">Ghaziabad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Issue Category</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-white cursor-pointer text-sm"
                    >
                      <option value="">Select Category</option>
                      <option value="Family & Marriage">Family & Marriage</option>
                      <option value="Domestic Violence">Domestic Violence</option>
                      <option value="Property & Registry">Property & Registry</option>
                      <option value="Criminal & Police">Criminal & Police</option>
                      <option value="Supreme Court Lawyer">Supreme Court Lawyer</option>
                      <option value="Cyber & Digital Fraud">Cyber & Digital Fraud</option>
                      <option value="Employment & HR">Employment & HR</option>
                      <option value="Consumer Complaints">Consumer Complaints</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brief Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell us a bit about your legal concern..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">When would you like to consult?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.preferredTime === 'ASAP' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                      <input 
                        type="radio" 
                        name="preferredTime" 
                        value="ASAP" 
                        checked={formData.preferredTime === 'ASAP'}
                        onChange={() => setFormData({ ...formData, preferredTime: 'ASAP' })}
                        className="hidden" 
                      />
                      <span className="font-bold">ASAP (60 min)</span>
                    </label>
                    <label className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.preferredTime === 'LATER' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                      <input 
                        type="radio" 
                        name="preferredTime" 
                        value="LATER" 
                        checked={formData.preferredTime === 'LATER'}
                        onChange={() => setFormData({ ...formData, preferredTime: 'LATER' })}
                        className="hidden" 
                      />
                      <span className="font-bold">Later Today</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={crudLoading}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-sm"
                  >
                    {crudLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Confirm creation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Lead Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl relative border border-gray-100"
            >
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Create Emergency Case</h3>
              <p className="text-sm text-gray-500 mb-6">Finalize details for lead id: <span className="font-mono text-xs">{selectedLead?.id}</span> — clicking <span className="font-bold text-indigo-600">Create Emergency Case</span> will save the details and activate SLA matching.</p>

              <form onSubmit={handleEditLead} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+91</span>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone.replace(/^\+91/, '')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: val ? `+91${val}` : '' });
                      }}
                      placeholder="10-digit mobile"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                    <select
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-white cursor-pointer text-sm"
                    >
                      <option value="">Select City</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Gautam Buddha Nagar">Gautam Buddha Nagar</option>
                      <option value="Ghaziabad">Ghaziabad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Issue Category</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-white cursor-pointer text-sm"
                    >
                      <option value="">Select Category</option>
                      <option value="Family & Marriage">Family & Marriage</option>
                      <option value="Domestic Violence">Domestic Violence</option>
                      <option value="Property & Registry">Property & Registry</option>
                      <option value="Criminal & Police">Criminal & Police</option>
                      <option value="Supreme Court Lawyer">Supreme Court Lawyer</option>
                      <option value="Cyber & Digital Fraud">Cyber & Digital Fraud</option>
                      <option value="Employment & HR">Employment & HR</option>
                      <option value="Consumer Complaints">Consumer Complaints</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brief Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell us a bit about your legal concern..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">When would you like to consult?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.preferredTime === 'ASAP' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                      <input 
                        type="radio" 
                        name="preferredTime" 
                        value="ASAP" 
                        checked={formData.preferredTime === 'ASAP'}
                        onChange={() => setFormData({ ...formData, preferredTime: 'ASAP' })}
                        className="hidden" 
                      />
                      <span className="font-bold">ASAP (60 min)</span>
                    </label>
                    <label className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.preferredTime === 'LATER' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                      <input 
                        type="radio" 
                        name="preferredTime" 
                        value="LATER" 
                        checked={formData.preferredTime === 'LATER'}
                        onChange={() => setFormData({ ...formData, preferredTime: 'LATER' })}
                        className="hidden" 
                      />
                      <span className="font-bold">Later Today</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={crudLoading}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-sm"
                  >
                    {crudLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Emergency Case'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expanded Lead Details Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedLead && (
          <div 
            onClick={() => setIsDetailModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto md:py-12"
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="bg-white rounded-[32px] w-full max-w-4xl p-6 sm:p-8 shadow-2xl border border-gray-100 relative my-8 max-h-[85vh] overflow-y-auto"
            >
              {/* Close button */}
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-950 tracking-tight leading-none">Lead Registry Entry</h3>
                  <p className="text-xs text-gray-400 font-mono mt-1.5">ID: {selectedLead.id}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Side: Lead core data */}
                <div className="space-y-6">
                  {/* Client Information */}
                  <div className="p-5 bg-gray-50/70 border border-gray-100 rounded-2xl">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <User className="w-4 h-4 text-indigo-600" /> Client Profile
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-medium">Name:</span>
                        <span className="col-span-2 text-gray-800 font-semibold">{selectedLead.name}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-medium">Phone:</span>
                        <span className="col-span-2 text-gray-800 font-semibold">{selectedLead.phone}</span>
                      </div>
                      {selectedLead.user?.email && (
                        <div className="grid grid-cols-3">
                          <span className="text-gray-400 font-medium">Account Email:</span>
                          <span className="col-span-2 text-indigo-600 font-semibold">{selectedLead.user.email}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-medium">City:</span>
                        <span className="col-span-2 text-gray-800 font-semibold">{selectedLead.city || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Case Details */}
                  <div className="p-5 bg-gray-50/70 border border-gray-100 rounded-2xl">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <Tag className="w-4 h-4 text-indigo-600" /> Case Particulars
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-medium">Category:</span>
                        <span className="col-span-2">
                          {selectedLead.category ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                              {selectedLead.category}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">None</span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-400 font-medium">Description:</span>
                        <p className="text-gray-700 leading-relaxed bg-white border border-gray-100 p-3.5 rounded-xl text-xs">
                          {selectedLead.description || <span className="text-gray-400 italic">No description provided</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* System & SLA Status */}
                  <div className="p-5 bg-gray-50/70 border border-gray-100 rounded-2xl">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <Shield className="w-4 h-4 text-indigo-600" /> SLA & Matching
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-medium">Routing Flow:</span>
                        <span className="col-span-2 font-bold text-gray-800">{selectedLead.flow}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-medium">Preferred Time:</span>
                        <span className="col-span-2 font-semibold text-gray-700">{selectedLead.preferredTime}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-medium">Retry Count:</span>
                        <span className="col-span-2 font-mono font-bold text-gray-800">
                          {selectedLead.retryCount ?? 0} / 3
                          {(selectedLead.retryCount ?? 0) >= 3 && (
                            <span className="text-xs text-rose-600 block mt-1 font-sans font-normal leading-normal">
                              ⚠️ Manual Handling: Somebody from our team will assign a lawyer manually.
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-medium">SLA Status:</span>
                        <span className="col-span-2">
                          {selectedLead.slaStatus ? getSlaStatusBadge(selectedLead) : <span className="font-mono text-xs text-gray-400">NONE</span>}
                        </span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-medium">Payment Status:</span>
                        <span className="col-span-2">
                          {selectedLead.booking?.payment?.status === 'captured' || selectedLead.booking?.status === 'CONFIRMED' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                              PAID
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
                              PAYMENT PENDING
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Relations data (Lawyers, Calls, Payments) */}
                <div className="space-y-6">
                  {/* Assigned Lawyer */}
                  <div className="p-5 bg-gray-50/70 border border-gray-100 rounded-2xl">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <Award className="w-4 h-4 text-indigo-600" /> Assigned Advocate Details
                    </h4>
                    {selectedLead.lawyer ? (
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-3">
                          <span className="text-gray-400 font-medium">Advocate Name:</span>
                          <span className="col-span-2 text-gray-800 font-semibold">{selectedLead.lawyer.name || 'Onboarding Pending'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-gray-400 font-medium">Email Address:</span>
                          <span className="col-span-2 text-gray-800 font-semibold">{selectedLead.lawyer.email || selectedLead.lawyer.user?.email || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-gray-400 font-medium">Phone:</span>
                          <span className="col-span-2 text-gray-800 font-semibold">{selectedLead.lawyer.phone || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-gray-400 font-medium">Rating:</span>
                          <span className="col-span-2 text-amber-500 font-bold">★ {selectedLead.lawyer.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic py-2">No advocate assigned yet or lead is awaiting match.</p>
                    )}
                  </div>

                  {/* Exotel Call Routing */}
                  <div className="p-5 bg-gray-50/70 border border-gray-100 rounded-2xl">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <PhoneCall className="w-4 h-4 text-indigo-600" /> Call Log Registry (Exotel)
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-medium">Call SID:</span>
                        <span className="col-span-2 font-mono text-xs text-gray-700 truncate block">{selectedLead.callSid || 'No calls placed'}</span>
                      </div>
                      {selectedLead.recordingUrl && (
                        <div className="flex flex-col gap-2.5 pt-2">
                          <span className="text-gray-400 font-medium flex items-center gap-1.5">
                            <Volume2 className="w-4 h-4 text-green-600 animate-pulse" /> Play Call Recording:
                          </span>
                          <audio controls className="w-full h-9 rounded-lg" src={selectedLead.recordingUrl}>
                            Your browser does not support the audio player.
                          </audio>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resolution & Client Feedback */}
                  <div className="p-5 bg-gray-50/70 border border-gray-100 rounded-2xl">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <CheckSquare className="w-4 h-4 text-indigo-600" /> Resolution & Feedback
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-3">
                        <span className="text-gray-400 font-medium">Resolution:</span>
                        <span className="col-span-2"><span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          selectedLead.lawyerResolution === 'CLOSED' ? 'bg-green-100 text-green-800' :
                          selectedLead.lawyerResolution === 'FORWARDED' ? 'bg-blue-100 text-blue-800' :
                          selectedLead.lawyerResolution === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>{selectedLead.lawyerResolution || 'PENDING'}</span></span>
                      </div>
                      {selectedLead.feedbackRating !== null && selectedLead.feedbackRating !== undefined && (
                        <div className="grid grid-cols-3">
                          <span className="text-gray-400 font-medium">Client Rating:</span>
                          <span className="col-span-2 text-amber-500 font-bold">{'★'.repeat(selectedLead.feedbackRating)}{'☆'.repeat(5 - selectedLead.feedbackRating)}</span>
                        </div>
                      )}
                      {selectedLead.feedbackText && (
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-gray-400 font-medium">Client Comments:</span>
                          <p className="text-gray-600 bg-white border border-gray-100 p-3 rounded-xl text-xs leading-relaxed italic">"{selectedLead.feedbackText}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw JSON Debugging View */}
              <div className="mt-8 border-t border-gray-100 pt-6">
                <button 
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  {showRawJson ? 'Hide Raw JSON' : 'Show Raw Database JSON'}
                </button>
                
                {showRawJson && (
                  <pre className="mt-4 p-4 bg-gray-905 bg-[#1e293b] text-emerald-400 rounded-2xl text-xs overflow-x-auto max-h-60 font-mono shadow-inner">
                    {JSON.stringify(selectedLead, null, 2)}
                  </pre>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
