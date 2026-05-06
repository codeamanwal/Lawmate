import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const leadId = location.state?.leadId || localStorage.getItem('pendingLeadId');

  useEffect(() => {
    if (!leadId) {
      navigate('/get-started');
      return;
    }

    // Load Cal.com Script
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const Cal = (window as any).Cal;
      if (Cal) {
        Cal("init", { origin: "https://app.cal.com" });
        
        Cal("inline", {
          elementOrSelector: "#cal-inline",
          calLink: "sumitcodes",
          layout: "month_view"
        });

        Cal("ui", { 
          styles: { branding: { brandColor: "#4f46e5" } },
          hideEventTypeDetails: false,
          layout: "month_view"
        });

        // Listen for Success
        Cal("onAnyEvent", (e: any) => {
          if (e.detail.type === 'BOOKING_SUCCESSFUL') {
            toast.success('Consultation Scheduled!');
            setTimeout(() => {
              navigate('/payment', { state: { leadId } });
            }, 1500);
          }
        });

        setLoading(false);
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [leadId, navigate]);

  const handleSkip = async () => {
    try {
      // Mark as complete/booked immediately
      await axios.post(`${import.meta.env.VITE_API_URL}/api/leads/${leadId}/complete`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Consultation Scheduled!');
      navigate('/payment', { state: { leadId } });
    } catch (error) {
      console.error('Failed to auto-confirm booking', error);
      // Still navigate even if API fails to avoid blocking the user
      navigate('/payment', { state: { leadId } });
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CalendarIcon className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule your Consultation</h1>
          <p className="text-gray-500">Pick a slot that works for you via Cal.com.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[700px] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
          )}
          
          <div id="cal-inline" style={{ width: '100%', height: '700px', overflow: 'scroll' }}></div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-4 font-medium italic">Having trouble with the scheduler?</p>
          <button 
            onClick={handleSkip}
            className="px-8 py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 mx-auto"
          >
            Skip to Payment <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
