import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Calendar, MapPin, Phone, CreditCard, Star, Clock, Trash2, X, Zap, Loader2, AlertCircle } from 'lucide-react';

import axios from 'axios';
import toast from 'react-hot-toast';
import { CONSULTATION_FEE } from '../config/constants';


const Dashboard = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Flow 4 Client states
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    category: '',
    city: '',
    description: ''
  });

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/leads/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLeads(response.data);
    } catch (error) {
      console.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchLeads();
      const interval = setInterval(fetchLeads, 5000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading, navigate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this case?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/leads/${id}`);
      setLeads(leads.filter(l => l.id !== id));
      toast.success('Case deleted');
    } catch (error) {
      toast.error('Failed to delete case');
    }
  };

  // Flow 4: Create Emergency Case → payment page
  const handleEmergencyCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyForm.category || !emergencyForm.city) {
      toast.error('Please fill all required fields.');
      return;
    }
    setEmergencyLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/leads`,
        {
          fullName: user?.name || '',
          phone: user?.phone || '',
          city: emergencyForm.city,
          category: emergencyForm.category,
          description: emergencyForm.description || 'Emergency legal helpline consultation request.',
          preferredTime: 'Emergency', // Flow 4
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'x-user-id': user?.id,
          },
        }
      );
      setEmergencyModalOpen(false);
      setEmergencyForm({ category: '', city: '', description: '' });
      toast.success('Emergency case created! Proceeding to payment...');
      navigate('/payment', { state: { leadId: response.data.id } });
    } catch (error) {
      toast.error('Failed to create emergency case. Please try again.');
    } finally {
      setEmergencyLoading(false);
    }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[calc(100vh-76px)]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-500 font-medium">Manage your legal consultations and case history</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 flex-1">
              <div className="bg-green-100 p-2 rounded-lg text-green-600 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Mobile</p>
                <p className="font-bold text-gray-800 break-all truncate text-sm sm:text-base">{user?.phone}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 flex-1">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">City</p>
                <p className="font-bold text-gray-800 truncate text-sm sm:text-base">{user?.city || 'Not Set'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <button 
            onClick={() => navigate('/edit-profile')}
            className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors border border-indigo-100 shadow-sm"
          >
            Edit Profile
          </button>
          <button 
            onClick={logout}
            className="px-6 py-2 bg-white text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors border border-red-100 shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Active Cases/Leads */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-indigo-600" /> My Cases
            </h2>
            <button 
              onClick={() => navigate('/get-started')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-sm flex items-center gap-2"
            >
              + Start New Case
            </button>
          </div>
          
          {leads.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
              <p className="text-gray-400 mb-6">No active cases found</p>
              <button 
                onClick={() => navigate('/get-started')}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                Start New Case
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => {
                const isPaid = lead.booking?.payment?.status === 'captured' || lead.booking?.status === 'CONFIRMED' || lead.status === 'ASSIGNED' || lead.status === 'COMPLETED';
                const isCompleted = lead.status === 'COMPLETED';

                return (
                  <div 
                    key={lead.id} 
                    onClick={() => navigate('/my-bookings', { state: { highlightLeadId: lead.id } })}
                    className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 hover:ring-2 hover:ring-indigo-100/50 transition-all cursor-pointer text-left"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1 block">{lead.category}</span>
                        <h3 className="text-xl font-bold text-gray-900">{lead.description.substring(0, 50)}...</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {isCompleted ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 tracking-wider">Completed</span>
                        ) : isPaid ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 tracking-wider">Booked</span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 tracking-wider">Payment Pending</span>
                        )}
                        
                        {(() => {
                          const time = (lead.preferredTime || '').toLowerCase();
                          const isLater = time.includes('later');
                          if (time.includes('callback')) {
                            return (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-100 tracking-wider">
                                {isLater ? 'Callback (Later Today)' : 'Callback (60mins)'}
                              </span>
                            );
                          }
                          if (time.includes('emergency')) {
                            return (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-700 border border-red-100 tracking-wider">
                                {isLater ? 'Emergency - SLA (Later Today)' : 'Emergency - SLA (60mins)'}
                              </span>
                            );
                          }
                          if (time.includes('asap')) {
                            return (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-100 tracking-wider">
                                Flow 2: 60 Min
                              </span>
                            );
                          }
                          return (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-50 text-green-700 border border-green-100 tracking-wider">
                              Flow 3: Same Day
                            </span>
                          );
                        })()}

                        {lead.lawyerResolution && (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            lead.lawyerResolution === 'CANCELLED' 
                              ? 'bg-red-100 text-red-700' 
                              : lead.lawyerResolution === 'FORWARDED'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {lead.lawyerResolution === 'CLOSED' ? 'Closed' : lead.lawyerResolution}
                          </span>
                        )}
                        
                        {/* Delete icon only shown if NOT yet paid */}
                        {!isPaid && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(lead.id);
                            }}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-tighter text-gray-400 mb-6">
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(lead.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {(() => {
                        const time = (lead.preferredTime || '').toLowerCase();
                        return (time.includes('asap') || (time.includes('emergency') && !time.includes('later')) || (time.includes('callback') && !time.includes('later'))) ? 'Within 60 mins' : 'Later Today';
                      })()}</span>
                    </div>
                    
                    {(() => {
                      const showLawyer = lead.lawyer && isPaid && lead.status !== 'NEW';

                      if (showLawyer) {
                        return (
                          <div className="bg-gray-50 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 font-bold text-indigo-600 shrink-0 overflow-hidden">
                                {lead.lawyer.user?.photo ? (
                                  <img src={`${import.meta.env.VITE_API_URL}${lead.lawyer.user.photo}`} alt="Lawyer" className="w-full h-full object-cover" />
                                ) : (
                                   lead.lawyer.user?.name?.[0] || 'L'
                                )}
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Advocate Assigned</p>
                                <p className="font-bold text-gray-900">{lead.lawyer.user?.name}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {lead.lawyer.rating && lead.lawyer.rating > 0 ? lead.lawyer.rating.toFixed(1) : 'No Ratings'} • {lead.lawyer.experience} Years Exp</p>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="flex items-center justify-between">
                          {isPaid ? (
                            lead.slaStatus === 'NOT_ATTENDED' ? (
                              <p className="text-sm text-amber-600 font-bold flex items-center gap-1">
                                ⏳ Case handled manually ({(() => {
                                  const time = (lead.preferredTime || '').toLowerCase();
                                  return time.includes('later') 
                                    ? 'Somebody from our team will reach out within 24 hours.' 
                                    : 'Somebody from our team will reach out within an hour.';
                                })()})
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500 italic font-medium">Finding the best Advocate for you...</p>
                            )
                          ) : (
                            <p className="text-sm text-gray-500 italic font-medium">Payment is required to start matching...</p>
                          )}
                          {lead.status === 'NEW' && !isPaid && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/payment', { state: { leadId: lead.id } });
                              }}
                              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-sm cursor-pointer"
                            >
                              <CreditCard className="w-4 h-4" /> Pay & Consult
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Emergency Legal Helpline Banner */}
          <div className="overflow-hidden rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:border-gray-200/50 transition-all duration-300 relative group">
            <img 
              src="/Application-Image.jpeg" 
              alt="Emergency Legal Helpline Banner" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>

      {/* Flow 4 — Create Emergency Case Modal */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setEmergencyModalOpen(false); setEmergencyForm({ category: '', city: '', description: '' }); }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Create Emergency Case</h3>
                  <p className="text-xs text-red-600 font-bold">Emergency Legal Helpline · 60-Min SLA</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Get connected with a verified Advocate within 60 minutes for urgent legal matters.</p>
            </div>

            <form onSubmit={handleEmergencyCaseSubmit} className="space-y-4">
              {/* Name - read-only from profile */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>

              {/* Phone - read-only from profile */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+91</span>
                  <input
                    type="text"
                    value={user?.phone || ''}
                    readOnly
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City <span className="text-red-500">*</span></label>
                <select
                  value={emergencyForm.city}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, city: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/10 outline-none transition-all bg-white"
                >
                  <option value="">Select City</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Gautam Buddha Nagar">Gautam Buddha Nagar</option>
                  <option value="Ghaziabad">Ghaziabad</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Issue Category <span className="text-red-500">*</span></label>
                <select
                  value={emergencyForm.category}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, category: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/10 outline-none transition-all bg-white"
                >
                  <option value="">Select Category</option>
                  <option value="Family & Marriage">Family & Marriage</option>
                  <option value="Domestic Violence">Domestic Violence</option>
                  <option value="Property & Registry">Property & Registry</option>
                  <option value="Criminal & Police">Criminal & Police</option>
                  <option value="Supreme Court Lawyer">Supreme Court Advocate</option>
                  <option value="Cyber & Digital Fraud">Cyber & Digital Fraud</option>
                  <option value="Employment & HR">Employment & HR</option>
                  <option value="Consumer Complaints">Consumer Complaints</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brief Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={emergencyForm.description}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, description: e.target.value })}
                  rows={3}
                  placeholder="Briefly describe your emergency legal situation..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/10 outline-none transition-all resize-none"
                />
              </div>

              {/* Payment notice */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs font-semibold text-amber-700">A consultation fee of ₹{CONSULTATION_FEE} is required to activate the 60-min SLA and connect you with an expert Advocate.</p>
              </div>

              <button
                type="submit"
                disabled={emergencyLoading}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100"
              >
                {emergencyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> Create Case & Pay ₹{CONSULTATION_FEE}</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

