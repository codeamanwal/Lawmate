import { ArrowLeft, CheckCircle2, MessageCircle, Clock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 flex flex-col items-center py-12 px-6">
      <div className="max-w-4xl w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 font-semibold mb-8 hover:underline">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">How LawMate Works</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We've simplified the process of finding and consulting with top legal experts in India. 
            Get connected in just 4 simple steps.
          </p>
        </div>

        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
          
          {/* Step 1 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="font-bold">1</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><MessageCircle className="w-5 h-5" /></div>
                <h3 className="text-xl font-bold text-gray-900">Tell us your issue</h3>
              </div>
              <p className="text-gray-600">Answer a few simple questions about your legal situation (e.g. Property, Divorce, Civil) so we understand what you need.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="font-bold">2</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Shield className="w-5 h-5" /></div>
                <h3 className="text-xl font-bold text-gray-900">Instant Verification & Matching</h3>
              </div>
              <p className="text-gray-600">Login securely via mobile OTP. Our smart engine instantly matches you with a verified legal expert specialized in your case category.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-amber-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="font-bold">3</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
                <h3 className="text-xl font-bold text-gray-900">Secure Payment</h3>
              </div>
              <p className="text-gray-600">Complete a flat ₹999 payment securely via Razorpay (Cards, UPI, Netbanking). No hidden fees or monthly costs.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="font-bold">4</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><Clock className="w-5 h-5" /></div>
                <h3 className="text-xl font-bold text-gray-900">Connect in 30 Mins</h3>
              </div>
              <p className="text-gray-600">You will receive a notification via WhatsApp. Your assigned lawyer will contact you within the next 30 minutes to discuss your case.</p>
            </div>
          </div>

        </div>
        
        <div className="mt-16 text-center">
          <button 
            onClick={() => navigate('/get-started')}
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Start Your Case Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
