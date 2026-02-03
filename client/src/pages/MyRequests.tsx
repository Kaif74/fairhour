import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    CheckCircle,
    Clock,
    MoreHorizontal,
    User,
    Loader2,
    AlertCircle,
    Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../hooks/useAuth';
import api from '../api';

interface Exchange {
    id: string;
    providerId: string;
    requesterId: string;
    hours: number;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
    createdAt: string;
    completedAt: string | null;
    providerConfirmed?: boolean;
    requesterConfirmed?: boolean;
    provider: { id: string; name: string; profileImageUrl?: string };
    requester: { id: string; name: string; profileImageUrl?: string };
    service?: { id: string; title: string; category: string };
}

interface ExchangesData {
    exchanges: Exchange[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

const MyRequests: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'All' | 'PENDING' | 'ACTIVE' | 'COMPLETED'>('All');

    // Data state
    const [exchanges, setExchanges] = useState<Exchange[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Action state
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch exchanges where user is the requester
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get<ExchangesData>('/api/exchanges/me');

                if (response.success && response.data?.exchanges) {
                    // Filter to only show exchanges where user is the requester
                    const myRequests = response.data.exchanges.filter((e) => e.requesterId === user?.id);
                    setExchanges(myRequests);
                }
            } catch (err) {
                console.error('Failed to fetch requests:', err);
                setError('Failed to load your requests');
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [user?.id]);

    // Filter exchanges by status
    const filteredRequests = exchanges.filter(
        (req) => activeTab === 'All' || req.status === activeTab
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'ACTIVE':
                return 'bg-blue-100 text-blue-800';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Handle confirm receipt (for requester)
    const handleConfirmReceipt = async (exchangeId: string) => {
        try {
            setActionLoading(exchangeId);
            await api.put(`/api/exchanges/${exchangeId}/confirm`);

            // Update local state
            setExchanges((prev) =>
                prev.map((e) => {
                    if (e.id === exchangeId) {
                        const updated = { ...e, requesterConfirmed: true };
                        // Check if both confirmed
                        if (updated.providerConfirmed && updated.requesterConfirmed) {
                            updated.status = 'COMPLETED';
                            updated.completedAt = new Date().toISOString();
                        }
                        return updated;
                    }
                    return e;
                })
            );
        } catch (err) {
            console.error('Failed to confirm receipt:', err);
        } finally {
            setActionLoading(null);
        }
    };

    // Handle cancel request (for pending requests)
    const handleCancelRequest = async (exchangeId: string) => {
        if (!confirm('Are you sure you want to cancel this request?')) return;

        try {
            setActionLoading(exchangeId);
            await api.put(`/api/exchanges/${exchangeId}/reject`, { reason: 'Cancelled by requester' });

            // Remove from local state
            setExchanges((prev) => prev.filter((e) => e.id !== exchangeId));
        } catch (err) {
            console.error('Failed to cancel request:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const getAvatarUrl = (name: string, imageUrl?: string) => {
        if (imageUrl) return imageUrl;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=22c55e&color=fff&size=100`;
    };

    if (loading) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-gray-50/50 pt-20 pb-12 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-gray-50/50 pt-20 pb-12">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header with Create Request Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
                        <Link to="/requests/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Request
                            </Button>
                        </Link>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            {error}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-8 w-full sm:w-auto inline-flex">
                        {(['All', 'PENDING', 'ACTIVE', 'COMPLETED'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                        ? 'bg-gray-100 text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    {/* Request List */}
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filteredRequests.length > 0 ? (
                                filteredRequests.map((req) => (
                                    <motion.div
                                        key={req.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(req.status)}`}
                                                >
                                                    {req.status}
                                                </span>
                                                <span className="text-xs text-gray-400">{formatDate(req.createdAt)}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {req.service?.title || `${req.hours}h Exchange`}
                                            </h3>
                                            <div className="flex items-center mt-2">
                                                <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                                    <img
                                                        src={getAvatarUrl(req.provider.name, req.provider.profileImageUrl)}
                                                        alt={req.provider.name}
                                                        className="w-5 h-5 rounded-full mr-2"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {req.provider.name}
                                                    </span>
                                                </div>
                                                <div className="ml-4 flex items-center text-sm text-gray-500">
                                                    <Clock className="w-4 h-4 mr-1 text-brand-500" />
                                                    <span className="font-semibold text-gray-900">{req.hours} Credits</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline / Progress Preview */}
                                        <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-400">
                                            <div
                                                className={`flex items-center ${['PENDING', 'ACTIVE', 'COMPLETED'].includes(req.status) ? 'text-brand-600 font-medium' : ''}`}
                                            >
                                                <div
                                                    className={`w-2 h-2 rounded-full mr-2 ${['PENDING', 'ACTIVE', 'COMPLETED'].includes(req.status) ? 'bg-brand-500' : 'bg-gray-300'}`}
                                                />
                                                Requested
                                            </div>
                                            <div className="w-8 h-px bg-gray-200" />
                                            <div
                                                className={`flex items-center ${['ACTIVE', 'COMPLETED'].includes(req.status) ? 'text-brand-600 font-medium' : ''}`}
                                            >
                                                <div
                                                    className={`w-2 h-2 rounded-full mr-2 ${['ACTIVE', 'COMPLETED'].includes(req.status) ? 'bg-brand-500' : 'bg-gray-300'}`}
                                                />
                                                Accepted
                                            </div>
                                            <div className="w-8 h-px bg-gray-200" />
                                            <div
                                                className={`flex items-center ${req.status === 'COMPLETED' ? 'text-brand-600 font-medium' : ''}`}
                                            >
                                                <div
                                                    className={`w-2 h-2 rounded-full mr-2 ${req.status === 'COMPLETED' ? 'bg-brand-500' : 'bg-gray-300'}`}
                                                />
                                                Completed
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                                            {req.status === 'PENDING' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                                    onClick={() => handleCancelRequest(req.id)}
                                                    disabled={actionLoading === req.id}
                                                >
                                                    {actionLoading === req.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        'Cancel'
                                                    )}
                                                </Button>
                                            )}
                                            {req.status === 'ACTIVE' && !req.requesterConfirmed && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                                                    onClick={() => handleConfirmReceipt(req.id)}
                                                    disabled={actionLoading === req.id}
                                                >
                                                    {actionLoading === req.id ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                    )}
                                                    Confirm Receipt
                                                </Button>
                                            )}
                                            {req.status === 'ACTIVE' &&
                                                req.requesterConfirmed &&
                                                !req.providerConfirmed && (
                                                    <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full">
                                                        Waiting for provider...
                                                    </span>
                                                )}
                                            <Button size="sm" variant="secondary">
                                                <MessageSquare className="w-4 h-4 mr-2" /> Message
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
                                    <p className="text-gray-500 mb-4">You haven't requested any services yet.</p>
                                    <Button onClick={() => navigate('/browse')}>Browse Services</Button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default MyRequests;
