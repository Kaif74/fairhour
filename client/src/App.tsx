import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Browse from './pages/Browse';
import Profile from './pages/Profile';
import MyServices from './pages/MyServices';
import MyRequests from './pages/MyRequests';
import Messages from './pages/Messages';
import Activity from './pages/Activity';
import ServiceDetails from './pages/ServiceDetails';
import BrowseRequests from './pages/BrowseRequests';
import CreateRequest from './pages/CreateRequest';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Loading spinner for auth check
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Protected route wrapper - redirects to onboarding if not onboarded
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if not completed
  if (!user.hasOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

// Onboarding route - only for authenticated users who haven't onboarded
const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If already onboarded, go to dashboard
  if (user.hasOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Auth route - redirects authenticated users away
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    // Redirect based on onboarding status
    if (user.hasOnboarded) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const isAuthenticated = !!user;

  // Show loading while checking session
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} onLogout={logout} />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />

        {/* Auth routes - redirect if logged in */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthRoute>
              <Signup />
            </AuthRoute>
          }
        />

        {/* Onboarding - only for users who haven't onboarded */}
        <Route
          path="/onboarding"
          element={
            <OnboardingRoute>
              <Onboarding />
            </OnboardingRoute>
          }
        />

        {/* Protected routes - require auth + onboarding */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-services"
          element={
            <ProtectedRoute>
              <MyServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-requests"
          element={
            <ProtectedRoute>
              <MyRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          }
        />

        {/* Browse is public */}
        <Route path="/browse" element={<Browse />} />

        {/* Browse requests is public, creating requires auth */}
        <Route path="/requests" element={<BrowseRequests />} />
        <Route
          path="/requests/new"
          element={
            <ProtectedRoute>
              <CreateRequest />
            </ProtectedRoute>
          }
        />

        {/* Service details is public */}
        <Route path="/service/:id" element={<ServiceDetails />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
