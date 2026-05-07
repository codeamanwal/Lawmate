
import { Link } from 'react-router-dom';
import { CheckCircle2, Calendar, ArrowRight, Home } from 'lucide-react';

const PaymentSuccess = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl shadow-gray-200/50 p-8 md:p-12 border border-gray-100 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-gray-500 font-medium mb-8">
          Your consultation has been confirmed. A verified legal expert will connect with you within 60 minutes.
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
