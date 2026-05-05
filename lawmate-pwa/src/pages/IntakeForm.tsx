import { useState, useEffect } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';

import { ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  city: z.string().min(1, 'Please select a city'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(10, 'Please provide a bit more detail about your issue'),
  preferredTime: z.enum(['ASAP', 'LATER']),
  agreed: z.boolean().refine(val => val === true, 'You must agree to the terms'),
});

type FormData = z.infer<typeof formSchema>;

const IntakeForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      preferredTime: 'ASAP',
      agreed: false
    }
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('intake_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        reset(parsed);
      } catch (e) {
        console.error('Failed to parse draft');
      }
    }
  }, [reset]);

  // Save to localStorage on change
  const formValues = watch();
  useEffect(() => {
    localStorage.setItem('intake_draft', JSON.stringify(formValues));
  }, [formValues]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/leads`, data);
      localStorage.setItem('pendingLeadId', response.data.id);
      localStorage.removeItem('intake_draft'); // Clear draft on success
      toast.success('Lead submitted successfully!');
      navigate('/auth'); // Redirect to auth for OTP verification
    } catch (error) {
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 py-12 px-6 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 md:p-12 border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Get Started</h2>
          <p className="text-gray-500">Fill in the details to connect with a legal expert</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
            <input
              {...register('fullName')}
              placeholder="e.g. Rahul Sharma"
              className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all`}
            />
            {errors.fullName && <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.fullName.message}</p>}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+91</span>
              <input
                {...register('phone')}
                placeholder="10-digit mobile"
                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all`}
              />
            </div>
            {errors.phone && <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
              <select
                {...register('city')}
                className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all bg-white`}
              >
                <option value="">Select City</option>
                <option value="Delhi">Delhi</option>
                <option value="Gautam Buddha Nagar">Gautam Buddha Nagar</option>
                <option value="Ghaziabad">Ghaziabad</option>
              </select>
              {errors.city && <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.city.message}</p>}
            </div>

            {/* Issue Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Issue Category</label>
              <select
                {...register('category')}
                className={`w-full px-4 py-3 rounded-xl border ${errors.category ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all bg-white`}
              >
                <option value="">Select Category</option>
                <option value="Property">Property</option>
                <option value="Divorce">Divorce</option>
                <option value="Employment">Employment</option>
                <option value="Criminal">Criminal</option>
                <option value="Civil">Civil</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.category.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brief Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Tell us a bit about your legal concern..."
              className={`w-full px-4 py-3 rounded-xl border ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all resize-none`}
            />
            {errors.description && <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.description.message}</p>}
          </div>

          {/* Preferred Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">When would you like to consult?</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${watch('preferredTime') === 'ASAP' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                <input type="radio" value="ASAP" {...register('preferredTime')} className="hidden" />
                <span className="font-bold">ASAP (30 min)</span>
              </label>
              <label className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${watch('preferredTime') === 'LATER' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                <input type="radio" value="LATER" {...register('preferredTime')} className="hidden" />
                <span className="font-bold">Later Today</span>
              </label>
            </div>
          </div>

          {/* T&C Checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="agreed"
              {...register('agreed')}
              className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="agreed" className="text-sm text-gray-600 leading-tight">
              I agree to <Link to="/terms" className="text-indigo-600 font-semibold hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-indigo-600 font-semibold hover:underline">Privacy Policy</Link>
            </label>

          </div>
          {errors.agreed && <p className="text-xs font-medium text-red-500">{errors.agreed.message}</p>}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Continue <ChevronRight className="w-5 h-5" /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IntakeForm;
