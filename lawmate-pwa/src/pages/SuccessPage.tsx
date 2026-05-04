
import { Link } from 'react-router-dom';
import { CheckCircle2, Phone, MessageCircle, ArrowRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const SuccessPage = () => {




  return (
    <div className="min-h-[calc(100vh-76px)] bg-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-green-100">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">Thank You!</h1>
          <p className="text-xl text-gray-600 mb-2">Your payment of ₹999 has been received.</p>
          <p className="text-gray-500 mb-12">Our team will connect you with a lawyer within 30 minutes.</p>

          <div className="bg-gray-50 rounded-3xl p-8 mb-10 border border-gray-100 text-left">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="bg-indigo-600 w-2 h-2 rounded-full"></span> Consultation Details
            </h3>
            <div className="grid gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Phone className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Call Mode</p>
                  <p className="font-bold text-gray-800">Phone Call / WhatsApp</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Instructions</p>
                  <p className="text-sm text-gray-600">You will receive a WhatsApp message shortly with the lawyer's contact details and meeting link.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/dashboard"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/"
              className="w-full py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
            >
              <Home className="w-5 h-5" /> Back to Home
            </Link>
          </div>
          
          <div className="mt-12 p-6 border-2 border-dashed border-indigo-100 rounded-2xl bg-indigo-50/30">
            <p className="text-sm text-indigo-700 font-medium">
              Join your consultation group: <a href="#" className="underline font-bold">WhatsApp Link</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SuccessPage;
