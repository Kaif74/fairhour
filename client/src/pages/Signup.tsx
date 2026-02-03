import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import PageTransition from '../components/PageTransition';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    // Validation
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    try {
      const user = await register({ name, email, password, location: location || undefined });

      // New users always go to onboarding (hasOnboarded will be false)
      if (user.hasOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch {
      // Error is handled in context
    }
  };

  const displayError = validationError || error;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link to="/" className="inline-flex items-center">
            <div className="bg-brand-500 p-2 rounded-xl text-white mr-2 shadow-glow">
              <Clock className="h-8 w-8" />
            </div>
            <span className="ml-2 text-3xl font-extrabold text-gray-900 tracking-tight">
              FairHour
            </span>
          </Link>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Join the community</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Start trading skills today.</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white py-8 px-4 shadow-soft rounded-2xl sm:px-10 border border-gray-100"
          >
            {/* Error Alert */}
            {displayError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Registration failed</p>
                  <p className="text-sm text-red-600 mt-1">{displayError}</p>
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <Input
                label="Full name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={isLoading}
              />
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
                label="Location (optional)"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA"
                disabled={isLoading}
              />
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                disabled={isLoading}
              />
              <Input
                label="Confirm Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
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
                      Creating account...
                    </>
                  ) : (
                    'Get Started'
                  )}
                </Button>
              </div>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500">
                  Log in
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Signup;
