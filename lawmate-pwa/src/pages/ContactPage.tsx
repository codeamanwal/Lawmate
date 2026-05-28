
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Scale, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const contactCards = [
    { icon: Mail, label: 'Email us', value: 'hello@lawoncall.in', sub: 'For general enquiries and partnerships.' },
    { icon: Scale, label: 'For lawyers', value: 'lawyers@lawoncall.in', sub: 'Interested in joining our advocate network? Write to us.' },
    { icon: MapPin, label: 'Based in', value: 'India', sub: 'Serving Delhi NCR at launch, expanding pan-India.' },
    { icon: Clock, label: 'Response time', value: 'Within 24 hours', sub: 'We read every message and reply to every one.' },
  ];

  const CONTACT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzv2DLxvLEN7jmOy2F56a9hOszDz19T-3-UzTjGjYM92bcHACfj67qTwS2FrT14vHJMmg/exec";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        type: "contact",
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
      };

      await fetch(CONTACT_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Since no-cors doesn't return a readable response, we assume success
      setLoading(false);
      setIsSubmitted(true);
      toast.success('Message sent successfully!');
    } catch (error) {
      setLoading(false);
      toast.error('Something went wrong. Please try again or email us directly.');
      console.error('Submission error:', error);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest mb-8"
          >
            <div className="w-1 h-1 rounded-full bg-indigo-600" />
            Get in touch
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-gray-900 leading-[0.95] tracking-tight"
          >
            We'd love to <br /><span className="text-indigo-600 italic tracking-tighter">hear from you.</span>
          </motion.h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-16">
          {/* Left: Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            {contactCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-gray-50 rounded-[28px] border border-gray-100 group hover:border-indigo-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-100/20"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-6 text-indigo-600 shadow-sm border border-gray-50 group-hover:scale-110 transition-transform">
                  <card.icon className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">{card.label}</p>
                <p className="text-xl font-black text-gray-900 mb-2 tracking-tight">{card.value}</p>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 md:p-12 rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/50 sticky top-24"
            >
              {isSubmitted ? (
                <div className="py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">Message received.</h3>
                  <p className="text-gray-500 font-medium max-w-xs mx-auto text-lg leading-relaxed">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="text-indigo-600 font-black text-sm uppercase tracking-widest hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-black text-gray-900 mb-10 tracking-tight">
                    Send us a <span className="text-indigo-600 italic tracking-tighter underline decoration-indigo-100 underline-offset-8">message</span>
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name *</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address *</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="you@example.com"
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject *</label>
                      <select 
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium text-gray-900 appearance-none"
                      >
                        <option value="">Select a topic</option>
                        <option value="General Enquiry">General Enquiry</option>
                        <option value="Join as a Lawyer">Join as a Lawyer</option>
                        <option value="Partnership / Business">Partnership / Business</option>
                        <option value="Feedback">Feedback</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message *</label>
                      <textarea 
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="Tell us what's on your mind..."
                        rows={5}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium text-gray-900 resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 disabled:opacity-70 group"
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                      {!loading && <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
