import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Calendar, ArrowRight, Home, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');
  const [verifying, setVerifying] = useState(true);
  const [status, setStatus] = useState<'SUCCESS' | 'PENDING' | 'FAILED'>('PENDING');

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
            setVerifying(false);
            toast.success('Payment verified!');
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
  }, [leadId]);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl shadow-gray-200/50 p-8 md:p-12 border border-gray-100 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
          {verifying ? (
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          ) : status === 'SUCCESS' ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          ) : (
            <AlertCircle className="w-12 h-12 text-amber-500" />
          )}
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-4">
          {verifying ? 'Verifying Payment...' : status === 'SUCCESS' ? 'Payment Successful!' : 'Payment Pending'}
        </h1>
        <p className="text-gray-500 font-medium mb-8">
          {verifying 
            ? 'Please wait while we confirm your transaction with PhonePe.' 
            : status === 'SUCCESS' 
              ? 'Your consultation has been confirmed. A verified legal expert will connect with you within 60 minutes.' 
              : 'We are waiting for PhonePe to confirm your payment. You can check your booking status in a few minutes.'}
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scheduled Time</p>
              <p className="text-sm font-bold text-gray-900">Today, Within 60 Mins</p>
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
          <Link 
            to="/my-bookings" 
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
          >
            View My Bookings <ArrowRight className="w-5 h-5" />
          </Link>
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
