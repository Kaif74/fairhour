import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import PageTransition from '../components/PageTransition';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      const user = await login({ email, password });

      // Check for redirect parameter (from service details page, etc.)
      const redirectTo = searchParams.get('redirect');

      // Redirect based on onboarding status
      if (user.hasOnboarded) {
        navigate(redirectTo || '/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch {
      // Error is handled in context
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link to="/" className="inline-flex items-center group">
            <div className="bg-brand-500 p-2 rounded-xl text-white mr-2 shadow-glow group-hover:scale-110 transition-transform">
              <Clock className="h-8 w-8" />
            </div>
            <span className="ml-2 text-3xl font-extrabold text-gray-900 tracking-tight">
              FairHour
            </span>
          </Link>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to continue exchanging time.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white py-8 px-4 shadow-soft rounded-2xl sm:px-10 border border-gray-100"
          >
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Login failed</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
              />
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
              />

              <div>
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  className="shadow-brand-500/20 shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New here?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link to="/signup">
                  <Button variant="outline" fullWidth disabled={isLoading}>
                    Create an account
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
