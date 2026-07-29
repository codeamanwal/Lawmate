import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2, ArrowRight, Sparkles, HelpCircle, Zap, Scale, FileText } from 'lucide-react';
import axios from 'axios';
import { CONSULTATION_PLANS } from '../config/constants';

const PricingPage = () => {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<Record<string, number>>({
    QUICK: 200,
    STANDARD: 400,
    DETAILED: 800
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/payments/prices`)
      .then(res => {
        if (res.data && typeof res.data === 'object') {
          setPrices(res.data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch prices on pricing page:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSelectPlan = (planId: string) => {
    navigate('/get-started', { state: { preselectedPlan: planId } });
  };

  const planCards = [
    {
      id: 'QUICK',
      key: 'QUICK',
      badge: '⚡ Quick Advice',
      popular: false,
      icon: Zap,
      name: CONSULTATION_PLANS.QUICK.name,
      duration: CONSULTATION_PLANS.QUICK.duration,
      description: 'Ideal for fast legal questions, immediate rights guidance, or urgent clarification.',
      features: [
        '15 minutes 1-on-1 Phone Call',
        'Verified Advocate Assignment',
        'Immediate Consultation SLA',
        'Basic Case Review',
        'Encrypted & Confidential'
      ]
    },
    {
      id: 'STANDARD',
      key: 'STANDARD',
      badge: '🌟 Most Popular',
      popular: true,
      icon: Scale,
      name: CONSULTATION_PLANS.STANDARD.name,
      duration: CONSULTATION_PLANS.STANDARD.duration,
      description: 'Perfect for thorough case discussion, document guidance, and legal action steps.',
      features: [
        '30 minutes 1-on-1 Phone Call',
        'Senior Specialized Advocate',
        'Document & Contract Guidance',
        'Actionable Legal Strategy',
        '60-Min SLA Priority Matching',
        'Follow-up Summary Notes'
      ]
    },
    {
      id: 'DETAILED',
      key: 'DETAILED',
      badge: '📜 Comprehensive',
      popular: false,
      icon: FileText,
      name: CONSULTATION_PLANS.DETAILED.name,
      duration: CONSULTATION_PLANS.DETAILED.duration,
      description: 'Designed for complex property, matrimonial, or criminal matters needing deep review.',
      features: [
        '60 minutes 1-on-1 Phone Call',
        'Top-Rated Domain Expert Advocate',
        'Deep File & Evidence Analysis',
        'Multi-Party Dispute Advice',
        'Court Procedure Roadmap',
        'Dedicated Support Assistance'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-xs uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Simple, Transparent Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
            Expert Legal Counsel for Every Budget
          </h1>
          <p className="text-gray-500 font-medium text-base sm:text-lg">
            Choose a duration plan tailored to your case and talk directly with verified legal experts.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {planCards.map((plan) => {
            const Icon = plan.icon;
            const price = prices[plan.key] || (plan.key === 'QUICK' ? 200 : plan.key === 'DETAILED' ? 800 : 400);

            return (
              <div 
                key={plan.id}
                className={`relative bg-white rounded-3xl p-8 border flex flex-col justify-between transition-all duration-300 ${
                  plan.popular 
                    ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-2xl shadow-indigo-100 scale-100 md:-translate-y-2' 
                    : 'border-gray-200 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:border-gray-300'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular Choice
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
                      plan.popular ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {plan.duration} Session
                    </span>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      plan.popular ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed font-medium mb-6 min-h-[40px]">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-8 pb-6 border-b border-gray-100">
                    <span className="text-4xl sm:text-5xl font-black text-gray-900">₹{price}</span>
                    <span className="text-gray-400 font-bold text-sm">/ consultation</span>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3.5 mb-8">
                    <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">What's Included</p>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-gray-700">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-indigo-600' : 'text-emerald-500'}`} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Guarantee Banner */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white mb-20 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest rounded-full inline-block mb-4">
              100% Satisfaction & Security
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mb-4">Guaranteed Expert Guidance with Total Privacy</h2>
            <p className="text-indigo-200 text-sm leading-relaxed font-medium mb-6">
              All communications are protected under client-advocate confidentiality. If our matching engine fails to assign an advocate, you receive an immediate hassle-free refund.
            </p>
            <div className="flex flex-wrap gap-6 text-xs font-bold text-indigo-100">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> 256-bit SSL Security</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified Bar Council Advocates</span>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-400" /> Rapid SLA Assignment</span>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 text-center mb-8 flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-indigo-600" /> Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-2">How long after payment will an Advocate call me?</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                For ASAP requests, our SLA matching engine notifies available Advocates immediately. An advocate accepts and initiates the call within 60 minutes.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-2">Which plan should I choose for my legal issue?</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                If you have a quick question (e.g. basic notice advice), the <strong>Quick Plan (15 min)</strong> works great. For property, matrimonial, or agreement reviews, we recommend the <strong>Standard (30 min)</strong> or <strong>Detailed (60 min)</strong> plan.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-2">Are my details and conversation confidential?</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Yes, 100%. All consultations are strictly confidential under the Indian Evidence Act attorney-client privilege.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PricingPage;
