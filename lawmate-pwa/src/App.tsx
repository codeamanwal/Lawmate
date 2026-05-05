
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
            </Routes>

          </main>
          <Toaster position="bottom-center" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
