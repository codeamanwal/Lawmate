import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Calendar, MapPin, Phone, CreditCard, ChevronRight, Star, Clock, Trash2 } from 'lucide-react';

import axios from 'axios';
import toast from 'react-hot-toast';


const Dashboard = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

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

    if (user) fetchLeads();
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

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[calc(100vh-76px)]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-500 font-medium">Welcome back, {user?.name || user?.phone}</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="bg-green-100 p-2 rounded-lg text-green-600">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Mobile</p>
                <p className="font-bold text-gray-800">{user?.phone}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">City</p>
                <p className="font-bold text-gray-800">{user?.city || 'Not Set'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

      </div>

      <div className="grid lg:grid-cols-3 gap-10">
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
              {leads.map((lead) => (
                <div key={lead.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1 block">{lead.category}</span>
                      <h3 className="text-xl font-bold text-gray-900">{lead.description.substring(0, 50)}...</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.status === 'NEW' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {lead.status}
                      </span>
                      <button 
                        onClick={() => handleDelete(lead.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(lead.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {lead.preferredTime === 'ASAP' ? 'Within 60 mins' : 'Later Today'}</span>
                  </div>
                  
                  {lead.lawyer ? (
                    <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 font-bold text-indigo-600">
                          {lead.lawyer.user?.name?.[0] || 'L'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{lead.lawyer.user?.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {lead.lawyer.rating} • {lead.lawyer.experience} Years Exp</p>
                        </div>
                      </div>
                      <button className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:underline">
                        Contact Lawyer <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 italic">Finding the best lawyer for you...</p>
                      {lead.status === 'NEW' && (
                        <button 
                          onClick={() => navigate('/payment', { state: { leadId: lead.id } })}
                          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                        >
                          <CreditCard className="w-4 h-4" /> Pay & Consult
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Talk to a Lawyer Section */}
          <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
            <div className="relative z-10">
              <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                <Phone className="w-6 h-6 animate-pulse" /> Talk to a Lawyer
              </h2>
              <p className="text-emerald-50 text-sm mb-6 font-medium">Instantly connect with a verified legal expert for immediate advice.</p>
              <a 
                href="tel:7292002026"
                className="w-full py-4 bg-white text-emerald-600 rounded-xl font-black text-center block hover:bg-emerald-50 transition-all shadow-lg active:scale-95"
              >
                Call +91 7292002026
              </a>
            </div>
            {/* Background Decoration */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Subscription</h2>
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
            <h3 className="text-xl font-bold mb-2">Priority Plus</h3>
            <p className="text-indigo-100 text-sm mb-6">Get unlimited consultations and priority matching for 12 months.</p>
            <div className="text-3xl font-black mb-8">₹4,999<span className="text-lg font-normal opacity-70">/year</span></div>
            <button className="w-full py-4 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg">
              Upgrade Now
            </button>

          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Quick Support</h3>
            <p className="text-sm text-gray-500 mb-6">Need help with your booking? Our support team is available 24/7.</p>
            <button className="w-full py-3 border-2 border-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all">
              Chat with Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
