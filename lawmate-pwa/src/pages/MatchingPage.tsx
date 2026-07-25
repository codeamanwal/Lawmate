import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Star, ShieldCheck, MapPin, Briefcase, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CONSULTATION_FEE } from '../config/constants';

const MatchingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [matching, setMatching] = useState(true);
  
  const leadId = location.state?.leadId || localStorage.getItem('pendingLeadId');

  useEffect(() => {
    if (!leadId) {
      navigate('/get-started');
      return;
    }

    // Simulate the AI Matching engine searching the database
    const timer = setTimeout(() => {
      setMatching(false);
      toast.success('Perfect Match Found!');
    }, 2500);

    return () => clearTimeout(timer);
  }, [leadId, navigate]);

  const handleProceedToPayment = () => {
    navigate('/payment', { state: { leadId } });
  };

  if (matching) {
    return (
      <div className="min-h-[calc(100vh-76px)] bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-10 text-center border border-gray-100 shadow-xl shadow-gray-200/50">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Finding your legal expert...</h2>
          <p className="text-gray-500 mb-4">
            Our smart engine is scanning our network of verified lawyers to find the perfect match for your specific case.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-bold tracking-wide text-green-700 uppercase bg-green-100 rounded-full">
            Match Found!
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Your Legal Expert</h2>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl shadow-gray-200/50 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 bg-indigo-50 text-indigo-600 rounded-bl-3xl font-bold text-sm flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> Verified
          </div>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 text-center sm:text-left">
            <div className="w-24 h-24 bg-gray-200 rounded-2xl overflow-hidden border-4 border-gray-50 shadow-inner shrink-0">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256&h=256" alt="Lawyer" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Adv. Vikram Singh</h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 text-amber-500 font-bold text-sm mb-2">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <span className="text-gray-500 font-medium ml-1">(124 Consultations)</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">15+ Years Experience</p>
                <p className="text-sm">Specialized in your exact legal issue</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Delhi High Court</p>
                <p className="text-sm">Local jurisdiction expertise</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500 font-semibold">Consultation Fee</span>
              <span className="text-2xl font-black text-gray-900">₹{CONSULTATION_FEE}</span>
            </div>
            <p className="text-sm text-gray-500 text-right">Flat fee. No hidden charges.</p>
          </div>
        </div>

        <button 
          onClick={handleProceedToPayment}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-200"
        >
          Secure Booking & Pay <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-center text-gray-400 text-sm font-medium mt-4">
          <ShieldCheck className="w-4 h-4 inline mr-1" /> Payment secured by Razorpay
        </p>
      </motion.div>
    </div>
  );
};

export default MatchingPage;
