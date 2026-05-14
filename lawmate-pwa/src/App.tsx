
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import IntakeForm from './pages/IntakeForm';
import Dashboard from './pages/Dashboard';
import PaymentPage from './pages/PaymentPage';
import SuccessPage from './pages/SuccessPage';
import EditProfile from './pages/EditProfile';
import AuthPage from './pages/AuthPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import HowItWorks from './pages/HowItWorks';
import BookingPage from './pages/BookingPage';
import MyBookings from './pages/MyBookings';
import LawyerSignup from './pages/LawyerSignup';
import PaymentSuccess from './pages/PaymentSuccess';
import LawyerOnboarding from './pages/LawyerOnboarding';
import LawyerDashboard from './pages/LawyerDashboard';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import { AuthProvider } from './context/AuthContext';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/get-started" element={<IntakeForm />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/success" element={<SuccessPage />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/lawyer/register" element={<LawyerSignup />} />
              <Route path="/lawyer/onboarding" element={<LawyerOnboarding />} />
              <Route path="/lawyer/dashboard" element={<LawyerDashboard />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Routes>

          </main>
          <Toaster position="bottom-center" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
