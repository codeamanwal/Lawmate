import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Calendar as CalendarIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leadDetails, setLeadDetails] = useState<any>(null);
  const leadId = location.state?.leadId || localStorage.getItem('pendingLeadId');

  useEffect(() => {
    if (!leadId) {
      navigate('/get-started');
      return;
    }

    const fetchLeadDetails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/leads/my`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const currentLead = response.data.find((l: any) => l.id === leadId);
        if (currentLead) setLeadDetails(currentLead);
      } catch (error) {
        console.error('Failed to fetch lead details');
      } finally {
        setLoading(false);
      }
    };

    const handleMessage = (e: MessageEvent) => {
      // LOGIC: Catch ANY message that contains 'bookingSuccessful'
      // This is the most aggressive way to ensure we don't miss the signal
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        const msgString = JSON.stringify(data).toLowerCase();
        
        if (msgString.includes('bookingsuccessful') || msgString.includes('cal:bookingsuccessful')) {
          toast.success('Consultation Scheduled!');
          setTimeout(() => {
            navigate('/payment', { state: { leadId } });
          }, 1000);
        }
      } catch (err) {
        // Fallback for non-JSON strings
        if (typeof e.data === 'string' && e.data.toLowerCase().includes('bookingsuccessful')) {
          toast.success('Consultation Scheduled!');
          setTimeout(() => {
            navigate('/payment', { state: { leadId } });
          }, 1000);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    fetchLeadDetails();

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [leadId, navigate]); // Ensuring latest version is pushed

  const handleSkip = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/leads/${leadId}/complete`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Consultation Confirmed!');
      navigate('/payment', { state: { leadId } });
    } catch (error) {
      navigate('/payment', { state: { leadId } });
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        {/* Case Summary Card */}
        {leadDetails && (
          <div className="bg-indigo-600 rounded-[32px] p-8 mb-10 text-white shadow-xl shadow-indigo-200 flex flex-wrap justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Consultation For</p>
                <h2 className="text-2xl font-black">{leadDetails.category} Case</h2>
                <p className="text-indigo-100 text-sm font-bold opacity-80">{leadDetails.city}, India</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/20">
              <p className="text-[10px] font-black uppercase tracking-tighter opacity-70 mb-1 text-center">Status</p>
              <p className="font-black text-sm uppercase tracking-widest">Awaiting Schedule</p>
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Schedule your Consultation</h1>
          <p className="text-gray-500 font-medium">Pick a slot that works for you via Cal.com.</p>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[600px] relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <iframe
              src="https://cal.com/sumitcodes/30min?embed=true"
              style={{ width: '100%', height: '600px', border: 'none' }}
              title="Schedule 30min Meeting"
              onLoad={() => setLoading(false)}
            />
          )}
        </div>

        <div className="mt-10 text-center space-y-4">
          <p className="text-sm text-gray-400 font-bold italic">Need help or want to pay first?</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleSkip}
              className="px-8 py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all flex items-center gap-2 group shadow-lg shadow-indigo-100/20"
            >
              Skip to Payment <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Safety Net: Appears only if they might have booked but didn't redirect */}
            <button 
              onClick={() => navigate('/payment', { state: { leadId } })}
              className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-xl shadow-emerald-100 animate-pulse"
            >
              I've Booked My Slot <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
