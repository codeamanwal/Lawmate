import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, ArrowRight, Home, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId') || localStorage.getItem('pendingLeadId');
  const [verifying, setVerifying] = useState(true);
  const [status, setStatus] = useState<'SUCCESS' | 'PENDING' | 'FAILED'>('PENDING');
  const [preferredTime, setPreferredTime] = useState<string | null>(null);
  const [flow, setFlow] = useState<string | null>(null);
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      if (!leadId) {
        setVerifying(false);
        return;
      }

      try {
        // Retry a few times if it's still pending
        let attempts = 0;
        const maxAttempts = 3;
        
        const check = async () => {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/payments/verify/${leadId}`);
          if (response.data.status === 'SUCCESS') {
            setStatus('SUCCESS');
            setPreferredTime(response.data.preferredTime);
            setFlow(response.data.flow);
            setVerifying(false);
            if (response.data.token && response.data.user) {
              loginWithToken(response.data.token, response.data.user);
            }
            toast.success('Payment verified!', { id: 'payment-verified' });

            if (response.data.flow === 'Flow 1' || response.data.flow === 'Flow 4') {
              toast.success('Redirecting to Admin Portal...', { id: 'admin-redirect' });
              setTimeout(() => {
                navigate('/admin');
              }, 2000);
            }
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(check, 3000); // Check again in 3 seconds
          } else {
            setVerifying(false);
          }
        };

        await check();
      } catch (error) {
        console.error('Verification failed', error);
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [leadId, navigate, loginWithToken]);

  const handleSimulateSuccess = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/payments/simulate-success/${leadId}`);
      toast.success('Simulation successful! Verifying status...');
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/payments/verify/${leadId}`);
      if (response.data.status === 'SUCCESS') {
        setStatus('SUCCESS');
        setPreferredTime(response.data.preferredTime);
        setFlow(response.data.flow);
        setVerifying(false);
        if (response.data.token && response.data.user) {
          loginWithToken(response.data.token, response.data.user);
        }
        toast.success('Payment verified!', { id: 'payment-verified' });

        if (response.data.flow === 'Flow 1' || response.data.flow === 'Flow 4') {
          toast.success('Redirecting to Admin Portal...', { id: 'admin-redirect' });
          setTimeout(() => {
            navigate('/admin');
          }, 2000);
        }
      }
    } catch (e) {
      toast.error('Simulation failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl shadow-gray-200/50 p-6 sm:p-8 md:p-12 border border-gray-100 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
          {verifying ? (
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          ) : status === 'SUCCESS' ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          ) : (
            <AlertCircle className="w-12 h-12 text-amber-500" />
          )}
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
          {verifying ? 'Verifying Payment...' : status === 'SUCCESS' ? 'Payment Successful!' : 'Payment Pending'}
        </h1>
        <p className="text-gray-500 font-medium mb-8">
          {verifying 
            ? 'Please wait while we confirm your transaction with PayU.' 
            : status === 'SUCCESS' 
              ? (preferredTime === 'LATER' 
                  ? 'Your consultation has been confirmed. A verified legal expert will connect with you within 24 hours.'
                  : 'Your consultation has been confirmed. A verified legal expert will connect with you within 60 minutes.')
              : 'We are waiting for PayU to confirm your payment. You can check your booking status in a few minutes.'}
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scheduled Time</p>
              <p className="text-sm font-bold text-gray-900">
                {verifying ? 'Retrieving details...' : (preferredTime === 'LATER' ? 'Today, Within 24 Hours' : 'Today, Within 60 Mins')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">₹</div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fee Paid</p>
              <p className="text-sm font-bold text-gray-900">₹999 (Inclusive of all taxes)</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {!verifying && status !== 'SUCCESS' && (
            <button 
              onClick={handleSimulateSuccess}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-amber-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              ⚙️ Simulate Payment Success
            </button>
          )}
          {flow === 'Flow 1' || flow === 'Flow 4' ? (
            <Link 
              to="/admin" 
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
            >
              Go to Admin Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link 
              to="/my-bookings" 
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
            >
              View My Bookings <ArrowRight className="w-5 h-5" />
            </Link>
          )}
          <Link 
            to="/" 
            className="w-full py-4 bg-white text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 border border-gray-100"
          >
            <Home className="w-5 h-5" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
