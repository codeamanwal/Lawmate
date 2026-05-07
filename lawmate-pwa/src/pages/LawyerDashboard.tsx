
import { useState } from 'react';
import { 
  Phone, 
  Clock, 
  Calendar, 
  DollarSign, 
  User, 
  Settings, 
  TrendingUp,
  Power,
  CheckCircle2,
  Loader2
} from 'lucide-react';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LawyerDashboard = () => {
  const { user, loading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('calls');
  const [isAvailable, setIsAvailable] = useState(true);

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
          }
        } catch (error) {
          console.error("Failed to refresh profile");
        }
      }
    };

    if (!loading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchProfile();
    }
  }, [user, loading, navigate, updateUser]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
    </div>
  );

  if (!user) return null;

  // Real-time Assignments (Waiting for backend integration)
  const calls: any[] = [];

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
      <div className="bg-white border-b border-gray-100 p-6 sticky top-0 z-30 shadow-sm">
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
              onClick={() => setIsAvailable(!isAvailable)}
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-black text-xs ${isAvailable ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}
            >
              <Power className="w-4 h-4" />
              {isAvailable ? 'Currently Available' : 'Currently Not Available'}
            </button>
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer border border-gray-100">
              <Settings className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Mobile Availability Toggle */}
        <div className="md:hidden mb-6">
          <button 
            onClick={() => setIsAvailable(!isAvailable)}
            className={`w-full flex items-center justify-between p-5 rounded-[24px] border-2 shadow-sm transition-all ${isAvailable ? 'bg-white border-emerald-500' : 'bg-white border-red-500'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl ${isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                <Power className="w-5 h-5" />
              </div>
              <span className="font-black text-gray-900">{isAvailable ? 'Active & Receiving Calls' : 'Currently Offline'}</span>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-all ${isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAvailable ? 'left-7' : 'left-1'}`} />
            </div>
          </button>
        </div>

        {/* Dashboard Tabs for Desktop */}
        <div className="hidden md:flex items-center gap-8 mb-8 border-b border-gray-200">
          {['calls', 'schedule', 'earnings', 'profile'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Tab Content: Calls */}
        {activeTab === 'calls' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-gray-900">Current Assignments</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <Clock className="w-4 h-4" /> Updated just now
              </div>
            </div>

            <div className="grid gap-4">
              {calls.length > 0 ? calls.map(call => (
                <div key={call.id} className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  {/* ... call item ... */}
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
                { label: 'Calls Today', value: '0', icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Rating', value: 'N/A', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Hours Spent', value: '0h', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map(stat => (
                <div key={stat.label} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
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
              <p className="mt-6 text-center text-gray-400 text-xs font-bold italic">Start accepting calls to see your revenue growth chart.</p>
            </div>
          </div>
        )}

        {/* Tab Content: Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm text-center">
              <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white font-black text-4xl mx-auto mb-6 shadow-xl shadow-indigo-100 border-4 border-white">
                {user?.name?.[0] || user?.fullName?.[0] || 'A'}
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">{user?.name || user?.fullName || 'Advocate'}</h2>
              <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-6">{user?.lawyerProfile?.licenseNumber || 'Verified Advocate'}</p>
              
              <div className="flex items-center justify-center gap-3">
                <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Profile Verified
                </span>
                <span className="px-4 py-2 bg-gray-50 text-gray-500 rounded-xl text-xs font-black uppercase">
                  ID: {user?.lawyerProfile?.licenseNumber?.split('/')?.[1] || 'Pending'}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h3 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-xs border-b border-gray-100 pb-4">Professional Details</h3>
              <div className="grid gap-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Introductory Bio</p>
                  <p className="text-sm font-bold text-gray-600 leading-relaxed italic">
                    "{user?.lawyerProfile?.bio || 'Professional legal consultant dedicated to providing expert advice.'}"
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Languages</p>
                    <p className="text-sm font-black text-gray-900">{user?.lawyerProfile?.languages?.join(', ') || 'English, Hindi'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Experience</p>
                    <p className="text-sm font-black text-gray-900">{user?.lawyerProfile?.experience || '0'}+ Years</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Practice Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {(user?.lawyerProfile?.categories || ['General Practice']).map((area: string) => (
                      <span key={area} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-2 flex items-center justify-around z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavItem id="calls" icon={Phone} label="Calls" />
        <NavItem id="schedule" icon={Calendar} label="Schedule" />
        <NavItem id="earnings" icon={DollarSign} label="Earnings" />
        <NavItem id="profile" icon={User} label="Profile" />
      </div>
    </div>
  );
};

export default LawyerDashboard;
