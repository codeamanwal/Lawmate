
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsAndConditions = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 font-semibold mb-8">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
      <div className="prose max-w-none text-gray-600 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">1. Services</h2>
        <p>LawOnCall provides a platform to connect clients with legal professionals. We do not provide legal advice ourselves.</p>
        <h2 className="text-2xl font-bold text-gray-900">2. Payments</h2>
        <p>Payments are handled via Razorpay. Fees are non-refundable once the consultation has started.</p>
        <h2 className="text-2xl font-bold text-gray-900">3. User Conduct</h2>
        <p>Users must provide accurate information when filling out the intake form.</p>
      </div>
    </div>
  );
};

export default TermsAndConditions;
