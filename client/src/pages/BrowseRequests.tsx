import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Clock,
  MapPin,
  User,
  Star,
  Loader2,
  ChevronDown,
  HandHelping,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../hooks/useAuth';
import api from '../api';

// Categories matching the service categories
const CATEGORIES = [
  'All Categories',
  'Graphic Design',
  'Writing',
  'Gardening',
  'Coding',
  'Moving Help',
  'Language Tutoring',
  'Dog Walking',
  'Carpentry',
  'Cleaning',
  'Accounting',
  'Photography',
  'Cooking',
  'Music Lessons',
  'Fitness Training',
  'Car Repair',
  'Tutoring',
  'Home Repairs',
  'Tech Support',
  'Pet Care',
  'Event Planning',
];

interface ServiceRequest {
  id: string;
  requesterId: string;
  title: string;
  serviceCategory: string;
  description: string;
  hours: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  requester: {
    id: string;
    name: string;
    location?: string;
    reputationScore?: number;
    profileImageUrl?: string;
  };
}

const BrowseRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = !!user;

  // State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showOfferModal, setShowOfferModal] = useState<ServiceRequest | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);

  // Fetch requests (public - no auth required)
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedCategory !== 'All Categories') {
          params.set('serviceCategory', selectedCategory);
        }

        const response: any = await api.get(`/api/requests?${params.toString()}`);
        if (response.success && response.data?.requests) {
          // Filter out user's own requests if authenticated
          const otherRequests = isAuthenticated
            ? response.data.requests.filter((r: ServiceRequest) => r.requesterId !== user?.id)
            : response.data.requests;
          setRequests(otherRequests);
        }
      } catch (err) {
        console.error('Failed to fetch requests:', err);
        setError('Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [selectedCategory, user?.id, isAuthenticated]);

  // Filter by search
  const filteredRequests = requests.filter(
    (req) =>
      req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle offer to help
  const handleOfferClick = (request: ServiceRequest) => {
    if (!isAuthenticated) {
      // Redirect to login
      navigate('/login');
      return;
    }
    setShowOfferModal(request);
  };

  const handleOfferToHelp = async () => {
    if (!showOfferModal) return;

    try {
      setOfferLoading(true);
      // Create an exchange where the current user is the provider
      await api.post('/api/exchanges', {
        requesterId: showOfferModal.requesterId,
        hours: showOfferModal.hours,
      });

      // Update request status
      await api.put(`/api/requests/${showOfferModal.id}/status`, {
        status: 'IN_PROGRESS',
      });

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== showOfferModal.id));
      setShowOfferModal(null);
    } catch (err: any) {
      console.error('Failed to offer help:', err);
      alert(err.message || 'Failed to offer help');
    } finally {
      setOfferLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getAvatarUrl = (name: string, imageUrl?: string) => {
    if (imageUrl) return imageUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=22c55e&color=fff&size=100`;
  };

  // Main render (public - no auth check early return)

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Requests</h1>
            <p className="text-gray-500">
              See what people need help with and offer your skills in return for credits.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white cursor-pointer min-w-[200px]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-red-100">
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <HandHelping className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
              <p className="text-gray-500">There are no open requests matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      {/* Category Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-semibold">
                          {request.serviceCategory}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(request.createdAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {request.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {request.description}
                      </p>

                      {/* Hours */}
                      <div className="flex items-center mb-4 text-sm">
                        <Clock className="w-4 h-4 mr-2 text-brand-500" />
                        <span className="font-semibold text-gray-900">{request.hours} hour(s)</span>
                        <span className="text-gray-400 ml-1">offered</span>
                      </div>

                      {/* Requester Info */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center">
                          <img
                            src={getAvatarUrl(
                              request.requester.name,
                              request.requester.profileImageUrl
                            )}
                            alt={request.requester.name}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {request.requester.name}
                            </p>
                            {request.requester.location && (
                              <p className="text-xs text-gray-400 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {request.requester.location}
                              </p>
                            )}
                          </div>
                        </div>
                        {request.requester.reputationScore !== undefined &&
                          request.requester.reputationScore > 0 && (
                            <div className="flex items-center text-yellow-500">
                              <Star className="w-4 h-4 mr-1 fill-current" />
                              <span className="text-sm font-medium">
                                {request.requester.reputationScore.toFixed(1)}
                              </span>
                            </div>
                          )}
                      </div>

                      {/* Action Button */}
                      <Button fullWidth className="mt-4" onClick={() => handleOfferClick(request)}>
                        <HandHelping className="w-4 h-4 mr-2" />
                        {isAuthenticated ? 'Offer Help' : 'Sign in to Help'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Offer Modal */}
        <AnimatePresence>
          {showOfferModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowOfferModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Your Help Offer</h3>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">{showOfferModal.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{showOfferModal.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Requested by: {showOfferModal.requester.name}
                    </span>
                    <span className="font-semibold text-brand-600">
                      {showOfferModal.hours} hour(s)
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  By offering to help, you agree to provide this service. Once accepted by the
                  requester, you'll earn{' '}
                  <strong className="text-brand-600">{showOfferModal.hours} hour(s)</strong> upon
                  completion.
                </p>

                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth onClick={() => setShowOfferModal(null)}>
                    Cancel
                  </Button>
                  <Button fullWidth onClick={handleOfferToHelp} disabled={offerLoading}>
                    {offerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Help Offer'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default BrowseRequests;
