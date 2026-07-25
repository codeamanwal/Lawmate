import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Home, Phone, MessageCircle } from 'lucide-react';

const SuccessPage = () => {
  const navigate = useNavigate();

  // Leads remain NEW in the SLA matchmaker and are completed only by lawyers on active consultation resolution.

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-10 text-center border border-gray-100 shadow-2xl shadow-indigo-100/50"
      >
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">Thank You!</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Your payment of <span className="font-bold text-gray-900">₹500</span> is received. Our team will connect you with a lawyer <span className="text-indigo-600 font-bold">within 60 minutes</span>.
        </p>

        <div className="space-y-4 mb-10 text-left bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-4 text-sm">
            <Phone className="w-4 h-4 text-indigo-600" />
            <div>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Call Mode</p>
              <p className="font-bold text-gray-900">WhatsApp or Phone</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <MessageCircle className="w-4 h-4 text-indigo-600" />
            <div>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Consultation Window</p>
              <p className="font-bold text-gray-900">Within 60 min</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Home className="w-5 h-5" /> Return to Dashboard
        </button>
      </motion.div>
    </div>
  );
};

export default SuccessPage;
