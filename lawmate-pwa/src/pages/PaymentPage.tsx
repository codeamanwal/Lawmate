import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const leadId = location.state?.leadId || localStorage.getItem('pendingLeadId');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    if (!leadId) {
      navigate('/get-started');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return; // Wait for token to be available

    const createPayment = async () => {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/payments/create-link`, {
          leadId
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        const { short_url } = response.data;
        setPaymentUrl(short_url);
        setLoading(false);
        
        // Redirect after a short delay to give user control
        setTimeout(() => {
          if (window.location.pathname === '/payment') {
            window.location.href = short_url;
          }
        }, 2000);
      } catch (err: any) {
        console.error('Payment creation failed', err);
        setError('Payment link creation failed. Please retry.');
        toast.error('Failed to initiate payment');
        setLoading(false);
      }
    };

    createPayment();
  }, [leadId, navigate, user, authLoading]);

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-xl shadow-gray-200/50">
        {loading ? (
          <>
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Creating payment link...</h2>
            <p className="text-gray-500 mb-8">Please wait while we set up your secure checkout session. Do not refresh this page.</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 font-medium bg-gray-50 py-3 rounded-xl border border-gray-100">
              <ShieldCheck className="w-4 h-4 text-green-500" /> Powered by Razorpay
            </div>
          </>
        ) : error ? (
          <>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Failed</h2>
            <p className="text-gray-500 mb-8">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              Retry Payment
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShieldCheck className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Redirecting to Secure Payment...</h2>
            <p className="text-gray-500 mb-8 leading-relaxed text-sm">
              You are being securely redirected to Razorpay. <br/>
              If not redirected in 2 seconds, click the link below.
            </p>
            {paymentUrl && (
              <a 
                href={paymentUrl}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all mb-4 text-center"
              >
                Go to Razorpay
              </a>
            )}
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 font-bold hover:text-red-500 transition-colors text-sm"
            >
              Cancel & Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
