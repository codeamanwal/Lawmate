import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Phone, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const AuthPage = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const { sendOtp, verifyOtp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const fromIntake = location.state?.fromIntake;
      const pendingLeadId = localStorage.getItem('pendingLeadId');
      
      if (fromIntake && pendingLeadId) {
        navigate('/matching');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate, location.state]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return toast.error('Enter a valid 10-digit mobile number');
    }

    setLoading(true);
    try {
      const result = await sendOtp(`+91${phone}`);
      setConfirmationResult(result);
      setStep('otp');
      toast.success('OTP sent successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to send OTP. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP');

    setLoading(true);
    try {
      await verifyOtp(confirmationResult, otp);
      toast.success('OTP Verified. Securing session...');
      // Navigation is now handled by the useEffect watching the `user` state.
    } catch (error: any) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            {step === 'phone' ? <Phone className="w-10 h-10 text-indigo-600" /> : <ShieldCheck className="w-10 h-10 text-indigo-600" />}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'phone' ? 'Verify your phone' : 'Enter OTP'}
          </h1>
          <p className="text-gray-500">
            {step === 'phone' 
              ? 'We will send you a one-time password to verify your account' 
              : `We've sent a code to +91 ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Mobile number"
                className="w-full pl-16 pr-5 py-5 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all text-xl font-bold tracking-wider"
                autoFocus
              />
            </div>
            <button
              disabled={loading || phone.length !== 10}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Get OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="0 0 0 0 0 0"
              className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all text-center text-3xl font-black tracking-[1em]"
              autoFocus
            />
            <button
              disabled={loading || otp.length !== 6}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify & Continue'}
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full flex items-center justify-center gap-2 text-gray-500 font-semibold hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Change Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
