import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Phone, ChevronRight, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';
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
        
        // Filter only those that have a confirmed booking status
        const confirmedBookings = response.data.filter((lead: any) => lead.status === 'COMPLETED' || lead.status === 'ASSIGNED');
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
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-500 font-medium">You have {bookings.length} confirmed legal consultations</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h2>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">Start a new case to connect with a legal expert and schedule your consultation.</p>
          <button 
            onClick={() => navigate('/get-started')}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            Book your first session
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
              <div className="p-8">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </span>
                      <span className="text-sm font-bold text-gray-400">#{booking.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{booking.category} Case</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Fee Paid</p>
                    <p className="text-2xl font-black text-gray-900">₹999</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Scheduled Time</p>
                        <p className="font-bold text-gray-900">30 Min Consultation</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Jurisdiction</p>
                        <p className="font-bold text-gray-900">{booking.city}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Assigned Expert</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200 font-bold text-indigo-600 shadow-sm">
                        {booking.lawyer?.user?.name?.[0] || 'V'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{booking.lawyer?.user?.name || 'Adv. Vikram Singh'}</p>
                        <p className="text-xs text-gray-500 font-medium">High Court Advocate</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-50">
                  <button className="flex-grow py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    Join Video Call
                  </button>
                  <button className="px-8 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all">
                    View Details
                  </button>
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
