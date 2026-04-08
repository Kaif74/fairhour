import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Calendar,
  Briefcase,
  CheckCircle,
  X,
  Loader2,
  AlertCircle,
  Edit3,
  Save,
  TrendingUp,
  Zap,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../api';
import { getUserOccupationCredibility, voteOnProof } from '../api/credibility';
import Button from '../components/Button';
import CredibilityBreakdownPanel from '../components/CredibilityBreakdownPanel';
import CredibilityCard from '../components/CredibilityCard';
import CredibilityProofList from '../components/CredibilityProofList';
import CredibilityPills from '../components/CredibilityPills';
import PageTransition from '../components/PageTransition';
import { CATEGORIES } from '../constants';
import { ApiUserOccupationCredibility } from '../types';

// Types
interface ServiceProvider {
  id: string;
  name: string;
  email: string;
  location: string | null;
  bio: string | null;
  skills: string[];
  availability: string[];
  reputationScore: number;
  profileImageUrl: string | null;
  createdAt: string;
}

interface ServiceDetails {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  occupationId: string | null;
  isActive: boolean;
  createdAt: string;
  user: ServiceProvider;
  occupation?: {
    id: string;
    ncoCode: string;
    title: string;
    majorGroup: string;
    skillLevel: number;
    baseMultiplier: number;
    description?: string;
  } | null;
}

interface ValuationData {
  ratePerHour: { min: number; max: number };
  breakdown: {
    skillMultiplier: number;
    skillLevel: number;
    occupationTitle: string | null;
    reputationFactor: number;
    demandFactor: number;
    experienceMultiplier: number;
    experienceScore: number;
    rawMultiplier: number;
    maxAllowedMultiplier: number;
    capTier: 'standard' | 'advanced' | 'professional' | 'elite';
    averageRating: number | null;
    reviewCount: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: ServiceDetails;
}

const ServiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [service, setService] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Avail modal state
  const [showAvailModal, setShowAvailModal] = useState(false);
  const [hours, setHours] = useState(1);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);
  const [availSuccess, setAvailSuccess] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Valuation data
  const [valuation, setValuation] = useState<ValuationData | null>(null);
  const [credibility, setCredibility] = useState<ApiUserOccupationCredibility | null>(null);
  const [credibilityError, setCredibilityError] = useState<string | null>(null);
  const [isVotingProof, setIsVotingProof] = useState(false);

  // Check if current user is the owner
  const isOwner = user && service && user.id === service.userId;

  // Fetch service details and supporting credibility/valuation data together
  useEffect(() => {
    let isCancelled = false;

    const fetchServicePage = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        setCredibilityError(null);
        setService(null);
        setValuation(null);
        setCredibility(null);

        const response = await api.get<ApiResponse>(`/api/services/${id}`, { auth: false });

        if (!response.success || !response.data) {
          throw new Error('Service not found or failed to load');
        }

        const serviceData = response.data as unknown as ServiceDetails;
        let nextValuation: ValuationData | null = null;
        let nextCredibility: ApiUserOccupationCredibility | null = null;
        let nextCredibilityError: string | null = null;

        await Promise.all([
          (async () => {
            try {
              const params = new URLSearchParams({ hours: '1' });
              if (serviceData.occupationId) params.set('occupationId', serviceData.occupationId);
              if (serviceData.userId) params.set('providerId', serviceData.userId);

              const valuationResponse = await api.get<{
                ratePerHour: { min: number; max: number };
                breakdown: ValuationData['breakdown'];
              }>(`/api/valuation/estimate?${params.toString()}`, { auth: false });

              if (valuationResponse.success && valuationResponse.data) {
                nextValuation = valuationResponse.data as unknown as ValuationData;
              }
            } catch {
              nextValuation = null;
            }
          })(),
          (async () => {
            if (!serviceData.occupationId || !serviceData.userId) {
              return;
            }

            try {
              nextCredibility = await getUserOccupationCredibility(
                serviceData.userId,
                serviceData.occupationId
              );
            } catch (credibilityFetchError) {
              nextCredibilityError =
                credibilityFetchError instanceof Error
                  ? credibilityFetchError.message
                  : 'Failed to load provider credibility';
            }
          })(),
        ]);

        if (isCancelled) return;

        setService(serviceData);
        setValuation(nextValuation);
        setCredibility(nextCredibility);
        setCredibilityError(nextCredibilityError);
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to fetch service:', err);
        setError('Service not found or failed to load');
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchServicePage();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  // Handle auto-opening edit modal
  useEffect(() => {
    if (service && isOwner) {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('edit') === 'true') {
        handleEditClick();
        
        // Clean up URL so refresh doesn't keep opening the modal
        navigate(`/service/${service.id}`, { replace: true });
      }
    }
  }, [service, isOwner, location.search, navigate]);

  const refreshCredibility = async () => {
    if (!service?.occupationId || !service.userId) return;
    const credibilityData = await getUserOccupationCredibility(service.userId, service.occupationId);
    setCredibility(credibilityData);
    setCredibilityError(null);
  };

  const handleVoteOnProof = async (
    proofId: string,
    voteType: 'valid' | 'irrelevant' | 'fake'
  ) => {
    if (!user) {
      navigate(`/login?redirect=/service/${id}`);
      return;
    }

    try {
      setIsVotingProof(true);
      setCredibilityError(null);
      await voteOnProof(proofId, voteType);
      await refreshCredibility();
    } catch (error) {
      setCredibilityError(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setIsVotingProof(false);
    }
  };

  // Handle avail service click
  const handleAvailClick = () => {
    if (!user) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/service/${id}`);
      return;
    }

    setShowAvailModal(true);
  };

  // Handle edit service click
  const handleEditClick = () => {
    if (!service) return;

    // Populate edit form with current values
    setEditTitle(service.title);
    setEditDescription(service.description);
    setEditCategory(service.category);
    setEditIsActive(service.isActive);
    setEditError(null);
    setEditSuccess(false);
    setShowEditModal(true);
  };

  // Handle edit submission
  const handleEditSubmit = async () => {
    if (!service || !user) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const response = await api.put<ApiResponse>(`/api/services/${service.id}`, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        isActive: editIsActive,
      });

      if (response.success && response.data) {
        // Update local state with new data
        setService((prev) =>
          prev
            ? {
              ...prev,
              title: editTitle,
              description: editDescription,
              category: editCategory,
              isActive: editIsActive,
            }
            : null
        );

        setEditSuccess(true);

        // Close modal after short delay
        setTimeout(() => {
          setShowEditModal(false);
          setEditSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to update service:', err);
      setEditError('Failed to update service. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle avail submission
  const handleAvailSubmit = async () => {
    if (!service || !user) return;

    try {
      setAvailLoading(true);
      setAvailError(null);

      // Create service request - authenticated user is the requester
      await api.post('/api/exchanges/request', {
        serviceId: service.id,
        hours: hours,
      });

      setAvailSuccess(true);

      // Redirect to activity after short delay
      setTimeout(() => {
        navigate('/activity');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to create exchange:', err);
      // Extract error message from API response
      const errorMessage = err?.message || 'Failed to request service. Please try again.';
      setAvailError(errorMessage);
    } finally {
      setAvailLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get avatar URL
  const getAvatarUrl = (provider: ServiceProvider) => {
    if (provider.profileImageUrl) return provider.profileImageUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=22c55e&color=fff&size=200`;
  };

  const getCapTierLabel = (
    capTier: ValuationData['breakdown']['capTier']
  ): string => {
    switch (capTier) {
      case 'elite':
        return 'Elite cap';
      case 'professional':
        return 'Professional cap';
      case 'advanced':
        return 'Advanced cap';
      default:
        return 'Standard cap';
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50/50 pt-24 pb-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading service details...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !service) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50/50 pt-24 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h2>
              <p className="text-gray-600 mb-6">
                {error || "The service you're looking for doesn't exist."}
              </p>
              <Button onClick={() => navigate('/browse')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Find Help
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const provider = service.user;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 pt-32 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate('/browse')}
              className="flex items-center text-gray-600 hover:text-brand-600 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Find Help
            </button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Service Header */}
              <div className="bg-white rounded-2xl shadow-soft p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold mb-3">
                      {service.category}
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Listed {formatDate(service.createdAt)}
                      </div>
                      {service.isActive ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="text-gray-400">Inactive</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 bg-yellow-50 px-3 py-2 rounded-xl">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="text-lg font-bold text-gray-900">
                      {provider.reputationScore > 0 ? provider.reputationScore.toFixed(1) : '4.5'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="prose prose-gray max-w-none">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About this Service</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {service.description}
                  </p>
                </div>

                {credibility && (
                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-medium text-gray-600">Provider credibility</p>
                      <CredibilityPills
                        declaredLevel={credibility.declaredLevel}
                        badge={credibility.badge}
                        credibilityScore={credibility.credibilityScore}
                      />
                    </div>
                  </div>
                )}

                {/* Cost & Action Button */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-brand-700">
                      <Clock className="w-6 h-6 mr-2" />
                      <span className="text-2xl font-bold">
                        {valuation
                          ? valuation.ratePerHour.min === valuation.ratePerHour.max
                            ? valuation.ratePerHour.min
                            : `${valuation.ratePerHour.min}–${valuation.ratePerHour.max}`
                          : service.occupation?.baseMultiplier ?? '1'
                        }
                      </span>
                      <span className="text-gray-500 ml-2">credits per hour</span>
                    </div>
                    {isOwner ? (
                      <Button onClick={handleEditClick} variant="secondary" className="px-8">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Service
                      </Button>
                    ) : (
                      <Button
                        onClick={handleAvailClick}
                        disabled={!service.isActive}
                        className="px-8"
                      >
                        Ask for Help
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Provider Bio */}
              {provider.bio && (
                <div className="bg-white rounded-2xl shadow-soft p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Provider</h3>
                  <p className="text-gray-600 leading-relaxed">{provider.bio}</p>
                </div>
              )}

              {credibilityError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {credibilityError}
                </div>
              )}

              {credibility && (
                <>
                  <CredibilityBreakdownPanel breakdown={credibility.breakdown} />

                  <div className="rounded-2xl bg-white p-8 shadow-soft">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Proofs and community validation
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Review submitted proofs and help the community validate whether they support this provider&apos;s experience claim.
                        </p>
                      </div>
                      {!user && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/login?redirect=/service/${id}`)}
                        >
                          Sign in to vote
                        </Button>
                      )}
                    </div>

                    <CredibilityProofList
                      proofs={credibility.proofs}
                      canVote={Boolean(user) && !isOwner}
                      isOwner={Boolean(isOwner)}
                      onVote={handleVoteOnProof}
                    />

                    {isVotingProof && (
                      <p className="mt-4 text-sm text-slate-500">Submitting your vote...</p>
                    )}
                  </div>
                </>
              )}
            </motion.div>

            {/* Sidebar - Provider Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Provider Profile */}
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <img
                      src={getAvatarUrl(provider)}
                      alt={provider.name}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg mx-auto"
                    />
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-3 border-white rounded-full"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mt-4">{provider.name}</h3>
                  {isOwner && (
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      Your Service
                    </span>
                  )}
                  {credibility && (
                    <div className="mt-3 flex justify-center">
                      <CredibilityPills
                        declaredLevel={credibility.declaredLevel}
                        badge={credibility.badge}
                        compact
                      />
                    </div>
                  )}
                  {provider.location && (
                    <p className="text-gray-500 flex items-center justify-center mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {provider.location}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Reputation */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Rating</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                      <span className="font-semibold">
                        {provider.reputationScore > 0 ? provider.reputationScore.toFixed(1) : '4.5'}
                      </span>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Member since</span>
                    <span className="font-semibold">{formatDate(provider.createdAt)}</span>
                  </div>
                </div>

                {/* Skills */}
                {provider.skills && provider.skills.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {provider.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                {provider.availability && provider.availability.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Availability
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {provider.availability.map((time, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {credibility && (
                <CredibilityCard credibility={credibility} compact />
              )}

              {/* Skill Valuation Card */}
              {valuation && service.occupationId && (
                <div className="bg-white rounded-2xl shadow-soft p-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                    Skill Valuation
                  </h4>
                  <div className="space-y-3">
                    {/* Skill Level */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600 text-sm">Skill Level</span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        valuation.breakdown.skillLevel === 4 ? 'bg-purple-100 text-purple-700' :
                        valuation.breakdown.skillLevel === 3 ? 'bg-blue-100 text-blue-700' :
                        valuation.breakdown.skillLevel === 2 ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {valuation.breakdown.skillLevel === 4 ? 'Professional' :
                         valuation.breakdown.skillLevel === 3 ? 'Advanced' :
                         valuation.breakdown.skillLevel === 2 ? 'Intermediate' : 'Basic'}
                      </span>
                    </div>

                    {/* Estimated Credits */}
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-brand-50 to-green-50 rounded-xl">
                      <span className="text-gray-600 text-sm">Est. Credits/hr</span>
                      <span className="font-bold text-brand-700">
                        {valuation.ratePerHour.min === valuation.ratePerHour.max
                          ? valuation.ratePerHour.min
                          : `${valuation.ratePerHour.min}–${valuation.ratePerHour.max}`
                        }
                      </span>
                    </div>

                    {/* Skill Multiplier */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600 text-sm">Skill Multiplier</span>
                      <span className="font-semibold">×{valuation.breakdown.skillMultiplier}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600 text-sm">Experience Multiplier</span>
                      <span className="font-semibold">×{valuation.breakdown.experienceMultiplier}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600 text-sm">{getCapTierLabel(valuation.breakdown.capTier)}</span>
                      <span className="font-semibold">up to ×{valuation.breakdown.maxAllowedMultiplier}</span>
                    </div>

                    {/* Reputation */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center text-gray-600 text-sm">
                        <TrendingUp className="w-3.5 h-3.5 mr-1" />
                        Reputation
                      </div>
                      <div className="flex items-center">
                        {valuation.breakdown.averageRating ? (
                          <>
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-current mr-1" />
                            <span className="font-semibold">{valuation.breakdown.averageRating}</span>
                            <span className="text-xs text-gray-400 ml-1">({valuation.breakdown.reviewCount})</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">No reviews yet</span>
                        )}
                      </div>
                    </div>

                    {/* Demand */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center text-gray-600 text-sm">
                        <BarChart2 className="w-3.5 h-3.5 mr-1" />
                        Demand
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        valuation.breakdown.demandFactor >= 1.3 ? 'bg-red-100 text-red-700' :
                        valuation.breakdown.demandFactor >= 1.1 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {valuation.breakdown.demandFactor >= 1.3 ? 'High' :
                         valuation.breakdown.demandFactor >= 1.1 ? 'Medium' : 'Low'}
                      </span>
                    </div>

                    {/* Occupation Name */}
                    {valuation.breakdown.occupationTitle && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-400">NCO Classification</p>
                        <p className="text-sm font-medium text-gray-700">{valuation.breakdown.occupationTitle}</p>
                      </div>
                    )}

                    {valuation.breakdown.maxAllowedMultiplier > 2.5 && (
                      <div className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-3">
                        <p className="text-sm font-semibold text-brand-700">
                          Higher ceiling unlocked
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-brand-700/80">
                          Advanced professionals with strong experience and reviews can earn above the standard range, up to ×{valuation.breakdown.maxAllowedMultiplier}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Action CTA */}
              {isOwner ? (
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-soft p-6 text-white">
                  <h3 className="text-lg font-semibold mb-2">Manage Your Service</h3>
                  <p className="text-blue-100 text-sm mb-4">
                    Update your service details, description, or availability status.
                  </p>
                  <Button
                    onClick={handleEditClick}
                    variant="secondary"
                    className="w-full bg-white text-blue-600 hover:bg-blue-50"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Service
                  </Button>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl shadow-soft p-6 text-white">
                  <h3 className="text-lg font-semibold mb-2">Ready to get started?</h3>
                  <p className="text-brand-100 text-sm mb-4">
                    Connect with {provider.name.split(' ')[0]} and exchange skills today.
                  </p>
                  <Button
                    onClick={handleAvailClick}
                    variant="secondary"
                    className="w-full bg-white text-brand-600 hover:bg-brand-50"
                    disabled={!service.isActive}
                  >
                    Ask for Help
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Avail Modal */}
      <AnimatePresence>
        {showAvailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !availLoading && setShowAvailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {availSuccess ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Help Request Sent!</h3>
                  <p className="text-gray-600">
                    Your service request has been sent to {provider.name}. Redirecting to
                    Activity...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Ask for Help</h3>
                    <button
                      onClick={() => setShowAvailModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={availLoading}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
                      <img
                        src={getAvatarUrl(provider)}
                        alt={provider.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{service.title}</p>
                        <p className="text-sm text-gray-500">by {provider.name}</p>
                      </div>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hours Requested
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setHours(Math.max(1, hours - 1))}
                        className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-semibold"
                        disabled={availLoading}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-3xl font-bold text-brand-600">{hours}</span>
                        <span className="text-gray-500 ml-2">hour{hours > 1 ? 's' : ''}</span>
                      </div>
                      <button
                        onClick={() => setHours(Math.min(8, hours + 1))}
                        className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-semibold"
                        disabled={availLoading}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {availError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {availError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setShowAvailModal(false)}
                      disabled={availLoading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAvailSubmit} disabled={availLoading} className="flex-1">
                      {availLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Request'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !editLoading && setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {editSuccess ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Service Updated!</h3>
                  <p className="text-gray-600">Your service has been updated successfully.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Edit Service</h3>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={editLoading}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        placeholder="Enter service title"
                        disabled={editLoading}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-white"
                        disabled={editLoading}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                        placeholder="Describe your service in detail..."
                        disabled={editLoading}
                      />
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">Service Status</p>
                        <p className="text-sm text-gray-500">
                          {editIsActive
                            ? 'Your service is visible to others'
                            : 'Your service is hidden'}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditIsActive(!editIsActive)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${editIsActive ? 'bg-brand-500' : 'bg-gray-300'
                          }`}
                        disabled={editLoading}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${editIsActive ? 'translate-x-6' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {editError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {editError}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="secondary"
                      onClick={() => setShowEditModal(false)}
                      disabled={editLoading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEditSubmit}
                      disabled={editLoading || !editTitle.trim() || !editDescription.trim()}
                      className="flex-1"
                    >
                      {editLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default ServiceDetailsPage;
