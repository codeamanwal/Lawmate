
import { Link } from 'react-router-dom';
import { Shield, Zap, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
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
                Lawyers at your fingertips
              </span>
              <h1 className="mb-8 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 lg:text-7xl leading-tight">
                Legal Expert advice <span className="text-indigo-600">in 60 minutes.</span>
              </h1>
              <p className="mb-10 text-xl text-gray-600 leading-relaxed">
                Connect with India's top legal professionals instantly. Whether it's property, divorce, or business—we've got you covered.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/get-started"
                  className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-xl hover:shadow-indigo-200/50 flex items-center justify-center gap-2"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-gray-700 transition-all bg-white border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                >
                  How it Works
                </Link>
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
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 uppercase tracking-tight">Our Expertise</h2>
            <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <ExpertiseCard 
              image="/divorce.jpg"
              title="Divorce"
              description="Top divorce law services in Delhi/NCR — expert support for contested and mutual divorce cases with trusted guidance."
            />
            <ExpertiseCard 
              image="/domestic.jpg"
              title="Domestic Violence"
              description="Experienced domestic violence lawyer in Delhi & NCR providing dedicated legal help to protect your rights and ensure your safety."
            />
            <ExpertiseCard 
              image="/Matrimonial.jpg"
              title="Matrimonial"
              description="Trusted matrimonial lawyer specializing in divorce, alimony, and family disputes — protecting your interests with care and professionalism."
            />
            <ExpertiseCard 
              image="/family.jpg"
              title="Family Disputes"
              description="Best family dispute lawyer in Delhi NCR dedicated to protecting your rights and achieving fair resolutions in family matters."
            />
            <ExpertiseCard 
              image="/bail.jpg"
              title="Bail Matters"
              description="Trusted bail lawyer in Delhi helping clients secure timely release with expert representation and legal guidance."
            />
            <ExpertiseCard 
              image="/cheque.jpg"
              title="Cheque Bounce"
              description="Expert cheque bounce lawyer in Delhi providing swift legal action and effective solutions for cheque bounce cases."
            />
            <ExpertiseCard 
              image="/civil.jpg"
              title="Civil"
              description="Experienced civil lawyer in Delhi providing expert legal solutions for property, contract, and civil dispute cases."
            />
            <ExpertiseCard 
              image="/criminial.jpg"
              title="Criminal"
              description="Top criminal lawyer in Delhi specializing in defense for serious offenses, ensuring your rights are fiercely protected."
            />
            <ExpertiseCard 
              image="/supreme.jpg"
              title="Supreme Court"
              description="Experienced Supreme Court lawyer in Delhi offering expert representation in high-stakes constitutional, civil, and criminal cases."
            />
            <ExpertiseCard 
              image="/corporate.jpg"
              title="Corporate"
              description="Expert corporate lawyer in Delhi providing strategic legal solutions for businesses, compliance, and corporate disputes."
            />
            <ExpertiseCard 
              image="/cat1.jpg"
              title="CAT Matters"
              description="Expert CAT lawyers in Delhi/NCR — handling government service disputes and administrative appeals efficiently."
            />
            <ExpertiseCard 
              image="/debt.jpg"
              title="Debt Recovery Tribunal"
              description="Expert Debt Recovery Tribunal Lawyers in Delhi/NCR - providing expert support for debt recovery and financial claims efficiently."
            />
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⚖️</span>
                </div>
                LawOnCall
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
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 text-sm text-center md:text-left flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} LawOnCall. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Designed for DPDP Compliance.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="mb-6 p-3 bg-gray-50 inline-block rounded-xl">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const ExpertiseCard = ({ image, title, description }: { image: string, title: string, description: string }) => (
  <div className="group overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
    <div className="relative h-48 overflow-hidden">
      <img 
        src={image} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
    <div className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
        {description}
      </p>
    </div>
  </div>
);

export default LandingPage;
