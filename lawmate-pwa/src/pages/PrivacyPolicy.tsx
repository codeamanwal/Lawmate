import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PRIVACY_POLICY_DATA } from '../constants/legalTexts';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      
      <div className="prose prose-indigo max-w-none text-gray-600 space-y-5 text-left">
        {PRIVACY_POLICY_DATA.map((item: any, index: number) => {
          if (item.type === 'title') {
            return (
              <h1 key={index} className="text-3xl sm:text-4xl font-extrabold mb-4 text-gray-900 leading-tight">
                {item.text}
              </h1>
            );
          }
          if (item.type === 'meta') {
            return (
              <p key={index} className="text-sm text-gray-400 italic mb-8 pb-4 border-b border-gray-100">
                {item.text}
              </p>
            );
          }
          if (item.type === 'heading') {
            return (
              <h2 key={index} className="text-xl font-bold text-gray-900 mt-8 mb-4 pt-4 border-t border-gray-50">
                {item.text}
              </h2>
            );
          }
          if (item.type === 'subheading') {
            return (
              <h3 key={index} className="text-base font-semibold text-gray-800 mt-6 mb-2 bg-gray-50/75 py-1 px-3 rounded-lg border-l-2 border-indigo-500 inline-block">
                {item.text}
              </h3>
            );
          }
          if (item.type === 'table') {
            return (
              <div key={index} className="overflow-x-auto my-6 border border-gray-200 rounded-2xl shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {item.tableData[0].map((cell: string, cIdx: number) => (
                        <th key={cIdx} className="px-4 py-3 text-left font-bold text-gray-900 border-b border-gray-200">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-150">
                    {item.tableData.slice(1).map((row: string[], rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-gray-50">
                        {row.map((cell: string, cIdx: number) => (
                          <td key={cIdx} className="px-4 py-3 text-gray-600 border-b border-gray-200">
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
          return (
            <p key={index} className="leading-relaxed text-gray-600">
              {item.text}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
