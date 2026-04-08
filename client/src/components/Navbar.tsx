import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

interface NavbarProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isAuthPage) return null;

  const linkClass =
    'text-gray-500 hover:text-brand-600 px-3 py-2 text-sm font-medium transition-colors relative group';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50' : 'bg-transparent'}`}
    >
      {/* Promotional Banner - Only shown to non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 text-white py-2 px-4 text-center">
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs sm:text-sm">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-white/20 backdrop-blur-sm">
              🎉 LIMITED TIME
            </span>
            <span className="font-medium">
              New members get{' '}
              <span className="font-bold underline decoration-yellow-300 underline-offset-2">
                2 hours FREE credit
              </span>
              !
            </span>
            <Link
              to="/signup"
              className="inline-flex items-center font-bold hover:text-yellow-200 transition-colors"
            >
              Sign up now →
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="bg-brand-500 p-2 rounded-xl text-white mr-2 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                <Clock className="h-6 w-6" />
              </div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight group-hover:text-brand-600 transition-colors">
                FairHour
              </span>
            </Link>
            {!isAuthenticated && (
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                <a href="/#how-it-works" className={linkClass}>
                  How it works
                </a>
                <Link to="/browse" className={linkClass}>
                  Find Help
                </Link>
                <Link to="/requests" className={linkClass}>
                  Help Requests
                </Link>
                <a href="/#trust" className={linkClass}>
                  Trust & Safety
                </a>
              </div>
            )}
          </div>

          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className={linkClass}>
                  Home
                </Link>
                <Link to="/profile" className={linkClass}>
                  Profile
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onLogout();
                    navigate('/');
                  }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-semibold"
                >
                  Log in
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-brand-600 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="pt-2 pb-3 space-y-1 px-4">
              {!isAuthenticated && (
                <>
                  <a
                    href="/#how-it-works"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50"
                  >
                    How it works
                  </a>
                  <Link
                    to="/browse"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50"
                  >
                    Find Help
                  </Link>
                  <Link
                    to="/requests"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50"
                  >
                    Help Requests
                  </Link>
                  <a
                    href="/#trust"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50"
                  >
                    Trust & Safety
                  </a>
                </>
              )}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50"
                  >
                    Home
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      onLogout();
                      navigate('/');
                    }}
                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="pt-4 pb-4 border-t border-gray-100 mt-2">
                  <Link
                    to="/login"
                    className="block w-full text-center mb-3 text-gray-600 font-medium"
                  >
                    Log in
                  </Link>
                  <Link to="/signup">
                    <Button fullWidth>Sign up</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
