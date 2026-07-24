import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TERMS_AND_CONDITIONS_DATA } from '../constants/legalTexts';

const TermsAndConditions = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 font-semibold mb-8">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="prose max-w-none text-gray-600 space-y-4 text-left">
        {TERMS_AND_CONDITIONS_DATA.map((item, index) => {
          if (item.type === 'title') {
            return <h1 key={index} className="text-2xl sm:text-3xl font-extrabold mb-4 text-gray-900">{item.text}</h1>;
          }
          if (item.type === 'meta') {
            return <p key={index} className="text-sm text-gray-400 italic mb-6">{item.text}</p>;
          }
          if (item.type === 'heading') {
            return <h2 key={index} className="text-xl font-bold text-gray-900 mt-8 mb-3">{item.text}</h2>;
          }
          return <p key={index} className="leading-relaxed text-gray-600">{item.text}</p>;
        })}
      </div>
    </div>
  );
};

export default TermsAndConditions;
