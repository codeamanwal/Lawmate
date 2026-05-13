import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2, Mail, Lock, ArrowLeft, User, Phone, MapPin, Gavel } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

type AuthStep = 'signin' | 'signin-client' | 'signin-lawyer' | 'signup-email' | 'signup-otp' | 'signup-password' | 'forgot-password' | 'forgot-password-otp' | 'forgot-password-new' | 'complete-profile';

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
  
  const { signupWithEmail, loginWithEmail, user, updateUser } = useAuth();
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
          if (user.role === 'LAWYER') {
            if (user.lawyerProfile?.onboardingCompleted) {
              navigate('/lawyer/dashboard');
            } else {
              navigate('/lawyer/onboarding');
            }
          } else {
            navigate('/dashboard');
          }
        }
      }
    }
  }, [user, navigate, location.state]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const role = step === 'signin-lawyer' ? 'LAWYER' : 'CLIENT';
    try {
      await loginWithEmail(email, password, role);
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
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email });
      toast.success('Reset code sent to your email!');
      setStep('forgot-password-otp');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter 6-digit code');
    setStep('forgot-password-new');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be 8+ characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        email,
        code: otp,
        newPassword: password
      });
      toast.success('Password updated! Please sign in.');
      setStep('signin');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
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
      navigate(user.role === 'LAWYER' ? '/lawyer/dashboard' : '/dashboard');
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-white flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            {step === 'complete-profile' ? <User className="w-10 h-10 text-indigo-600" /> : <Mail className="w-10 h-10 text-indigo-600" />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {step === 'signin' && 'Welcome Back'}
            {step === 'signup-email' && 'Create Account'}
            {step === 'signup-otp' && 'Verify Email'}
            {step === 'signup-password' && 'Set Password'}
             {step === 'forgot-password' && 'Reset Password'}
            {step === 'forgot-password-otp' && 'Verify Code'}
            {step === 'forgot-password-new' && 'New Password'}
            {step === 'complete-profile' && 'About You'}
          </h1>
          <p className="text-gray-500">
            {step === 'signin' && 'Sign in to access your legal dashboard'}
            {step === 'signup-email' && 'Start your journey with LawOnCall'}
            {step === 'signup-otp' && `Enter the 6-digit code sent to ${email}`}
            {step === 'signup-password' && 'Choose a strong password for your account'}
            {step === 'forgot-password' && 'Enter your email to receive a reset code'}
            {step === 'forgot-password-otp' && `Enter the code sent to ${email}`}
            {step === 'forgot-password-new' && 'Set a new secure password for your account'}
            {step === 'complete-profile' && 'Please provide a few more details to continue'}
          </p>
        </div>

        {/* Sign In Choice */}
        {step === 'signin' && (
          <div className="space-y-6">
            <div className="grid gap-4">
              <button 
                onClick={() => setStep('signin-client')}
                className="group p-4 sm:p-6 bg-white border-2 border-gray-100 rounded-[24px] hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Sign In as Client</h3>
                  <p className="text-sm text-gray-500 font-medium">I am looking for legal assistance</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-full group-hover:bg-indigo-50 transition-colors">
                  <User className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" />
                </div>
              </button>

              <button 
                onClick={() => setStep('signin-lawyer')}
                className="group p-4 sm:p-6 bg-white border-2 border-gray-100 rounded-[24px] hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Sign In as Advocate</h3>
                  <p className="text-sm text-gray-500 font-medium">I am a verified legal professional</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-full group-hover:bg-indigo-50 transition-colors">
                  <Gavel className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" />
                </div>
              </button>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500 font-bold mb-4">New to LawOnCall?</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setStep('signup-email')} 
                  className="py-3 px-4 bg-gray-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all border border-indigo-50"
                >
                  Join as Client
                </button>
                <Link 
                  to="/lawyer/register" 
                  className="py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 text-center flex items-center justify-center"
                >
                  Join as Advocate
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Client Sign In */}
        {step === 'signin-client' && (
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Client Email"
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
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Client Sign In'}
            </button>
            <button type="button" onClick={() => setStep('signin')} className="w-full flex items-center justify-center gap-2 text-gray-400 font-bold text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to choices
            </button>
          </form>
        )}

        {/* Lawyer Sign In */}
        {step === 'signin-lawyer' && (
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Advocate Email"
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
                  placeholder="Lawyer Password"
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
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Advocate Sign In'}
            </button>
            <button type="button" onClick={() => setStep('signin')} className="w-full flex items-center justify-center gap-2 text-gray-400 font-bold text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to choices
            </button>
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
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send Reset Code'}
            </button>
            <button type="button" onClick={() => setStep('signin')} className="w-full flex items-center justify-center gap-2 text-gray-500 font-semibold">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          </form>
        )}

        {step === 'forgot-password-otp' && (
          <form onSubmit={handleVerifyResetOtp} className="space-y-6">
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
              Continue
            </button>
            <button type="button" onClick={() => setStep('forgot-password')} className="w-full flex items-center justify-center gap-2 text-gray-500 font-semibold">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </form>
        )}

        {step === 'forgot-password-new' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
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
                  placeholder="Confirm New Password"
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all"
                  required
                />
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Reset Password'}
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
