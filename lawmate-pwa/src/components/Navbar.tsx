
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Gavel } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Gavel className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">LawOnCall</span>
      </Link>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link 
              to={user.role === 'LAWYER' ? "/lawyer/dashboard" : "/dashboard"} 
              className="text-gray-600 hover:text-indigo-600 font-bold text-sm transition-colors"
            >
              Dashboard
            </Link>
            {user.role === 'CLIENT' && (
              <Link to="/my-bookings" className="text-gray-600 hover:text-indigo-600 font-bold text-sm transition-colors">
                My Bookings
              </Link>
            )}
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] text-white font-black">
                {user.name?.[0] || user.fullName?.[0] || 'U'}
              </div>
              <span className="text-xs font-black text-gray-900">{user.name || user.fullName}</span>
              <button 
                onClick={() => { logout(); navigate('/'); }}
                className="ml-2 p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link 
              to="/lawyer/register" 
              className="text-gray-600 hover:text-indigo-600 font-bold text-sm"
            >
              Join as Advocate
            </Link>
            <Link 
              to="/auth" 
              className="bg-indigo-600 text-white px-5 py-2 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md text-sm"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
