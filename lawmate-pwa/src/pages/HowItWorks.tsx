import { ArrowLeft, CheckCircle2, MessageCircle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 flex flex-col items-center py-12 px-6">
      <div className="max-w-4xl w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 font-semibold mb-8 hover:underline">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="text-center mb-16 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-6">How LawOnCall Works</h1>
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
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Shield className="w-5 h-5" /></div>
                <h3 className="text-xl font-bold text-gray-900">Signup/Login</h3>
              </div>
              <p className="text-gray-600">Start your journey by verifying your <b>Email via OTP</b>. This creates your secure profile and allows you to track all your legal consultations.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="font-bold">2</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><MessageCircle className="w-5 h-5" /></div>
                <h3 className="text-xl font-bold text-gray-900">Case Intake</h3>
              </div>
              <p className="text-gray-600">Enter your <b>Name, Mobile Number, and City</b> and describe your legal situation. This helps us match you with the right verified expert.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <span className="font-bold">3</span>
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
                <h3 className="text-xl font-bold text-gray-900">Secure Payment</h3>
              </div>
              <p className="text-gray-600">Complete your safe and secure payment via PayU payment gateway. Once paid, your expert lawyer will connect with you within 60 minutes/same day.</p>
            </div>
          </div>

        </div>
        
        <div className="mt-20 bg-indigo-900 rounded-[32px] p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full filter blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">Ready to solve your legal issues?</h2>
            <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
              Our experts are online and ready to help. Join thousands of users who have solved their legal cases through LawOnCall.
            </p>
            <button 
              onClick={() => navigate('/auth', { state: { step: 'signup-email' } })}
              className="px-6 sm:px-10 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-base sm:text-lg hover:bg-indigo-50 transition-all shadow-xl flex items-center gap-2 mx-auto group"
            >
              Start Your Case Now
              <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
