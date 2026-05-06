import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Mail, Lock, ArrowLeft, User, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

type AuthStep = 'signin' | 'signup-email' | 'signup-otp' | 'signup-password' | 'forgot-password' | 'complete-profile';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  
  const [step, setStep] = useState<AuthStep>('signin');
  const [loading, setLoading] = useState(false);
  
  const { signupWithEmail, loginWithEmail, forgotPassword, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      // If user is logged in but missing profile info, show complete-profile
      if (!user.name || !user.phone || !user.city) {
        setStep('complete-profile');
      } else {
        const fromIntake = location.state?.fromIntake;
        const pendingLeadId = localStorage.getItem('pendingLeadId');
        
        if (fromIntake && pendingLeadId) {
          navigate('/booking');
        } else {
          navigate('/dashboard');
        }
      }
    }
  }, [user, navigate, location.state]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success('Signed in successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return toast.error('Enter a valid email');
    
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, { email });
      setStep('signup-otp');
      toast.success('Verification code sent to your email!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP');
    
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, { email, code: otp });
      toast.success('Email verified!');
      setStep('signup-password');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    
    setLoading(true);
    try {
      await signupWithEmail(email, password);
      toast.success('Account created! Please complete your profile.');
      setStep('complete-profile');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success('Reset link sent to your email!');
      setStep('signin');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !city) return toast.error('All fields are required');
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error('Enter valid 10-digit phone');

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/profiles/update`, {
        name, phone, city
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      updateUser({ name, phone, city });
      toast.success('Profile completed!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            {step === 'complete-profile' ? <User className="w-10 h-10 text-indigo-600" /> : <Mail className="w-10 h-10 text-indigo-600" />}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'signin' && 'Welcome Back'}
            {step === 'signup-email' && 'Create Account'}
            {step === 'signup-otp' && 'Verify Email'}
            {step === 'signup-password' && 'Set Password'}
            {step === 'forgot-password' && 'Reset Password'}
            {step === 'complete-profile' && 'About You'}
          </h1>
          <p className="text-gray-500">
            {step === 'signin' && 'Sign in to access your legal dashboard'}
            {step === 'signup-email' && 'Start your journey with LawMate'}
            {step === 'signup-otp' && `Enter the 6-digit code sent to ${email}`}
            {step === 'signup-password' && 'Choose a strong password for your account'}
            {step === 'forgot-password' && 'We will send you a link to reset your password'}
            {step === 'complete-profile' && 'Please provide a few more details to continue'}
          </p>
        </div>

        {/* Forms */}
        {step === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setStep('forgot-password')} className="text-sm font-semibold text-indigo-600 hover:underline">
                Forgot Password?
              </button>
            </div>
            <button
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sign In'}
            </button>
            <p className="text-center text-gray-500">
              Don't have an account?{' '}
              <button type="button" onClick={() => setStep('signup-email')} className="text-indigo-600 font-bold hover:underline">
                Sign Up
              </button>
            </p>
          </form>
        )}

        {step === 'signup-email' && (
          <form onSubmit={handleSignupEmail} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email Address"
                className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                required
              />
            </div>
            <button
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send OTP'}
            </button>
            <button type="button" onClick={() => setStep('signin')} className="w-full flex items-center justify-center gap-2 text-gray-500 font-semibold">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          </form>
        )}

        {step === 'signup-otp' && (
          <form onSubmit={handleSignupOtp} className="space-y-6">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="0 0 0 0 0 0"
              className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all text-center text-3xl font-black tracking-[1em]"
              autoFocus
              required
            />
            <button
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify OTP'}
            </button>
            <button type="button" onClick={() => setStep('signup-email')} className="w-full flex items-center justify-center gap-2 text-gray-500 font-semibold">
              <ArrowLeft className="w-4 h-4" /> Change Email
            </button>
          </form>
        )}

        {step === 'signup-password' && (
          <form onSubmit={handleSignupPassword} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create Password"
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                  required
                />
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        )}

        {step === 'forgot-password' && (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email Address"
                className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                required
              />
            </div>
            <button
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send Reset Link'}
            </button>
            <button type="button" onClick={() => setStep('signin')} className="w-full flex items-center justify-center gap-2 text-gray-500 font-semibold">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          </form>
        )}

        {step === 'complete-profile' && (
          <form onSubmit={handleCompleteProfile} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Mobile Number"
                  className="w-full pl-24 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                  required
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Select City</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Gautam Buddha Nagar">Gautam Buddha Nagar</option>
                  <option value="Ghaziabad">Ghaziabad</option>
                </select>
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Complete Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
