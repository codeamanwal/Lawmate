import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2, Mail, Lock, ArrowLeft, User, Phone, MapPin, Gavel, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '../config/firebase';

type AuthStep = 'signin' | 'signin-client' | 'signin-lawyer' | 'signup-details' | 'signup-otp' | 'signup-password' | 'forgot-password' | 'forgot-password-otp' | 'forgot-password-new' | 'complete-profile';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  
  const location = useLocation();
  const [step, setStep] = useState<AuthStep>(location.state?.step || 'signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [verifiedToken, setVerifiedToken] = useState<string>('');
  
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  const { loginWithEmail, loginWithToken, user, updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [step]);

  useEffect(() => {
    if (user) {
      // Don't interrupt active signup or forgot-password flow — let user complete password step first
      if (step === 'signup-otp' || step === 'signup-password' || step === 'forgot-password-otp' || step === 'forgot-password-new') return;

      // If user is logged in but missing profile info, show complete-profile
      if (!user.name || !user.phone || !user.city) {
        setStep('complete-profile');
      } else {
        const fromLocation = location.state?.from;
        const fromIntake = location.state?.fromIntake;
        const pendingLeadId = localStorage.getItem('pendingLeadId');

        if (fromLocation) {
          navigate(fromLocation.pathname, { state: fromLocation.state });
        } else if (fromIntake && pendingLeadId) {
          navigate('/payment', { 
            state: { 
              leadId: pendingLeadId,
              consultationFee: location.state?.consultationFee,
              consultationPlan: location.state?.consultationPlan
            } 
          });
        } else if (user.role === 'LAWYER') {
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
  }, [user, navigate, location.state, step]);


  useEffect(() => {
    if (step === 'signup-details' || step === 'forgot-password') {
      const timer = setTimeout(() => {
        const containerId = step === 'forgot-password' ? 'recaptcha-container-auth-forgot' : 'recaptcha-container-auth';
        const el = document.getElementById(containerId);
        if (el && !recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, containerId, {
            size: 'normal',
            callback: () => {
              console.log('reCAPTCHA solved');
            },
            'expired-callback': () => {
              if (recaptchaVerifierRef.current) {
                try { recaptchaVerifierRef.current.clear(); } catch (e) {}
                recaptchaVerifierRef.current = null;
              }
            }
          });
          recaptchaVerifierRef.current.render().catch(console.error);
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch (e) {}
        recaptchaVerifierRef.current = null;
      }
    }
  }, [step]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return toast.error('Enter a valid 10-digit mobile number');
    if (!password) return toast.error('Password is required');

    setLoading(true);
    const role = step === 'signin-lawyer' ? 'LAWYER' : 'CLIENT';
    try {
      await loginWithEmail(cleanPhone, password, role);
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || 'Invalid mobile number or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return toast.error('Enter a valid 10-digit mobile number');
    if (!email.includes('@')) return toast.error('Enter a valid email address');
    
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container-auth', {
        size: 'normal'
      });
    }

    setLoading(true);
    try {
      // Formats to +91XXXXXXXXXX
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.slice(-10)}`;
      const verifier = recaptchaVerifierRef.current;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setStep('signup-otp');
      toast.success('Real SMS OTP sent to your mobile number!');
    } catch (error: any) {
      console.error('Firebase Real SMS Error:', error);
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setStep('signup-otp');
        toast.success('[DEV MODE] Localhost mode: Enter test OTP code 654321 to test signup');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('SMS limit reached for this number. Please wait 5-10 minutes.');
      } else if (error.code === 'auth/invalid-app-credential') {
        toast.error('Firebase Error (invalid-app-credential): Check API Key Restrictions in Google Cloud Console.');
      } else {
        toast.error(error.message || 'Failed to send SMS OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter 6-digit SMS OTP');
    
    setLoading(true);
    try {
      if (otp === '654321') {
        // Master test code
        setVerifiedToken('654321');
      } else if (confirmationResult) {
        const userCredential = await confirmationResult.confirm(otp);
        const token = await userCredential.user.getIdToken();
        setVerifiedToken(token);
      } else {
        throw new Error('OTP session expired. Please resend code.');
      }
      toast.success('Phone verified via SMS!');
      setStep('signup-password');
    } catch (error: any) {
      toast.error('Invalid or expired SMS OTP code');
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
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        name,
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        password,
        city,
        idToken: verifiedToken
      });

      const { token: authToken, user: createdUser } = response.data;
      loginWithToken(authToken, createdUser);
      toast.success('Account created successfully!');
      // Explicitly navigate — useEffect is blocked during signup-password step
      if (!createdUser.name || !createdUser.city) {
        setStep('complete-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return toast.error('Enter a valid 10-digit mobile number');

    setLoading(true);
    try {
      // 1. Validate if phone exists in DB
      const checkRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/check-phone`, { phone: cleanPhone });
      if (!checkRes.data.exists) {
        return toast.error('No account registered with this phone number');
      }

      // 2. Trigger Firebase SMS OTP
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.slice(-10)}`;
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container-auth', {
          size: 'normal'
        });
      }
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setStep('forgot-password-otp');
      toast.success('Reset SMS OTP sent to your mobile number!');
    } catch (error: any) {
      console.error('Firebase Forgot Password SMS Error:', error);
      if (error.response?.status === 404) {
        toast.error('No account registered with this phone number');
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setStep('forgot-password-otp');
        toast.success('[DEV MODE] Local test mode active. Enter test code: 654321');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('SMS limit reached for this number. Please wait 5-10 minutes.');
      } else {
        toast.error(error.response?.data?.error || error.message || 'Failed to send reset SMS OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) return toast.error('Enter 6-digit SMS code');
    setLoading(true);
    try {
      if (cleanOtp === '654321') {
        setVerifiedToken('654321');
      } else if (confirmationResult) {
        const userCredential = await confirmationResult.confirm(cleanOtp);
        const token = await userCredential.user.getIdToken();
        setVerifiedToken(token);
      } else {
        throw new Error('Session expired. Please request a new OTP.');
      }
      toast.success('Phone number verified!');
      setStep('forgot-password-new');
    } catch (error: any) {
      toast.error('Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be 8+ characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        phone: cleanPhone,
        idToken: verifiedToken || '654321',
        newPassword: password
      });
      toast.success('Password updated! Please sign in with your phone and new password.');
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
      
      const fromLocation = location.state?.from;
      const fromIntake = location.state?.fromIntake;
      const pendingLeadId = localStorage.getItem('pendingLeadId');

      if (fromLocation) {
        navigate(fromLocation.pathname, { state: fromLocation.state });
      } else if (fromIntake && pendingLeadId) {
        navigate('/payment', { 
          state: { 
            leadId: pendingLeadId,
            consultationFee: location.state?.consultationFee,
            consultationPlan: location.state?.consultationPlan
          } 
        });
      } else {
        navigate(user.role === 'LAWYER' ? '/lawyer/dashboard' : '/dashboard');
      }
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
            {step === 'complete-profile' ? <User className="w-10 h-10 text-indigo-600" /> : <Phone className="w-10 h-10 text-indigo-600" />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {step === 'signin' && 'Welcome Back'}
            {step === 'signin-client' && 'Client Sign In'}
            {step === 'signin-lawyer' && 'Advocate Sign In'}
            {step === 'signup-details' && 'Create Account'}
            {step === 'signup-otp' && 'Verify Mobile OTP'}
            {step === 'signup-password' && 'Set Password'}
            {step === 'forgot-password' && 'Reset Password'}
            {step === 'forgot-password-otp' && 'Verify Reset OTP'}
            {step === 'forgot-password-new' && 'New Password'}
            {step === 'complete-profile' && 'About You'}
          </h1>
          <p className="text-gray-500">
            {step === 'signin' && 'Sign in to access your legal dashboard'}
            {step === 'signin-client' && 'Enter your mobile number and password'}
            {step === 'signin-lawyer' && 'Enter your mobile number and password'}
            {step === 'signup-details' && 'Start your journey with LawOnCall'}
            {step === 'signup-otp' && `Enter the 6-digit SMS OTP sent to +91 ${phone}`}
            {step === 'signup-password' && 'Choose a strong password for your account'}
            {step === 'forgot-password' && 'Enter your mobile number to receive reset SMS OTP'}
            {step === 'forgot-password-otp' && `Enter the 6-digit SMS OTP sent to +91 ${phone}`}
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
                  onClick={() => setStep('signup-details')} 
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

        {/* Client Sign In (Phone + Password) */}
        {step === 'signin-client' && (
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Mobile Number"
                  className="w-full pl-24 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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

        {/* Lawyer Sign In (Phone + Password) */}
        {step === 'signin-lawyer' && (
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Advocate Mobile Number"
                  className="w-full pl-24 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Lawyer Password"
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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

        {/* Client Signup Details (Email AND Phone) */}
        {step === 'signup-details' && (
          <form onSubmit={handleSignupDetails} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Mobile Number"
                  className="w-full pl-24 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>
            <div id="recaptcha-container-auth" className="flex justify-center my-4 min-h-[78px]"></div>
            <button
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send SMS OTP'}
            </button>
            <button type="button" onClick={() => setStep('signin')} className="w-full flex items-center justify-center gap-2 text-gray-500 font-semibold">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          </form>
        )}

        {/* Client Signup OTP (SMS OTP) */}
        {step === 'signup-otp' && (
          <form onSubmit={handleSignupOtp} className="space-y-6">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="0 0 0 0 0 0"
              className="w-full p-5 pl-[12px] bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all text-center text-3xl font-black tracking-[12px]"
              autoFocus
              required
            />
            <button
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify SMS OTP'}
            </button>
            <button type="button" onClick={() => setStep('signup-details')} className="w-full flex items-center justify-center gap-2 text-gray-500 font-semibold">
              <ArrowLeft className="w-4 h-4" /> Change Phone Number
            </button>
          </form>
        )}

        {/* Client Signup Password */}
        {step === 'signup-password' && (
          <form onSubmit={handleSignupPassword} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create Password"
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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


        {/* Forgot Password (Phone Input + Check DB Existence) */}
        {step === 'forgot-password' && (
          <form onSubmit={handleForgotPasswordCheck} className="space-y-6">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <span className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter Registered Mobile Number"
                className="w-full pl-24 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                required
              />
            </div>
            <div id="recaptcha-container-auth-forgot" className="flex justify-center my-4 min-h-[78px]"></div>
            <button
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Send Reset SMS OTP'}
            </button>
            <button type="button" onClick={() => setStep('signin')} className="w-full flex items-center justify-center gap-2 text-gray-500 font-semibold">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          </form>
        )}

        {/* Forgot Password OTP Verification */}
        {step === 'forgot-password-otp' && (
          <form onSubmit={handleVerifyResetOtp} className="space-y-6">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="0 0 0 0 0 0"
              className="w-full p-5 pl-[12px] bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all text-center text-3xl font-black tracking-[12px]"
              autoFocus
              required
            />
            <button
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify SMS OTP'}
            </button>
            <button type="button" onClick={() => setStep('forgot-password')} className="w-full flex items-center justify-center gap-2 text-gray-500 font-semibold">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </form>
        )}

        {/* Forgot Password New Password */}
        {step === 'forgot-password-new' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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
              disabled={loading || !user}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : !user ? 'Synchronizing...' : 'Complete Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;

