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
  ChevronRight,
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
      // Open phone dialer
      window.location.href = `tel:${phone}`;
      
      // Mark call as completed so it clears from the dashboard
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/leads/${callId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update UI instantly
      // Refresh the list to move the call to "Cases"
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/leads/lawyer-calls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalls(response.data);
    } catch (error) {
      console.error("Failed to complete call", error);
    }
  };

  const handleDeclineCall = async (callId: string) => {
    try {
      const token = localStorage.getItem('token');
      // For now, we'll just delete it or mark it completed
      await axios.post(`${import.meta.env.VITE_API_URL}/api/leads/${callId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalls(calls.filter(c => c.id !== callId));
    } catch (error) {
      console.error("Failed to decline call", error);
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
              {calls.filter(c => c.status === 'NEW').length > 0 ? calls.filter(c => c.status === 'NEW').map(call => (
                <div key={call.id} className="bg-white rounded-[28px] p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                    <div>
                      <h3 className="font-black text-gray-900 text-lg">{call.name}</h3>
                      <p className="text-gray-500 font-bold text-sm">{call.phone}</p>
                    </div>
                    {call.booking?.payment?.status === 'captured' ? (
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-sm">
                        <CreditCard className="w-3 h-3" /> Booked
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Waiting
                      </span>
                    )}
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
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 mb-2">All Cases</h2>
            <div className="grid gap-4">
              {calls.length > 0 ? calls.map(call => (
                <div key={call.id} className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${call.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {call.name[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900">{call.name}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{call.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${call.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {call.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                    </span>
                    <button className="p-2 text-gray-400 hover:text-indigo-600 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="bg-white rounded-[32px] p-12 border border-gray-100 text-center">
                   <p className="text-gray-400 font-bold">No cases found in your history.</p>
                </div>
              )}
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
    </div>
  );
};

export default LawyerDashboard;
