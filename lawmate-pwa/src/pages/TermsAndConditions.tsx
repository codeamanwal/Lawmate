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
        {TERMS_AND_CONDITIONS_DATA.map((item: any, index: number) => {
          if (item.type === 'title') {
            return <h1 key={index} className="text-2xl sm:text-3xl font-extrabold mb-4 text-gray-900">{item.text}</h1>;
          }
          if (item.type === 'meta') {
            return <p key={index} className="text-sm text-gray-400 italic mb-6">{item.text}</p>;
          }
          if (item.type === 'heading') {
            return <h2 key={index} className="text-xl font-bold text-gray-900 mt-8 mb-3">{item.text}</h2>;
          }
          if (item.type === 'table') {
            return (
              <div key={index} className="overflow-x-auto my-6 border border-gray-200 rounded-xl">
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
          return <p key={index} className="leading-relaxed text-gray-600">{item.text}</p>;
        })}
      </div>
    </div>
  );
};

export default TermsAndConditions;
