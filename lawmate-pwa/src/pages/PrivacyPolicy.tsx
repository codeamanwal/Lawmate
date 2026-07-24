import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Navigation, BookOpen } from 'lucide-react';
import { PRIVACY_POLICY_DATA } from '../constants/legalTexts';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Extract headings for Table of Contents
  const headings = useMemo(() => {
    return PRIVACY_POLICY_DATA.filter((item: any) => item.type === 'heading');
  }, []);

  // Filter content based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return PRIVACY_POLICY_DATA;
    const query = searchQuery.toLowerCase();
    return PRIVACY_POLICY_DATA.map((item: any) => {
      if (item.type === 'p' && item.text?.toLowerCase().includes(query)) {
        return { ...item, highlight: true };
      }
      if (item.type === 'heading' && item.text?.toLowerCase().includes(query)) {
        return { ...item, highlight: true };
      }
      return item;
    });
  }, [searchQuery]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold self-start transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search privacy policy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Table of Contents */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm max-h-[calc(100vh-120px)] overflow-y-auto">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" /> Navigation
              </h3>
              <nav className="space-y-1">
                {headings.map((heading: any, index: number) => {
                  const id = `section-${heading.text.split('.')[0]}`;
                  return (
                    <button
                      key={index}
                      onClick={() => scrollToSection(id)}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all block truncate"
                      title={heading.text}
                    >
                      {heading.text}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-1 lg:col-span-3">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm">
              <div className="prose max-w-none text-gray-600 space-y-6 text-left">
                {filteredData.map((item: any, index: number) => {
                  if (item.type === 'title') {
                    return (
                      <div key={index} className="border-b border-gray-100 pb-6 mb-6">
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{item.text}</h1>
                      </div>
                    );
                  }
                  if (item.type === 'meta') {
                    return (
                      <div key={index} className="flex flex-wrap gap-2 text-xs text-gray-400 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                        {item.text}
                      </div>
                    );
                  }
                  if (item.type === 'heading') {
                    const id = `section-${item.text.split('.')[0]}`;
                    return (
                      <h2 
                        key={index} 
                        id={id}
                        className={`text-lg sm:text-xl font-bold text-gray-900 pt-6 border-t border-gray-100 flex items-center gap-2 scroll-mt-6 ${item.highlight ? 'bg-yellow-50 rounded-lg p-1' : ''}`}
                      >
                        <Navigation className="w-4 h-4 text-indigo-500 rotate-45" />
                        {item.text}
                      </h2>
                    );
                  }
                  if (item.type === 'table') {
                    return (
                      <div key={index} className="overflow-x-auto my-6 border border-gray-100 rounded-2xl shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50/75">
                            <tr>
                              {item.tableData[0].map((cell: string, cIdx: number) => (
                                <th key={cIdx} className="px-4 py-3 text-left font-bold text-gray-900 border-b border-gray-100">
                                  {cell}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {item.tableData.slice(1).map((row: string[], rIdx: number) => (
                              <tr key={rIdx} className="hover:bg-gray-50/50 transition-colors">
                                {row.map((cell: string, cIdx: number) => (
                                  <td key={cIdx} className="px-4 py-3 text-gray-600">
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
                    <p 
                      key={index} 
                      className={`leading-relaxed text-gray-600 transition-colors ${item.highlight ? 'bg-yellow-50 rounded-lg p-1 text-gray-900' : ''}`}
                    >
                      {item.text}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
