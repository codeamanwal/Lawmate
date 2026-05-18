import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    const fetchBookings = async () => {
      try {
        // We'll fetch from the leads endpoint which includes booking data
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/leads/my`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Filter only those that have a confirmed booking status or completed/assigned leads
        const confirmedBookings = response.data.filter((lead: any) => 
          lead.status === 'COMPLETED' || 
          lead.status === 'ASSIGNED' || 
          (lead.booking && (lead.booking.status === 'CONFIRMED' || lead.booking.status === 'COMPLETED'))
        );
        setBookings(confirmedBookings);
      } catch (error) {
        console.error('Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchBookings();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[calc(100vh-76px)]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-500 font-medium text-sm sm:text-base">You have {bookings.length} confirmed legal consultations</p>
      </div>

      {bookings.length === 0 ? (
        <div className="space-y-12">
          <div className="bg-white border border-gray-100 rounded-[32px] p-8 sm:p-16 text-center shadow-lg shadow-gray-200/40">
            <div className="bg-indigo-50 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Calendar className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">No Active Bookings</h2>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">Ready to discuss your case? Start a new case intake form to connect with verified legal experts instantly.</p>
            <button 
              onClick={() => navigate('/get-started')}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 cursor-pointer"
            >
              Start New Case
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/40 overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Confirmed
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">#{booking.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{booking.category} Case</h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fee Paid</p>
                    <p className="text-xl font-black text-gray-900">₹999</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Duration</p>
                        <p className="text-sm font-bold text-gray-900">60 Min Session</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Jurisdiction</p>
                        <p className="text-sm font-bold text-gray-900">{booking.city}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
