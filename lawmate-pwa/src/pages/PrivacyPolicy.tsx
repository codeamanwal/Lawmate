
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 font-semibold mb-8">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-3xl sm:text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose max-w-none text-gray-600 space-y-6">
        <p>This Privacy Policy describes how LawOnCall collects, uses, and shares your personal information.</p>
        <h2 className="text-2xl font-bold text-gray-900">1. Data Collection</h2>
        <p>We collect your mobile number, name, and details about your legal issues to facilitate matching with lawyers.</p>
        <h2 className="text-2xl font-bold text-gray-900">2. DPDP Compliance</h2>
        <p>We comply with India's Digital Personal Data Protection Act. Your data is stored securely and used only for the purposes stated.</p>
        <h2 className="text-2xl font-bold text-gray-900">3. Data Retention</h2>
        <p>We retain your data as long as necessary to provide our services or as required by law.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
