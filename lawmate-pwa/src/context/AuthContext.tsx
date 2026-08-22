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
  loginWithToken: (token: string, user: any) => void;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check if we have a LAWYER or CLIENT token stored locally
    const token = localStorage.getItem('token');
    let currentRole: string | null = null;
    let unsubscribe: (() => void) | null = null;
    
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          currentRole = payload.role;
        }
      } catch (e) {
        console.error("Failed to parse local JWT token:", e);
      }
    }

    const setupFirebaseFlow = () => {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
            await auth.signOut();
            localStorage.removeItem('token');
            setUser(null);
            toast.error(error.response?.data?.error || 'Authentication synchronization failed. Please try again.');
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
    };

    if (currentRole === 'LAWYER') {
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

    if (currentRole === 'CLIENT') {
      axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => {
        if (res.data.success) {
          setUser(res.data.user);
          setLoading(false);
        } else {
          localStorage.removeItem('token');
          setUser(null);
          setupFirebaseFlow();
        }
      }).catch(() => {
        localStorage.removeItem('token');
        setUser(null);
        setupFirebaseFlow();
      });
      
      auth.signOut().catch(() => {});
      return;
    }

    // 2. Client / no token Firebase flow
    setupFirebaseFlow();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
  
  const loginWithEmail = async (emailOrPhone: string, pass: string, role?: string) => {
    if (role) localStorage.setItem('intendedRole', role);
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      phone: emailOrPhone,
      email: emailOrPhone,
      password: pass,
      role
    });
    const { token: verifiedToken, user: backendUser } = response.data;
    localStorage.setItem('token', verifiedToken);
    setUser(backendUser);
    toast.success('Signed in successfully!');
  };

  const loginWithToken = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('intendedRole', userData.role || 'CLIENT');
    setUser(userData);
  };

  const forgotPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('intendedRole');
    localStorage.removeItem('intake_draft'); // Clear form draft so next user gets a clean form
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
      loginWithToken,
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
