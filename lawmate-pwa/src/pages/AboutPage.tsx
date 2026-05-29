
import { motion } from 'framer-motion';
import { Users, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  const stats = [
    { number: '60', label: 'Minutes or less', sub: 'Average response time' },
    { number: '10k+', label: 'Consultations', sub: 'Completed successfully' },
    { number: '100%', label: 'Verified Experts', sub: 'Bar council registered' },
  ];

  const values = [
    {
      id: '01',
      title: 'Speed without compromise',
      desc: 'A verified lawyer, matched to your issue, within 60 minutes. Legal help that moves at the pace of your life.',
      icon: Clock,
    },
    {
      id: '02',
      title: 'Radical accessibility',
      desc: 'Plain language. Transparent pricing. No hidden fees. Legal guidance that doesn\'t require a law degree to understand.',
      icon: Users,
    },
    {
      id: '03',
      title: 'Trust above everything',
      desc: 'Every advocate on our platform is bar council registered, verified, and accountable. Your case details stay private, always.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-indigo-50/30 -z-10" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest mb-8"
            >
              <div className="w-1 h-1 rounded-full bg-indigo-600" />
              Our Story
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-gray-900 leading-[0.95] tracking-tight mb-8"
            >
              Built for <span className="text-indigo-600 italic">every</span> Indian who needs legal help.
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 md:p-12 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-indigo-100/20 border-l-8 border-l-indigo-600 mb-12"
            >
              <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed italic">
                "At LawOnCall, we are transforming how our people access legal help — making legal consultation <span className="text-indigo-600">faster</span>, <span className="text-indigo-600">simpler</span>, and <span className="text-indigo-600">more accessible</span>."
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-black text-gray-900 mb-8 leading-tight">
              Why we <span className="text-indigo-600 italic">exist</span>
            </h2>
            <div className="space-y-6 text-lg text-gray-600 font-medium leading-relaxed">
              <p>
                Legal problems don't wait for business hours. A property dispute, an unfair dismissal, a family matter — these crises arrive without notice and demand immediate, trustworthy guidance. Yet for most Indians, getting that guidance means days of searching, waiting, and spending money they don't have.
              </p>
              <p>
                LawOnCall was built to change that. We believe access to legal help is not a privilege reserved for the few — it is a right that every person deserves. Our platform connects verified, bar council-registered advocates with people who need them, in under 60 minutes, from anywhere in India.
              </p>
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all"
              >
                <div>
                  <p className="text-4xl font-black text-indigo-600 mb-1 tracking-tighter">{stat.number}</p>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-widest">{stat.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 italic">{stat.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Core Principles</p>
            <h2 className="text-4xl font-black text-gray-900 uppercase">What we stand for</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 text-8xl font-black text-gray-50 -z-10 group-hover:text-indigo-50/50 transition-colors">
                  {value.id}
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 text-indigo-600 group-hover:scale-110 transition-transform">
                  <value.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-4 tracking-tight">{value.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight uppercase tracking-tight">
            Ready to get <span className="text-indigo-400 italic">expert</span> legal advice?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              to="/get-started" 
              className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-500/20 group"
            >
              Start Consultation <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/auth" 
              className="px-10 py-5 bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest hover:bg-white/20 transition-all"
            >
              Join our network
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-12 border-t border-gray-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src="/footer-logo.jpeg" alt="LawOnCall Logo" className="h-10 w-auto object-contain" />
          <span className="text-xl font-bold text-gray-900 tracking-tight">LawOnCall</span>
        </div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
          © 2026 LawOnCall • Made in India with ❤️
        </p>
      </footer>
    </div>
  );
};

export default AboutPage;
