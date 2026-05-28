import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <img src="/logo-main.png" alt="LawOnCall Logo" className="h-9 sm:h-10 md:h-11 w-auto object-contain" />
            <span className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">Law<span className="text-indigo-600">OnCall</span></span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/about" className="text-gray-500 hover:text-indigo-600 font-bold text-sm transition-colors uppercase tracking-widest text-[10px]">About</Link>
            <Link to="/contact" className="text-gray-500 hover:text-indigo-600 font-bold text-sm transition-colors uppercase tracking-widest text-[10px]">Contact</Link>
            <div className="h-4 w-[1px] bg-gray-200" />
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
                  className="px-4 py-2 text-indigo-600 border border-indigo-100 rounded-full font-bold text-sm hover:bg-indigo-50 transition-all"
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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-5 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-4">
            <Link to="/about" className="text-gray-600 hover:text-indigo-600 font-bold text-sm block px-2 py-1" onClick={() => setIsOpen(false)}>About</Link>
            <Link to="/contact" className="text-gray-600 hover:text-indigo-600 font-bold text-sm block px-2 py-1" onClick={() => setIsOpen(false)}>Contact</Link>
            
            {user ? (
              <>
                <Link 
                  to={user.role === 'LAWYER' ? "/lawyer/dashboard" : "/dashboard"} 
                  className="text-gray-600 hover:text-indigo-600 font-bold text-sm block px-2 py-1"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                {user.role === 'CLIENT' && (
                  <Link 
                    to="/my-bookings" 
                    className="text-gray-600 hover:text-indigo-600 font-bold text-sm block px-2 py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    My Bookings
                  </Link>
                )}
                <div className="h-[1px] bg-gray-100 my-2" />
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 shadow-sm w-fit mx-2">
                  <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] text-white font-black">
                    {user.name?.[0] || user.fullName?.[0] || 'U'}
                  </div>
                  <span className="text-xs font-black text-gray-900">{user.name || user.fullName}</span>
                </div>
                <button 
                  onClick={() => { logout(); navigate('/'); setIsOpen(false); }}
                  className="flex items-center gap-2 text-red-600 font-bold text-sm px-2 py-1 mt-1"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <div className="h-[1px] bg-gray-100 my-2" />
                <div className="flex flex-col gap-3 px-2">
                  <Link 
                    to="/lawyer/register" 
                    className="text-center py-2.5 text-indigo-600 border border-indigo-100 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all block"
                    onClick={() => setIsOpen(false)}
                  >
                    Join as Advocate
                  </Link>
                  <Link 
                    to="/auth" 
                    className="bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm text-center text-sm block"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
