import { useState, useRef } from 'react';
import { 
  Phone, 
  Clock, 
  Calendar, 
  DollarSign, 
  User, 
  Settings, 
  TrendingUp,
  Power,
  Loader2,
  Briefcase,
  CreditCard
} from 'lucide-react';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LawyerDashboard = () => {
  const { user, loading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('calls');
  const [isAvailable, setIsAvailable] = useState(() => {
    return user?.lawyerProfile?.isAvailable !== false;
  });
  const [resolvingCall, setResolvingCall] = useState<any>(null);
  const [resolutionChoice, setResolutionChoice] = useState<'CLOSED' | 'CANCELLED' | 'FORWARDED'>('CLOSED');
  const [resolvingInProgress, setResolvingInProgress] = useState(false);

  const getFileUrl = (path: string | undefined) => {
    if (!path) return '#';
    if (path.startsWith('data:')) return path;
    return `${import.meta.env.VITE_API_URL}${path}`;
  };

  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profiles/lawyer/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.success) {
            updateUser(response.data.user);
            if (response.data.user.lawyerProfile) {
              setIsAvailable(response.data.user.lawyerProfile.isAvailable);
            }
          }
        } catch (error) {
          console.error("Failed to refresh profile");
        }
      }
    };

    
    if (!loading && !user) {
      navigate('/auth');
    } else if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetchProfile();
    }
  }, [user, loading, navigate, updateUser]);

  const handleToggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/profiles/lawyer/availability`,
        { isAvailable: nextState },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        updateUser({
          ...user,
          lawyerProfile: {
            ...user.lawyerProfile,
            isAvailable: response.data.isAvailable
          }
        });
        toast.success(nextState ? "You are now online!" : "You are now offline.");
      }
    } catch (error) {
      console.error("Failed to update availability in database", error);
      setIsAvailable(isAvailable);
      toast.error("Failed to update availability. Please try again.");
    }
  };

  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/leads/lawyer-calls`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCalls(response.data);
      } catch (error) {
        console.error("Failed to fetch calls");
      }
    };

    if (user && user.role === 'LAWYER') {
      fetchCalls();
      const interval = setInterval(fetchCalls, 5000); // Poll every 5s for demo
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleAcceptCall = async (callId: string, phone: string) => {
    try {
      const token = localStorage.getItem('token');
      // Mark as accepted in the backend
      await axios.post(`${import.meta.env.VITE_API_URL}/api/leads/${callId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Call request accepted!');
      
      // Open phone dialer
      window.location.href = `tel:${phone}`;
      
      // Switch tab to cases so they can resolve the call
      setActiveTab('cases');
      
      // Refresh the calls list
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/leads/lawyer-calls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalls(response.data);
    } catch (error) {
      console.error("Failed to accept call request", error);
      toast.error("Failed to accept call request.");
    }
  };

  const handleDeclineCall = async (callId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/leads/${callId}/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Call request declined.');
      setCalls(calls.filter(c => c.id !== callId));
    } catch (error) {
      console.error("Failed to decline call", error);
      toast.error("Failed to decline call.");
    }
  };

  const handleResolveCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingCall) return;
    setResolvingInProgress(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/leads/${resolvingCall.id}/resolve`, {
        resolution: resolutionChoice
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Case resolved successfully!');
      setResolvingCall(null);
      
      // Refresh list
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/leads/lawyer-calls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalls(response.data);
    } catch (error) {
      console.error("Failed to resolve case", error);
      toast.error("Failed to resolve case.");
    } finally {
      setResolvingInProgress(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
    </div>
  );

  if (!user) return null;

  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center gap-1 flex-1 py-2 transition-all ${activeTab === id ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <Icon className={`w-6 h-6 ${activeTab === id ? 'fill-indigo-50' : ''}`} />
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 p-4 sm:p-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
              {user?.name?.[0] || user?.fullName?.[0] || 'A'}
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{user?.name || user?.fullName || 'Advocate'}</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{user?.role === 'LAWYER' ? 'Verified Advocate' : 'User'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/lawyer/onboarding')}
              className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer border border-gray-100"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Availability Toggle (Beautiful Status Card for Both Desktop and Mobile) */}
        <div className="mb-6">
          <button 
            onClick={handleToggleAvailability}
            className={`w-full flex items-center justify-between p-5 rounded-[24px] border-2 shadow-sm transition-all cursor-pointer ${isAvailable ? 'bg-white border-emerald-500 shadow-emerald-50/50' : 'bg-white border-red-500 shadow-red-50/50'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl transition-colors ${isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                <Power className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="font-black text-gray-900 block text-base sm:text-lg">{isAvailable ? 'Active & Receiving Calls' : 'Currently Offline'}</span>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">{isAvailable ? 'Clients can request instant consultations' : 'Consultations are temporarily disabled'}</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-all shrink-0 ${isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAvailable ? 'left-7' : 'left-1'}`} />
            </div>
          </button>
        </div>

        {/* Dashboard Tabs for Desktop */}
        <div className="hidden md:flex items-center gap-8 mb-8 border-b border-gray-200">
          {['calls', 'cases', 'schedule', 'earnings', 'profile'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab === 'calls' ? 'requests' : tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Tab Content: Calls (New Assignments Only) */}
        {activeTab === 'calls' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-gray-900">Current Assignments</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <Clock className="w-4 h-4" /> Updated just now
              </div>
            </div>

            <div className="grid gap-4">
              {calls.filter(c => c.status === 'NEW' && c.lawyerId === user.lawyerProfile?.id).length > 0 ? calls.filter(c => c.status === 'NEW' && c.lawyerId === user.lawyerProfile?.id).map(call => (
                <div key={call.id} className="bg-white rounded-[28px] p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                    <div>
                      <h3 className="font-black text-gray-900 text-lg">{call.name}</h3>
                      <p className="text-gray-500 font-bold text-sm">{call.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.booking?.payment?.status === 'captured' ? (
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                          <CreditCard className="w-3 h-3" /> Booked
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Waiting
                        </span>
                      )}
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        #{call.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{call.category}</p>
                    <p className="text-sm font-medium text-gray-700 line-clamp-2">{call.description}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => handleAcceptCall(call.id, call.phone)}
                      className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                      Accept Call
                    </button>
                    <button 
                      onClick={() => handleDeclineCall(call.id)}
                      className="px-4 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )) : (
                <div className="bg-white rounded-[32px] p-12 border border-gray-100 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Phone className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">No new assignments</h3>
                  <p className="text-gray-500 font-medium max-w-xs mx-auto">You're all caught up! New consultation requests will appear here as they come in.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Cases (History & Active) */}
        {activeTab === 'cases' && (
          <div className="space-y-8">
            {/* 1. Active Cases (Assigned & In Progress) */}
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                Active Consultations
              </h2>
              <div className="grid gap-4">
                {calls.filter(c => c.status === 'ASSIGNED' && c.lawyerId === user.lawyerProfile?.id).length > 0 ? (
                  calls.filter(c => c.status === 'ASSIGNED' && c.lawyerId === user.lawyerProfile?.id).map(call => (
                    <div key={call.id} className="bg-white rounded-[28px] p-5 border border-indigo-100 shadow-lg shadow-indigo-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
                          {call.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-black text-gray-900 text-lg">{call.name}</h3>
                            <span className="text-[10px] font-bold text-gray-400">#{call.id.slice(0, 8)}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{call.category} • {call.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => window.location.href = `tel:${call.phone}`}
                          className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call Client
                        </button>
                        <button 
                          onClick={() => setResolvingCall(call)}
                          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                        >
                          Resolve Case
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-[24px] p-6 border border-gray-100 text-center text-gray-400 font-bold text-sm">
                    No active consultations at the moment.
                  </div>
                )}
              </div>
            </div>

            {/* 2. Completed Cases */}
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-4">Completed History</h2>
              <div className="grid gap-4">
                {calls.filter(c => c.status === 'COMPLETED' && c.lawyerId === user.lawyerProfile?.id).length > 0 ? (
                  calls.filter(c => c.status === 'COMPLETED' && c.lawyerId === user.lawyerProfile?.id).map(call => (
                    <div key={call.id} className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                            {call.name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-black text-gray-900">{call.name}</h3>
                              <span className="text-[10px] font-bold text-gray-400">#{call.id.slice(0, 8)}</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{call.category}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                          Completed
                        </span>
                      </div>
                      
                      {/* Resolution outcome selected by lawyer */}
                      {call.lawyerResolution && (
                        <div className="bg-gray-50/70 rounded-xl px-4 py-2 text-xs font-bold text-gray-500 mb-3 flex items-center gap-1.5">
                          Resolution: <span className="text-indigo-600 uppercase tracking-wider">{call.lawyerResolution}</span>
                        </div>
                      )}

                      {/* Client feedback rating and text */}
                      {call.feedbackRating !== null && (
                        <div className="border-t border-gray-100 pt-3 mt-2">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-bold text-gray-400">Client Rating:</span>
                            <span className="text-amber-500 font-black text-sm">★ {call.feedbackRating}/5</span>
                          </div>
                          {call.feedbackText && (
                            <p className="text-xs text-gray-600 italic font-medium">"{call.feedbackText}"</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-[24px] p-6 border border-gray-100 text-center text-gray-400 font-bold text-sm">
                    No completed consultation history.
                  </div>
                )}
              </div>
            </div>

            {/* 3. Cases Not Attended (SLA Missed) */}
            <div>
              <h2 className="text-xl font-black text-red-600 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                Cases Not Attended (SLA Missed)
              </h2>
              <div className="grid gap-4">
                {calls.filter(c => c.declinedLawyerIds?.includes(user.lawyerProfile?.id) && c.slaStatus === 'NOT_ATTENDED').length > 0 ? (
                  calls.filter(c => c.declinedLawyerIds?.includes(user.lawyerProfile?.id) && c.slaStatus === 'NOT_ATTENDED').map(call => (
                    <div key={call.id} className="bg-red-50/30 rounded-[28px] p-5 border border-red-100 shadow-sm flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black">
                          {call.name[0]}
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900">{call.name}</h3>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{call.category}</p>
                          <span className="text-[10px] font-black text-red-600 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full mt-1 inline-block">SLA Timeout (Not Attended)</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-[24px] p-6 border border-gray-100 text-center text-gray-400 font-bold text-sm">
                    No missed SLA consultation records. Keep it up!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Schedule */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-gray-900">Your Schedule</h2>
              <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all">
                Open Calendar
              </button>
            </div>
            <div className="bg-white rounded-[32px] p-12 border border-gray-100 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Calendar className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No upcoming calls</h3>
              <p className="text-gray-500 font-medium max-w-xs mx-auto">Your schedule is currently clear. Confirmed bookings will appear here.</p>
            </div>
          </div>
        )}

        {/* Tab Content: Earnings */}
        {activeTab === 'earnings' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'This Month', value: '₹0', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Requests Today', value: '0', icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Rating', value: 'N/A', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Hours Spent', value: '0h', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map(stat => (
                <div key={stat.label} className="bg-white p-4 sm:p-6 rounded-[28px] border border-gray-100 shadow-sm">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-xl font-black text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" /> Revenue Insight
              </h3>
              <div className="h-64 bg-gray-50 rounded-2xl flex items-end justify-between p-6 gap-2">
                {[0, 0, 0, 0, 0, 0, 0].map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full bg-gray-200 rounded-lg h-[2px]"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Day {i+1}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-gray-400 text-xs font-bold italic">Start accepting requests to see your revenue growth chart.</p>
            </div>
          </div>
        )}

        {/* Tab Content: Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm text-center">
              <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white font-black text-4xl mx-auto mb-6 shadow-xl shadow-indigo-100 border-4 border-white overflow-hidden">
                {user?.lawyerProfile?.photo ? (
                  <img 
                    src={getFileUrl(user.lawyerProfile.photo)} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.[0] || user?.fullName?.[0] || 'A'
                )}
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">{user?.name || user?.fullName || 'Advocate'}</h2>
              <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-6">{user?.lawyerProfile?.licenseNumber || 'Verified Advocate'}</p>
              
              <div className="flex items-center justify-center gap-3">
                <span className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-black uppercase flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Pending for Review
                </span>
                <span className="px-4 py-2 bg-gray-50 text-gray-500 rounded-xl text-xs font-black uppercase">
                  ID: {user?.lawyerProfile?.licenseNumber || 'Not Provided'}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Professional Details</h3>
                <button 
                  onClick={() => navigate('/lawyer/onboarding')}
                  className="text-indigo-600 text-[10px] font-black uppercase hover:underline"
                >
                  Edit Details
                </button>
              </div>
              <div className="grid gap-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Introductory Bio</p>
                  <p className="text-sm font-bold text-gray-600 leading-relaxed italic">
                    "{user?.lawyerProfile?.bio || 'No bio provided.'}"
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Languages</p>
                    <p className="text-sm font-black text-gray-900">{user?.lawyerProfile?.languages?.join(', ') || 'Not Provided'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Experience</p>
                    <p className="text-sm font-black text-gray-900">{user?.lawyerProfile?.experience || '0'} Years</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Practice Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {user?.lawyerProfile?.categories?.map((area: string) => (
                      <span key={area} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">
                        {area}
                      </span>
                    )) || <span className="text-xs text-gray-400">None selected</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-2 flex items-center justify-around z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavItem id="calls" icon={Phone} label="Requests" />
        <NavItem id="cases" icon={Briefcase} label="Cases" />
        <NavItem id="schedule" icon={Calendar} label="Schedule" />
        <NavItem id="earnings" icon={DollarSign} label="Earnings" />
        <NavItem id="profile" icon={User} label="Profile" />
      </div>

      {/* Resolution Modal */}
      {resolvingCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Resolve Consultation</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">Select the final resolution status for your call with <span className="text-gray-900 font-bold">{resolvingCall.name}</span>.</p>

            <form onSubmit={handleResolveCase} className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resolution Outcome</p>
                <div className="grid gap-3">
                  {[
                    { id: 'CLOSED', title: 'Mark as Completed / Closed', desc: 'Call successfully completed and case is resolved.' },
                    { id: 'CANCELLED', title: 'Mark as Cancelled', desc: 'Client requested cancellation or call was aborted.' },
                    { id: 'FORWARDED', title: 'Mark as Forwarded', desc: 'Recommended client to another expert/department.' }
                  ].map(opt => (
                    <label 
                      key={opt.id}
                      className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${resolutionChoice === opt.id ? 'border-indigo-600 bg-indigo-50/20' : 'border-gray-100 bg-gray-50 hover:bg-gray-100/50'}`}
                    >
                      <input 
                        type="radio" 
                        name="resolution" 
                        value={opt.id}
                        checked={resolutionChoice === opt.id}
                        onChange={() => setResolutionChoice(opt.id as any)}
                        className="mt-1 accent-indigo-600 cursor-pointer"
                      />
                      <div className="text-left">
                        <span className="block font-black text-gray-900 text-sm">{opt.title}</span>
                        <span className="block text-xs font-medium text-gray-500 mt-0.5">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setResolvingCall(null)}
                  disabled={resolvingInProgress}
                  className="flex-1 py-3.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all rounded-xl font-bold text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={resolvingInProgress}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 transition-all text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  {resolvingInProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Resolve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawyerDashboard;
