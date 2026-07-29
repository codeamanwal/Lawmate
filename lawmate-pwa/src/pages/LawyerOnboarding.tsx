
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONSULTATION_FEE } from '../config/constants';
import { 
  User, 
  Briefcase, 
  Clock, 
  FileCheck, 
  Image as ImageIcon, 
  Upload, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Globe,
  Link as LinkIcon,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const languages = ["English", "Hindi", "Marathi", "Bengali", "Gujarati", "Tamil", "Telugu", "Kannada", "Malayalam", "Punjabi"];

const LawyerOnboarding = () => {
  const { user, updateUser, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [practiceAreas, setPracticeAreas] = useState<string[]>(["Family & Marriage", "Domestic Violence", "Property & Registry", "Criminal & Police", "Supreme Court Advocate", "Cyber & Digital Fraud", "Employment & HR", "Consumer Complaints", "Other"]);
  const [selectedPracticeAreas, setSelectedPracticeAreas] = useState<string[]>(user?.lawyerProfile?.categories || []);
  const [bio, setBio] = useState(user?.lawyerProfile?.bio || '');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(user?.lawyerProfile?.languages || []);
  const [website, setWebsite] = useState('');
  const [files, setFiles] = useState<Record<string, string>>({
    'Enrollment Certificate': user?.lawyerProfile?.enrollmentCert || '',
    'Cancelled Cheque or Passbook': user?.lawyerProfile?.degreeCert || ''
  });
  const [availability, setAvailability] = useState({
    monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
    saturday: false, sunday: false
  });
  
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (user?.lawyerProfile && !isInitializedRef.current) {
      if (user.lawyerProfile.categories && user.lawyerProfile.categories.length > 0) {
        setSelectedPracticeAreas(user.lawyerProfile.categories);
      }
      if (user.lawyerProfile.bio) {
        setBio(user.lawyerProfile.bio);
      }
      if (user.lawyerProfile.languages && user.lawyerProfile.languages.length > 0) {
        setSelectedLanguages(user.lawyerProfile.languages);
      }
      if (user.lawyerProfile.availability) {
        try {
          const availObj = typeof user.lawyerProfile.availability === 'string'
            ? JSON.parse(user.lawyerProfile.availability)
            : user.lawyerProfile.availability;
          if (availObj && Array.isArray(availObj.days)) {
            const daysLower = availObj.days.map((d: string) => d.toLowerCase());
            setAvailability({
              monday: daysLower.includes('monday'),
              tuesday: daysLower.includes('tuesday'),
              wednesday: daysLower.includes('wednesday'),
              thursday: daysLower.includes('thursday'),
              friday: daysLower.includes('friday'),
              saturday: daysLower.includes('saturday'),
              sunday: daysLower.includes('sunday')
            });
          }
        } catch (err) {
          console.error('Error parsing availability in frontend:', err);
        }
      }
      setFiles({
        'Enrollment Certificate': user.lawyerProfile.enrollmentCert || '',
        'Cancelled Cheque or Passbook': user.lawyerProfile.degreeCert || ''
      });
      isInitializedRef.current = true;
    }
  }, [user]);
  
  const handleFileUpload = (label: string, file: File | undefined) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles(prev => ({ ...prev, [label]: reader.result as string }));
        toast.success(`${label} uploaded!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/profiles/lawyer/update`, {
        bio,
        languages: selectedLanguages,
        categories: selectedPracticeAreas,
        availability: {
          days: Object.entries(availability).filter(([_, active]) => active).map(([day]) => day),
          hours: "10:00 AM - 06:00 PM"
        },
        onboardingCompleted: true,
        enrollmentCert: files['Enrollment Certificate'],
        degreeCert: files['Cancelled Cheque or Passbook']
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        updateUser(response.data.user); // Sync Context
        toast.success('Professional profile updated!');
        navigate('/lawyer/dashboard');
      }
    } catch (error: any) {
      console.error('Full Error Object:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please sign in again.');
        logout();
        navigate('/auth');
      } else {
        toast.error(error.response?.data?.error || 'Failed to save profile details');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Stepper (2 Steps) */}
        <div className="flex items-center justify-between mb-8 sm:mb-12 bg-white p-4 sm:p-6 rounded-[24px] shadow-sm border border-gray-100 overflow-x-auto">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 sm:gap-4 flex-1 last:flex-none shrink-0">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold transition-all text-xs sm:text-base ${step === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 ring-4 ring-indigo-50' : step > s ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${step === s ? 'text-indigo-600' : 'text-gray-400'}`}>
                  Step 0{s}
                </p>
                <p className={`text-sm font-bold ${step === s ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s === 1 && 'Profile & Availability'}
                  {s === 2 && 'KYC & Final Review'}
                </p>
              </div>
              {s < 2 && <div className="flex-1 h-[2px] bg-gray-100 mx-4 hidden md:block" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Step 1: Professional Profile & Availability */}
          {step === 1 && (
            <div className="p-6 sm:p-8 md:p-12 space-y-10">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Professional Profile & Availability</h2>
                <p className="text-gray-500 font-medium text-sm">Tell us about your practice expertise and set your working schedule.</p>
              </div>

              {/* Bio & Details Section */}
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" /> Introductory Bio*
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a brief tagline or bio about your practice (100-200 characters)"
                    rows={4}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm resize-none"
                  />
                  <div className="flex justify-between mt-2">
                    <p className="text-[10px] font-bold text-gray-400 italic">Example: "Dedicated High Court advocate with 10 years of expertise in Civil and Property disputes."</p>
                    <p className={`text-[10px] font-black ${bio.length < 100 || bio.length > 200 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {bio.length} / 200
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> Practice Areas* (Confirm or Add)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {practiceAreas.map(area => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => {
                          if (selectedPracticeAreas.includes(area)) {
                            setSelectedPracticeAreas(selectedPracticeAreas.filter(a => a !== area));
                          } else {
                            setSelectedPracticeAreas([...selectedPracticeAreas, area]);
                          }
                        }}
                        className={`py-2 px-4 rounded-xl border-2 font-bold text-xs transition-all ${selectedPracticeAreas.includes(area) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'}`}
                      >
                        {area}
                      </button>
                    ))}
                    <button 
                      type="button"
                      onClick={() => {
                        const newArea = prompt('Enter Practice Area:');
                        if (newArea) setPracticeAreas([...practiceAreas, newArea]);
                      }}
                      className="py-2 px-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-bold text-xs hover:border-indigo-400 hover:text-indigo-600 transition-all"
                    >
                      + Add More
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" /> Languages Spoken*
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {languages.map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          if (selectedLanguages.includes(lang)) {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
                          } else {
                            setSelectedLanguages([...selectedLanguages, lang]);
                          }
                        }}
                        className={`py-3 px-4 rounded-xl border-2 font-bold text-xs transition-all ${selectedLanguages.includes(lang) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-gray-400" /> LinkedIn or Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>

              {/* Availability Settings Section */}
              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" /> Availability Settings
                </h3>
                <p className="text-gray-500 font-medium text-sm mb-6">Select the active days when clients can consult with you.</p>

                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mb-6 flex items-start gap-4">
                  <div className="bg-white p-2 rounded-xl shadow-sm">
                    <Clock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 mb-1 text-sm">Standard Business Hours</h4>
                    <p className="text-xs text-gray-500 font-bold leading-relaxed">Active slots are standard Monday-Friday, 10 AM - 6 PM. Toggle your preferred availability days below.</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {Object.entries(availability).map(([day, active]) => (
                    <div key={day} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${active ? 'bg-white border-indigo-600 shadow-sm' : 'bg-gray-50 border-transparent opacity-60'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black uppercase text-[10px] ${active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          {day.slice(0, 3)}
                        </div>
                        <span className="font-bold text-sm text-gray-900 capitalize">{day}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAvailability({...availability, [day]: !active})}
                        className={`w-12 h-7 rounded-full relative transition-all ${active ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${active ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: KYC Documents & Final Review */}
          {step === 2 && (
            <div className="p-6 sm:p-8 md:p-12 space-y-10">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">KYC Documents & Verification</h2>
                <p className="text-gray-500 font-medium text-sm">Upload your professional documents and submit your profile for admin verification.</p>
              </div>

              {/* Document Uploads */}
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { label: 'Enrollment Certificate', icon: FileCheck, hint: 'State Bar Council Certificate (PDF/JPG)' },
                  { label: 'Cancelled Cheque or Passbook', icon: FileCheck, hint: 'Cancelled Cheque or Photo of passbook’s first page (PDF/JPG)' }
                ].map((doc) => (
                  <div key={doc.label} className="group">
                    <label className="block text-sm font-bold text-gray-700 mb-3">{doc.label}</label>
                    <div 
                      onClick={() => document.getElementById(`file-${doc.label}`)?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${files[doc.label] ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${files[doc.label] ? 'bg-white text-emerald-600 shadow-sm' : 'bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-indigo-600'}`}>
                        {files[doc.label] ? <CheckCircle2 className="w-6 h-6" /> : <doc.icon className="w-6 h-6" />}
                      </div>
                      <p className={`text-sm font-black mb-1 flex items-center gap-2 ${files[doc.label] ? 'text-emerald-700' : 'text-gray-900'}`}>
                        {files[doc.label] ? "Document Attached" : <>Click to Upload <Upload className="w-4 h-4 text-indigo-600" /></>}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold">{doc.hint} · Max 5MB</p>
                      <input 
                        type="file" 
                        id={`file-${doc.label}`}
                        className="hidden" 
                        onChange={(e) => handleFileUpload(doc.label, e.target.files?.[0])}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Review Summary Card */}
              <div className="bg-gray-50 rounded-[24px] p-6 sm:p-8 text-left space-y-4 border border-gray-100">
                <h4 className="text-base font-black text-gray-900 mb-2 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" /> Verification Summary
                </h4>
                <div className="flex items-center justify-between border-t border-gray-200/60 pt-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profile Status</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase">Pending Submission</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Documents Uploaded</span>
                  <span className="text-gray-900 font-black">
                    {Object.values(files).filter(Boolean).length} of 2 Attached
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Consultation Fee</span>
                  <span className="text-indigo-600 font-black">As per your agreement with LawOnCall</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="p-4 sm:p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1 || loading}
              className={`flex items-center gap-2 px-6 py-3 font-black text-sm transition-all ${step === 1 ? 'opacity-0' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            
            {step < 2 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 group"
              >
                Save & Continue <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-xl font-black text-base hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Submit for Verification'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerOnboarding;
