import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Download,
  ChevronRight,
  X,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../hooks/useAuth';
import api from '../api';

// Types for exchange data
interface ExchangeUser {
  id: string;
  name: string;
  location?: string | null;
  profileImageUrl?: string | null;
}

interface Exchange {
  id: string;
  providerId: string;
  requesterId: string;
  hours: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  providerConfirmed: boolean;
  requesterConfirmed: boolean;
  createdAt: string;
  completedAt: string | null;
  provider: ExchangeUser;
  requester: ExchangeUser;
  userRole: 'provider' | 'requester';
}

interface ExchangesResponse {
  exchanges: Exchange[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const Activity: React.FC = () => {
  const { user } = useAuth();

  const [filterRole, setFilterRole] = useState<'All' | 'Provider' | 'Requester'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'COMPLETED' | 'ACTIVE' | 'PENDING'>(
    'All'
  );
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Data fetching state
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectExchangeId, setRejectExchangeId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch exchanges from API
  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<ExchangesResponse>('/api/exchanges/me');

        if (response.success && response.data?.exchanges) {
          setExchanges(response.data.exchanges);

          // Check if there's an exchange query param to auto-open
          const exchangeId = new URLSearchParams(window.location.search).get('exchange');
          if (exchangeId) {
            const exchange = response.data.exchanges.find((e) => e.id === exchangeId);
            if (exchange) {
              setSelectedExchange(exchange);
            }
            // Clear the query param
            window.history.replaceState({}, '', '/activity');
          }
        }
      } catch (err) {
        console.error('Failed to fetch exchanges:', err);
        setError('Failed to load activity');
      } finally {
        setLoading(false);
      }
    };

    fetchExchanges();
  }, []);

  // Filter exchanges
  const filteredActivity = exchanges.filter((item) => {
    if (filterRole === 'Provider' && item.userRole !== 'provider') return false;
    if (filterRole === 'Requester' && item.userRole !== 'requester') return false;
    if (filterStatus !== 'All' && item.status !== filterStatus) return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const counterparty = item.userRole === 'provider' ? item.requester : item.provider;
      if (!counterparty.name.toLowerCase().includes(search)) return false;
    }

    return true;
  });

  // Accept a pending request (activate)
  const handleAccept = async (exchangeId: string) => {
    try {
      setActionLoading(exchangeId);
      await api.put(`/api/exchanges/${exchangeId}/activate`);

      // Update local state
      setExchanges((prev) =>
        prev.map((ex) => (ex.id === exchangeId ? { ...ex, status: 'ACTIVE' as const } : ex))
      );

      setSelectedExchange(null);
    } catch (err) {
      console.error('Failed to accept request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject a pending request
  const handleReject = async () => {
    if (!rejectExchangeId) return;

    try {
      setActionLoading(rejectExchangeId);
      await api.put(`/api/exchanges/${rejectExchangeId}/reject`, {
        reason: rejectReason || undefined,
      });

      // Remove from local state
      setExchanges((prev) => prev.filter((ex) => ex.id !== rejectExchangeId));

      setShowRejectModal(false);
      setRejectExchangeId(null);
      setRejectReason('');
      setSelectedExchange(null);
    } catch (err) {
      console.error('Failed to reject request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Confirm an exchange (both parties must confirm to complete)
  const handleConfirm = async (exchange: Exchange) => {
    try {
      setActionLoading(exchange.id);
      const response = await api.put<{
        providerConfirmed: boolean;
        requesterConfirmed: boolean;
        status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
        completedAt: string | null;
      }>(`/api/exchanges/${exchange.id}/confirm`);

      // Update local state with confirmation status
      if (response.success && response.data) {
        setExchanges((prev) =>
          prev.map((ex) =>
            ex.id === exchange.id
              ? {
                  ...ex,
                  providerConfirmed: response.data!.providerConfirmed,
                  requesterConfirmed: response.data!.requesterConfirmed,
                  status: response.data!.status,
                  completedAt: response.data!.completedAt,
                }
              : ex
          )
        );

        // Update selected exchange if still open
        setSelectedExchange((prev) =>
          prev?.id === exchange.id
            ? {
                ...prev,
                providerConfirmed: response.data!.providerConfirmed,
                requesterConfirmed: response.data!.requesterConfirmed,
                status: response.data!.status,
                completedAt: response.data!.completedAt,
              }
            : prev
        );
      }
    } catch (err) {
      console.error('Failed to confirm exchange:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (exchangeId: string) => {
    setRejectExchangeId(exchangeId);
    setShowRejectModal(true);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAvatarUrl = (user: ExchangeUser) => {
    if (user.profileImageUrl) return user.profileImageUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=22c55e&color=fff`;
  };

  // Count pending requests for the user (as provider)
  const pendingRequestsCount = exchanges.filter(
    (ex) => ex.status === 'PENDING' && ex.userRole === 'provider'
  ).length;

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50/50 pt-20 pb-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading activity...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recent Activity</h1>
              <p className="text-gray-500 mt-1">Full history of your time exchanges.</p>
            </div>
            {pendingRequestsCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">
                  {pendingRequestsCount} pending request{pendingRequestsCount > 1 ? 's' : ''}{' '}
                  awaiting your response
                </span>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center text-sm font-medium text-gray-500 mr-2">
              <Filter className="w-4 h-4 mr-2" /> Filters:
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="bg-gray-50 border-transparent rounded-lg text-sm px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="All">All Roles</option>
              <option value="Provider">I'm the provider</option>
              <option value="Requester">I'm the requester</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-gray-50 border-transparent rounded-lg text-sm px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="All">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <div className="ml-auto relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search activity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-transparent rounded-lg text-sm focus:ring-brand-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Activity Table/List */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Counterparty</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Hours</div>
            </div>
            <div className="divide-y divide-gray-50">
              {filteredActivity.map((item) => {
                const counterparty = item.userRole === 'provider' ? item.requester : item.provider;
                const isPending = item.status === 'PENDING';
                const isProviderPending = isPending && item.userRole === 'provider';

                return (
                  <motion.div
                    layout
                    key={item.id}
                    onClick={() => setSelectedExchange(item)}
                    className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors cursor-pointer group ${isProviderPending ? 'bg-yellow-50/50' : ''}`}
                  >
                    <div className="col-span-1 md:col-span-4 flex items-center">
                      <img
                        src={getAvatarUrl(counterparty)}
                        alt=""
                        className="w-10 h-10 rounded-full mr-3 border border-gray-100"
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{counterparty.name}</p>
                        <p className="text-xs text-gray-500 md:hidden">
                          {formatDate(item.createdAt)}
                        </p>
                        {isProviderPending && (
                          <p className="text-xs text-yellow-600 font-medium">
                            Waiting for your response
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="hidden md:block col-span-2 text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </div>
                    <div className="hidden md:block col-span-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-md font-medium ${item.userRole === 'provider' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'}`}
                      >
                        {item.userRole === 'provider' ? 'Provider' : 'Requester'}
                      </span>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="col-span-1 md:col-span-2 text-right font-bold text-gray-900 flex items-center justify-end">
                      <span
                        className={
                          item.userRole === 'provider' ? 'text-green-600' : 'text-gray-900'
                        }
                      >
                        {item.userRole === 'provider' ? '+' : '-'}
                        {item.hours} hrs
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 ml-2 group-hover:text-gray-500" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {filteredActivity.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                {exchanges.length === 0
                  ? 'No activity yet. Start by requesting a service!'
                  : 'No activity found matching your filters.'}
              </div>
            )}
          </div>
        </div>

        {/* Details Modal */}
        <AnimatePresence>
          {selectedExchange && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
              onClick={() => setSelectedExchange(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-lg font-bold text-gray-900">Exchange Details</h3>
                  <button
                    onClick={() => setSelectedExchange(null)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {(() => {
                    const counterparty =
                      selectedExchange.userRole === 'provider'
                        ? selectedExchange.requester
                        : selectedExchange.provider;

                    return (
                      <>
                        <div className="flex items-center">
                          <img
                            src={getAvatarUrl(counterparty)}
                            alt={counterparty.name}
                            className="w-16 h-16 rounded-full mr-4 border-2 border-gray-100"
                          />
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">{counterparty.name}</h4>
                            <p className="text-gray-500 text-sm">
                              {selectedExchange.userRole === 'provider'
                                ? 'Requested your service'
                                : 'Providing service to you'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Status</span>
                            <span
                              className={`font-bold px-2 py-0.5 rounded-md ${getStatusStyle(selectedExchange.status)}`}
                            >
                              {selectedExchange.status}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Date</span>
                            <span className="font-medium text-gray-900">
                              {formatDate(selectedExchange.createdAt)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Your Role</span>
                            <span
                              className={`font-medium px-2 py-0.5 rounded-md ${selectedExchange.userRole === 'provider' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'}`}
                            >
                              {selectedExchange.userRole === 'provider' ? 'Provider' : 'Requester'}
                            </span>
                          </div>
                          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                            <span className="text-gray-900 font-bold">Hours</span>
                            <span
                              className={`text-xl font-black ${selectedExchange.userRole === 'provider' ? 'text-green-600' : 'text-brand-600'}`}
                            >
                              {selectedExchange.userRole === 'provider' ? '+' : ''}
                              {selectedExchange.hours}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons based on status and role */}
                        <div className="flex gap-3 pt-2">
                          {selectedExchange.status === 'PENDING' &&
                            selectedExchange.userRole === 'provider' && (
                              <>
                                <Button
                                  onClick={() => handleAccept(selectedExchange.id)}
                                  disabled={actionLoading === selectedExchange.id}
                                  className="flex-1 shadow-lg shadow-brand-500/20"
                                >
                                  {actionLoading === selectedExchange.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4 mr-2" />
                                  )}
                                  Accept Request
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => openRejectModal(selectedExchange.id)}
                                  className="flex-1 text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200"
                                  disabled={actionLoading === selectedExchange.id}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}

                          {selectedExchange.status === 'PENDING' &&
                            selectedExchange.userRole === 'requester' && (
                              <Button
                                variant="outline"
                                onClick={() => openRejectModal(selectedExchange.id)}
                                fullWidth
                                className="text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200"
                                disabled={actionLoading === selectedExchange.id}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel Request
                              </Button>
                            )}

                          {selectedExchange.status === 'ACTIVE' && (
                            <div className="space-y-4">
                              {/* Confirmation Status */}
                              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <p className="text-sm font-medium text-gray-700 mb-3">
                                  Confirmation Status
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Provider confirmed</span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${selectedExchange.providerConfirmed ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                                  >
                                    {selectedExchange.providerConfirmed ? '✓ Yes' : 'Pending'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Requester confirmed</span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${selectedExchange.requesterConfirmed ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                                  >
                                    {selectedExchange.requesterConfirmed ? '✓ Yes' : 'Pending'}
                                  </span>
                                </div>
                              </div>

                              {/* Provider's confirm button */}
                              {selectedExchange.userRole === 'provider' &&
                                !selectedExchange.providerConfirmed && (
                                  <Button
                                    onClick={() => handleConfirm(selectedExchange)}
                                    disabled={actionLoading === selectedExchange.id}
                                    fullWidth
                                    className="shadow-lg shadow-brand-500/20"
                                  >
                                    {actionLoading === selectedExchange.id ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Check className="w-4 h-4 mr-2" />
                                    )}
                                    Confirm Service Delivered
                                  </Button>
                                )}

                              {/* Provider waiting message */}
                              {selectedExchange.userRole === 'provider' &&
                                selectedExchange.providerConfirmed &&
                                !selectedExchange.requesterConfirmed && (
                                  <div className="w-full text-center p-4 bg-blue-50 rounded-xl">
                                    <p className="text-blue-700 font-medium">
                                      ✓ You confirmed. Waiting for requester to confirm receipt.
                                    </p>
                                  </div>
                                )}

                              {/* Requester's confirm button */}
                              {selectedExchange.userRole === 'requester' &&
                                !selectedExchange.requesterConfirmed && (
                                  <Button
                                    onClick={() => handleConfirm(selectedExchange)}
                                    disabled={actionLoading === selectedExchange.id}
                                    fullWidth
                                    className="shadow-lg shadow-brand-500/20"
                                  >
                                    {actionLoading === selectedExchange.id ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Check className="w-4 h-4 mr-2" />
                                    )}
                                    Confirm Service Received
                                  </Button>
                                )}

                              {/* Requester waiting message */}
                              {selectedExchange.userRole === 'requester' &&
                                selectedExchange.requesterConfirmed &&
                                !selectedExchange.providerConfirmed && (
                                  <div className="w-full text-center p-4 bg-blue-50 rounded-xl">
                                    <p className="text-blue-700 font-medium">
                                      ✓ You confirmed. Waiting for provider to confirm delivery.
                                    </p>
                                  </div>
                                )}
                            </div>
                          )}

                          {selectedExchange.status === 'COMPLETED' && (
                            <div className="w-full text-center p-4 bg-green-50 rounded-xl">
                              <p className="text-green-700 font-medium">
                                ✓ Both parties confirmed. Exchange completed!
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reject Modal */}
        <AnimatePresence>
          {showRejectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowRejectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {selectedExchange?.userRole === 'provider' ? 'Reject Request' : 'Cancel Request'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedExchange?.userRole === 'provider'
                    ? 'Optionally provide a reason for rejecting this request:'
                    : 'Are you sure you want to cancel this request?'}
                </p>
                {selectedExchange?.userRole === 'provider' && (
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none mb-4"
                    rows={3}
                  />
                )}
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={actionLoading === rejectExchangeId}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {actionLoading === rejectExchangeId ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {selectedExchange?.userRole === 'provider' ? 'Reject' : 'Cancel Request'}
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

export default Activity;
