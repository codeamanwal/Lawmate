import { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  ConfirmationResult
} from 'firebase/auth';


import { initializeApp } from 'firebase/app';
import axios from 'axios';
import toast from 'react-hot-toast';

const firebaseConfig = {
  // These should be in .env
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

interface AuthContextType {
  user: any;
  loading: boolean;
  sendOtp: (phone: string) => Promise<ConfirmationResult>;
  verifyOtp: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string, role?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check if we have a LAWYER token stored locally
    const token = localStorage.getItem('token');
    let isLawyer = false;
    
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.role === 'LAWYER') {
            isLawyer = true;
          }
        }
      } catch (e) {
        console.error("Failed to parse local JWT token:", e);
      }
    }

    if (isLawyer) {
      axios.get(`${import.meta.env.VITE_API_URL}/api/profiles/lawyer/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => {
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          localStorage.removeItem('token');
          setUser(null);
        }
        setLoading(false);
      }).catch(() => {
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
      });
      
      auth.signOut().catch(() => {});
      return;
    }

    // 2. Client / no token Firebase flow
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        const intendedRole = localStorage.getItem('intendedRole');
        try {
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
            idToken,
            role: intendedRole
          });
          const { token: verifiedToken, user: backendUser } = response.data;
          localStorage.setItem('token', verifiedToken);
          setUser(backendUser);
          const showToast = sessionStorage.getItem('showSignInToast');
          if (showToast === 'true') {
            toast.success('Signed in successfully!');
            sessionStorage.removeItem('showSignInToast');
          }
        } catch (error: any) {
          console.error('Backend auth failed', error);
          if (error.response?.status === 403) {
            await auth.signOut();
            localStorage.removeItem('token');
            setUser(null);
            toast.error(error.response?.data?.error || 'Invalid credentials');
          } else {
            setUser(null);
          }
        }
      } else {
        const currentToken = localStorage.getItem('token');
        let currentRole = null;
        if (currentToken) {
          try {
            const parts = currentToken.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              currentRole = payload.role;
            }
          } catch (e) {}
        }
        
        if (currentRole !== 'LAWYER') {
          localStorage.removeItem('token');
          localStorage.removeItem('intendedRole');
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendOtp = async (phone: string) => {
    localStorage.setItem('intendedRole', 'CLIENT');
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible'
    });
    return signInWithPhoneNumber(auth, phone, recaptchaVerifier);
  };

  const verifyOtp = async (confirmationResult: ConfirmationResult, otp: string) => {
    sessionStorage.setItem('showSignInToast', 'true');
    await confirmationResult.confirm(otp);
  };

  const signupWithEmail = async (email: string, pass: string) => {
    localStorage.setItem('intendedRole', 'CLIENT');
    await createUserWithEmailAndPassword(auth, email, pass);
  };
  
  const loginWithEmail = async (email: string, pass: string, role?: string) => {
    if (role) localStorage.setItem('intendedRole', role);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { 
        email, 
        password: pass,
        role 
      });
      const { token, user: backendUser } = response.data;
      localStorage.setItem('token', token);
      setUser(backendUser);
      sessionStorage.removeItem('showSignInToast');
      await auth.signOut().catch(() => {});
      toast.success('Signed in successfully!');
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(error.response.data.error);
      }
      sessionStorage.setItem('showSignInToast', 'true');
      await signInWithEmailAndPassword(auth, email, pass);
    }
  };

  const forgotPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await auth.signOut();
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData: any) => {
    setUser((prev: any) => ({ ...prev, ...userData }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      sendOtp, 
      verifyOtp, 
      signupWithEmail,
      loginWithEmail, 
      forgotPassword,
      logout, 
      updateUser 
    }}>

      {children}
      <div id="recaptcha-container"></div>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
