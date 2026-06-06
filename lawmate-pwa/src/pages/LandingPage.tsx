
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Clock, ArrowRight, X, PhoneCall, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const [isAssistanceModalOpen, setIsAssistanceModalOpen] = useState(false);
  const [isCallbackRequested, setIsCallbackRequested] = useState(false);
  const [assistanceData, setAssistanceData] = useState({ name: '', phone: '' });
  const [isSubmittingAssistance, setIsSubmittingAssistance] = useState(false);

  const handleAssistanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAssistance(true);
    try {
      // 1. POST to Google Sheets Webhook URL (Flow 1 - existing)
      const webhookUrl = "https://script.google.com/macros/s/AKfycbwEUrF7HoSkyB3eGuh5fe6OjL47Nv8-iwtALMtGPZuuUKvj3oXiFJA209Ae27tgYJ4JUQ/exec";
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...assistanceData, type: 'callback' }),
        });
      }

      // 2. Also save to DB so it appears in Admin dashboard as Flow 1
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: assistanceData.name || 'Anonymous Callback',
            phone: assistanceData.phone || 'N/A',
            city: '',
            category: 'General',
            description: 'Callback requested from homepage.',
            preferredTime: 'Callback',  // Stored as Flow 1 in Admin
          }),
        });
      } catch (dbError) {
        // DB save failure is non-critical; Google Sheets already captured the lead
        console.warn('Flow 1 lead saved to Sheets but DB save failed:', dbError);
      }

      setIsCallbackRequested(true);
    } catch (error) {
      console.error('Failed to save to Google Sheets:', error);
      setIsCallbackRequested(true); // Proceed to success screen anyway
    } finally {
      setIsSubmittingAssistance(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-indigo-600 uppercase bg-indigo-50 rounded-full">
                Legal support at your fingertips
              </span>
              <h1 className="mb-6 text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 lg:text-7xl leading-tight">
                Expert Legal Advice <span className="text-indigo-600">in 60 Minutes</span>
              </h1>
              <p className="mb-10 text-lg md:text-xl text-gray-600 leading-relaxed">
                Get connected with verified lawyers for urgent matters within 60 minutes or same day.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/auth"
                  state={{ step: 'signup-email' }}
                  className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-xl hover:shadow-indigo-200/50 flex items-center justify-center gap-2"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => { setIsAssistanceModalOpen(true); setIsCallbackRequested(false); }}
                  className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-gray-700 transition-all bg-white border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                >
                  Need immediate assistance ?
                </button>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Abstract shapes for background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-3xl opacity-60"></div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-amber-500" />}
              title="Instant Matching"
              description="Our smart engine matches you with the best available lawyer based on your specific case type and location."
            />
            <FeatureCard 
              icon={<Clock className="w-8 h-8 text-blue-500" />}
              title="60-Min Consultation"
              description="Get connected and start your legal consultation within 60 minutes of booking. No more waiting for weeks."
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-emerald-500" />}
              title="Verified Experts"
              description="Every lawyer on LawOnCall is strictly verified for credentials, experience, and professional standing."
            />
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 uppercase tracking-tight">Our Expertise</h2>
            <div className="w-16 md:w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <ExpertiseCard 
              image="/1. Family & Marriage_001.png"
              title="Family & Marriage"
              description="Divorce, custody, matrimonial & family disputes."
            />
            <ExpertiseCard 
              image="/2. Domestic Violence_001.png"
              title="Domestic Violence"
              description="Protection against violence in personal space"
            />
            <ExpertiseCard 
              image="/3. Property & Registry_001.png"
              title="Property & Registry"
              description="Registry, builder fraud, rent & ownership issues."
            />
            <ExpertiseCard 
              image="/4. Criminal & Police_001.png"
              title="Criminal & Police"
              description="FIR, police matters, bail & urgent legal help."
            />
            <ExpertiseCard 
              image="/5. Supreme Court Lawyer_001.png"
              title="Supreme Court Lawyer"
              description="Expert legal support and strong representation"
            />
            <ExpertiseCard 
              image="/6. Cyber & Digital Fraud_004.png"
              title="Cyber & Digital Fraud"
              description="UPI fraud, cybercrime & online scam support."
            />
            <ExpertiseCard 
              image="/7. Employment & HR_001.png"
              title="Employment & HR"
              description="Wrongful termination, salary & workplace disputes."
            />
            <ExpertiseCard 
              image="/8. Consumer Complaints 001.png"
              title="Consumer Complaints"
              description="Online fraud, refunds & consumer protection."
            />
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="inline-flex items-center gap-2 mb-4">
                <img src="/footer-logo.jpeg" alt="LawOnCall Logo" className="h-11 w-auto object-contain" />
                <span className="text-xl font-black text-white tracking-tight">Law<span className="text-indigo-500">OnCall</span></span>
              </Link>
              <p className="text-sm leading-relaxed max-w-xs">
                Connecting you with India's top legal professionals instantly. Your trusted partner for legal solutions.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/admin" className="hover:text-white transition-colors">Admin</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 text-sm text-center md:text-left flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} LawOnCall. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Designed for DPDP Compliance.</p>
          </div>
        </div>
      </footer>

      {/* Immediate Assistance Modal */}
      {isAssistanceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
            <button 
              onClick={() => { setIsAssistanceModalOpen(false); setIsCallbackRequested(false); }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            
            {isCallbackRequested ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PhoneCall className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Request Confirmed</h3>
                <p className="text-gray-600 mb-2">Our legal team will call you shortly from <span className="font-bold text-gray-900 whitespace-nowrap">+91&nbsp;7292002026.</span></p>
                <p className="text-sm font-semibold text-gray-500">Expected callback: Within 30-60 minutes.</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-black text-gray-900 mb-6">Need Immediate Assistance?</h3>
                <form className="space-y-4" onSubmit={handleAssistanceSubmit}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Your Name" 
                      value={assistanceData.name}
                      onChange={(e) => setAssistanceData({ ...assistanceData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                    <input 
                      required 
                      type="tel" 
                      placeholder="Your Phone Number" 
                      value={assistanceData.phone}
                      onChange={(e) => setAssistanceData({ ...assistanceData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmittingAssistance}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:hover:bg-indigo-600 transition-all text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 mt-2 flex justify-center items-center h-[52px]"
                  >
                    {isSubmittingAssistance ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request immediate callback'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="mb-6 p-3 bg-gray-50 inline-block rounded-xl">
      {icon}
    </div>
    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const ExpertiseCard = ({ image, title, description }: { image: string, title: string, description: string }) => (
  <div className="group overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
    <div className="relative h-40 md:h-48 overflow-hidden shrink-0">
      <img 
        src={image} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
    <div className="p-5 md:p-6 flex-grow">
      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3 group-hover:text-indigo-600 transition-colors line-clamp-1">{title}</h3>
      <p className="text-xs md:text-sm text-gray-600 leading-relaxed line-clamp-3">
        {description}
      </p>
    </div>
  </div>
);

export default LandingPage;
