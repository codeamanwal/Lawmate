import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const leadId = location.state?.leadId || localStorage.getItem('pendingLeadId');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user && !leadId) {
      navigate('/auth', { state: { from: location } });
      return;
    }

    if (!leadId) {
      navigate('/get-started');
      return;
    }

    setLoading(false);
  }, [leadId, navigate, user, authLoading]);

  const handlePayUPayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/payments/create-link`, 
        { 
          leadId,
          frontendUrl: window.location.origin,
          gatewayUrl: import.meta.env.VITE_API_URL || window.location.origin
        }, 
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'x-user-id': user?.id
          }
        }
      );
      
      if (response.data.redirect_url) {
        // Redirect to PayU checkout page
        window.location.href = response.data.redirect_url;
      } else {
        throw new Error('Failed to get redirect URL');
      }
    } catch (err) {
      console.error('Failed to initiate PayU payment', err);
      toast.error('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-10 text-center border border-gray-100 shadow-xl shadow-gray-200/50">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <ShieldCheck className="w-10 h-10 text-indigo-600" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Secure Checkout</h2>
        <p className="text-gray-500 mb-8 font-medium">Complete your ₹999 payment to lock in your expert legal consultation.</p>
 
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <span className="text-gray-500 font-medium">Consultation Fee</span>
            <span className="text-gray-900 font-bold">₹999</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-gray-900 font-black">Total to Pay</span>
            <span className="text-indigo-600 font-black">₹999</span>
          </div>
        </div>
 
        <button 
          onClick={handlePayUPayment}
          disabled={loading && !authLoading}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50 cursor-pointer"
        >
          {loading && !authLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm & Pay ₹999'}
        </button>
 
        <p className="mt-6 text-xs text-gray-400 font-medium flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure 256-bit SSL Encryption
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
