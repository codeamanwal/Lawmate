import { useState, useEffect } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { ChevronRight, Loader2, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { PRIVACY_POLICY_DATA, TERMS_AND_CONDITIONS_DATA } from '../constants/legalTexts';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  city: z.string().min(1, 'Please select a city'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(10, 'Please provide a bit more detail about your issue'),
  preferredTime: z.enum(['ASAP', 'LATER']),
  agreed: z.boolean().refine(val => val === true, 'You must agree to Terms & Conditions and Privacy Policy.'),
});

type FormData = z.infer<typeof formSchema>;

const IntakeForm = () => {
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      preferredTime: 'ASAP',
      agreed: false
    }
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Use a user-scoped draft key so different users never share drafts
  const draftKey = user ? `intake_draft_${user.id}` : 'intake_draft_guest';

  // Load from localStorage or User Profile
  useEffect(() => {
    // Clean up any old unscoped draft keys on mount
    localStorage.removeItem('intake_draft');

    const saved = localStorage.getItem(draftKey);
    let draftValues: any = {};
    if (saved) {
      try {
        draftValues = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse draft');
      }
    }

    if (user) {
      // Always use the current user's profile data for name & phone — never the draft
      reset({
        fullName: user.name || '',
        phone: user.phone || '',
        city: draftValues.city || user.city || '',
        category: draftValues.category || '',
        description: draftValues.description || '',
        preferredTime: draftValues.preferredTime || 'ASAP',
        agreed: draftValues.agreed || false
      });
    } else if (Object.keys(draftValues).length > 0) {
      reset(draftValues);
    }
    setIsLoaded(true);
  }, [user, reset, draftKey]);

  // Save to localStorage on change (scoped to user)
  const formValues = watch();
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(draftKey, JSON.stringify(formValues));
    }
  }, [formValues, isLoaded, draftKey]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/leads`, data);
      localStorage.setItem('pendingLeadId', response.data.id);
      localStorage.removeItem(draftKey); // Clear draft on success
      toast.success('Lead submitted successfully!');
      
      if (user) {
        navigate('/payment', { state: { leadId: response.data.id } });
      } else {
        navigate('/auth', { state: { fromIntake: true } }); // Redirect to auth for OTP verification
      }
    } catch (error) {
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-76px)] bg-gray-50 py-8 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 md:p-12 border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Consultation Request</h2>
          <p className="text-gray-500">Share your issue details to connect with the right legal expert.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
            <input
              {...register('fullName')}
              readOnly={!!user}
              placeholder="e.g. Rahul Sharma"
              className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all ${user ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
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
                readOnly={!!user}
                placeholder="10-digit mobile"
                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all ${user ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
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
                <option value="Family & Marriage">Family & Marriage</option>
                <option value="Domestic Violence">Domestic Violence</option>
                <option value="Property & Registry">Property & Registry</option>
                <option value="Criminal & Police">Criminal & Police</option>
                <option value="Supreme Court Lawyer">Supreme Court Lawyer</option>
                <option value="Cyber & Digital Fraud">Cyber & Digital Fraud</option>
                <option value="Employment & HR">Employment & HR</option>
                <option value="Consumer Complaints">Consumer Complaints</option>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${watch('preferredTime') === 'ASAP' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                <input type="radio" value="ASAP" {...register('preferredTime')} className="hidden" />
                <span className="font-bold">ASAP (60 min)</span>
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
              I agree to <a href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-indigo-600 font-semibold hover:underline">Terms & Conditions</a> and <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} className="text-indigo-600 font-semibold hover:underline">Privacy Policy</a>
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

      {showTermsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl relative border border-gray-100 p-8 flex flex-col my-4">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowTermsModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 absolute right-6 top-6"
              aria-label="Close Terms of Use"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Terms & Conditions
            </h2>

            {/* Content */}
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed text-left max-h-[60vh] overflow-y-auto pr-2">
              {TERMS_AND_CONDITIONS_DATA.map((item, index) => {
                if (item.type === 'title') return <h3 key={index} className="text-lg font-extrabold text-gray-900 mb-4">{item.text}</h3>;
                if (item.type === 'meta') return <p key={index} className="text-xs text-gray-400 italic mb-4">{item.text}</p>;
                if (item.type === 'heading') return <h4 key={index} className="text-base font-bold text-gray-900 mt-6 mb-2">{item.text}</h4>;
                if (item.type === 'subheading') return <h5 key={index} className="text-sm font-semibold text-gray-800 mt-4 mb-2 bg-gray-50/75 py-0.5 px-2 rounded border-l-2 border-indigo-500 inline-block">{item.text}</h5>;
                if (item.type === 'table') {
                  return (
                    <div key={index} className="overflow-x-auto my-4 border border-gray-200 rounded-xl">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            {item.tableData[0].map((cell, cIdx) => (
                              <th key={cIdx} className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-200">
                                {cell}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-150">
                          {item.tableData.slice(1).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-gray-50">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-3 py-2 text-gray-600 border-b border-gray-200">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                return <p key={index} className="text-gray-600 mb-2">{item.text}</p>;
              })}
            </div>

            {/* Action Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2 bg-[#9b7c53] hover:bg-[#86683d] text-white rounded-xl font-medium text-sm transition-colors shadow-md"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl relative border border-gray-100 p-8 flex flex-col my-4">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowPrivacyModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 absolute right-6 top-6"
              aria-label="Close Privacy Policy"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Privacy Policy
            </h2>

            {/* Content */}
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed text-left max-h-[60vh] overflow-y-auto pr-2">
              {PRIVACY_POLICY_DATA.map((item, index) => {
                if (item.type === 'title') return <h3 key={index} className="text-lg font-extrabold text-gray-900 mb-4">{item.text}</h3>;
                if (item.type === 'meta') return <p key={index} className="text-xs text-gray-400 italic mb-4">{item.text}</p>;
                if (item.type === 'heading') return <h4 key={index} className="text-base font-bold text-gray-900 mt-6 mb-2">{item.text}</h4>;
                if (item.type === 'subheading') return <h5 key={index} className="text-sm font-semibold text-gray-800 mt-4 mb-2 bg-gray-50/75 py-0.5 px-2 rounded border-l-2 border-indigo-500 inline-block">{item.text}</h5>;
                if (item.type === 'table') {
                  return (
                    <div key={index} className="overflow-x-auto my-4 border border-gray-200 rounded-xl">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            {item.tableData[0].map((cell, cIdx) => (
                              <th key={cIdx} className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-200">
                                {cell}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-150">
                          {item.tableData.slice(1).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-gray-50">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-3 py-2 text-gray-600 border-b border-gray-200">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                return <p key={index} className="text-gray-600 mb-2">{item.text}</p>;
              })}
            </div>

            {/* Action Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2 bg-[#9b7c53] hover:bg-[#86683d] text-white rounded-xl font-medium text-sm transition-colors shadow-md"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default IntakeForm;
