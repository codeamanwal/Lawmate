import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

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

    // Load Calendly Widget Script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      setLoading(false);
    };

    // Listen for Calendly events
    const handleCalendlyEvent = (e: any) => {
      if (e.data.event && e.data.event === 'calendly.event_scheduled') {
        toast.success('Consultation Scheduled!');
        // Small delay before redirecting to payment
        setTimeout(() => {
          navigate('/payment', { state: { leadId } });
        }, 1500);
      }
    };

    window.addEventListener('message', handleCalendlyEvent);

    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
      document.body.removeChild(script);
    };
  }, [leadId, navigate]);

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CalendarIcon className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule your Consultation</h1>
          <p className="text-gray-500">Pick a 30-minute slot that works for you. Our experts are available 9 AM - 5 PM.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[700px] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
          )}
          
          {/* Calendly Inline Widget */}
          <div 
            className="calendly-inline-widget" 
            data-url="https://calendly.com/lawmate-consult/30min?hide_event_type_details=1&hide_gdpr_banner=1" 
            style={{ minWidth: '320px', height: '700px' }}
          />
        </div>

        {/* Fallback button in case Calendly events aren't caught */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-4 font-medium italic">Having trouble with the scheduler?</p>
          <button 
            onClick={() => navigate('/payment', { state: { leadId } })}
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
