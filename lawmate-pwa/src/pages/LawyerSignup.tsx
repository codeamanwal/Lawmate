
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ChevronRight, 
  Loader2, 
  Shield, 
  Mail, 
  User, 
  Phone, 
  Briefcase, 
  MapPin, 
  Award,
  CheckCircle2,
  Lock,
  Gavel,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi"
];

const categories = ["Family & Marriage", "Domestic Violence", "Property & Registry", "Criminal & Police", "Supreme Court Lawyer", "Cyber & Digital Fraud", "Employment & HR", "Consumer Complaints", "Other"];

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  state: z.string().min(1, 'Select your state'),
  city: z.string().min(1, 'City is required'),
  licenseNumber: z.string().regex(/^[A-Z]{2,3}\/\d+\/\d{4}$/, 'Enter valid enrollment number.'),
  experience: z.number().min(0, 'Invalid number.').max(50, 'Invalid number.'),
  practiceAreas: z.array(z.string()).min(1, 'Select at least one area.'),
  address: z.string().min(5, 'Required.').max(200, 'Max 200 characters'),
  agreed: z.boolean().refine(val => val === true, 'You must agree to the terms'),
});

type FormData = z.infer<typeof formSchema>;

const LawyerSignup = () => {
  const [step, setStep] = useState(1); // 1: Form, 2: OTP, 3: Password
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempUserId, setTempUserId] = useState('');
  const [passwords, setPasswords] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { loginWithEmail } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      practiceAreas: [],
      agreed: false
    }
  });

  const onSubmitForm = async (data: FormData) => {
    setLoading(true);
    try {
      // API call to initiate signup and send OTP
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/lawyer/signup`, data);
      setTempUserId(response.data.userId);
      setStep(2);
      toast.success('OTP sent to your email!');
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Account already registered – log in.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, { 
        email: watch('email'), 
        code: otp 
      });
      setStep(3);
      toast.success('Email verified!');
    } catch (error) {
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (passwords.password.length < 8) return toast.error('Password must be 8+ characters');
    if (passwords.password !== passwords.confirm) return toast.error('Passwords do not match');
    
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/set-password`, {
        userId: tempUserId,
        password: passwords.password
      });
      
      await loginWithEmail(watch('email'), passwords.password, 'LAWYER');
      
      toast.success('Account created successfully!');
      navigate('/lawyer/onboarding'); // Land on Onboarding Wizard
    } catch (error) {
      toast.error('Failed to set password or login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/main-logo.png" alt="LawOnCall Logo" className="h-9 w-auto object-contain" />
            <span className="text-2xl font-bold text-gray-900 tracking-tight">Law<span className="text-indigo-600">OnCall</span></span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Register as Advocate</h1>
          <p className="text-gray-500 font-medium">Join our network of verified legal professionals</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10 overflow-x-auto py-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-8 sm:w-12 h-1 bg-gray-200 rounded-full overflow-hidden`}><div className={`h-full bg-indigo-600 transition-all duration-500 ${step > s ? 'w-full' : 'w-0'}`}></div></div>}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/50 p-6 sm:p-8 md:p-12 border border-gray-100">
          
          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> Full Name*
                  </label>
                  <input
                    {...register('fullName')}
                    placeholder="First Last"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all font-medium text-sm`}
                  />
                  {errors.fullName && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" /> Email Address*
                  </label>
                  <input
                    {...register('email')}
                    placeholder="advocate@example.com"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all font-medium text-sm`}
                  />
                  {errors.email && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> Mobile Number*
                  </label>
                  <input
                    {...register('phone')}
                    placeholder="+91xxxxxxxxxx"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all font-medium text-sm`}
                  />
                  {errors.phone && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> State*
                  </label>
                  <select
                    {...register('state')}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.state ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all font-medium text-sm bg-white`}
                  >
                    <option value="">Select State</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.state.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> City*
                  </label>
                  <input
                    {...register('city')}
                    placeholder="Delhi"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all font-medium text-sm`}
                  />
                  {errors.city && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.city.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2 group relative">
                    <Award className="w-4 h-4 text-gray-400" /> License / Bar Council No.*
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-0 bg-gray-900 text-white text-[10px] py-1 px-2 rounded font-black whitespace-nowrap shadow-xl z-10 pointer-events-none">
                      Your State Bar Council enrollment no.
                    </span>
                  </label>
                  <input
                    {...register('licenseNumber')}
                    placeholder="e.g. UP/1234/2015"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.licenseNumber ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all font-medium text-sm`}
                  />
                  {errors.licenseNumber && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.licenseNumber.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" /> Years of Experience*
                  </label>
                  <input
                    type="number"
                    {...register('experience', { valueAsNumber: true })}
                    placeholder="5"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.experience ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all font-medium text-sm`}
                  />
                  {errors.experience && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.experience.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-gray-400" /> Area(s) of Practice*
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:border-indigo-200 transition-all">
                        <input
                          type="checkbox"
                          value={cat}
                          {...register('practiceAreas')}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                        />
                        <span className="text-xs font-bold text-gray-600">{cat}</span>
                      </label>
                    ))}
                  </div>
                  {errors.practiceAreas && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.practiceAreas.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" /> Office Address*
                </label>
                <textarea
                  {...register('address')}
                  rows={2}
                  placeholder="Street, Building, Landmark..."
                  className={`w-full px-4 py-3 rounded-xl border ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all font-medium text-sm resize-none`}
                />
                {errors.address && <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.address.message}</p>}
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreed"
                  {...register('agreed')}
                  className="mt-1 w-5 h-5 text-indigo-600 rounded-lg border-gray-300 focus:ring-indigo-500 shadow-sm"
                />
                <label htmlFor="agreed" className="text-xs font-bold text-gray-500 leading-tight">
                  I confirm I am enrolled as an Advocate under the Advocates Act, 1961 and agree to the <Link to="/terms" className="text-indigo-600 hover:underline">Terms of Use</Link>.
                </label>
              </div>
              {errors.agreed && <p className="mt-1 text-xs font-bold text-red-500">{errors.agreed.message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-70 group"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Register as Advocate <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Shield className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Verify Email</h2>
              <p className="text-gray-500 mb-8">Enter the OTP sent to <b>{watch('email')}</b></p>
              
              <div className="max-w-xs mx-auto mb-8">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="0 0 0 0 0 0"
                  className="w-full text-center text-3xl font-black tracking-[12px] py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify & Continue'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="py-6">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Lock className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Secure Account</h2>
              <p className="text-gray-500 mb-8 text-center font-medium">Create a password to access your advocate dashboard</p>
              
              <div className="space-y-6 max-w-sm mx-auto">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwords.password}
                      onChange={(e) => setPasswords({...passwords, password: e.target.value})}
                      placeholder="8+ characters"
                      className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] font-bold text-gray-400">8+ characters, mix of letters & numbers</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      placeholder="Re-enter password"
                      className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSetPassword}
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}

        </div>

        <p className="text-center mt-8 text-gray-500 font-bold text-sm">
          Already have an account? <Link to="/auth" className="text-indigo-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default LawyerSignup;
