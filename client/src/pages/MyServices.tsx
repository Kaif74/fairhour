import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  PauseCircle,
  PlayCircle,
  Star,
  Zap,
  Clock,
  MoreHorizontal,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';
import PageTransition from '../components/PageTransition';
import { api } from '../api';
import { CATEGORIES } from '../constants';
import { ApiService } from '../types';

// Use ApiService type from centralized types
type Service = ApiService;

// Add Service Modal Component
const AddServiceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (service: Service) => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setCustomCategory('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (title.length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (description.length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }
    // Determine final category (use custom if "Other" is selected)
    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    if (!finalCategory) {
      setError(category === 'Other' ? 'Please enter a custom category' : 'Please select a category');
      return;
    }

    setIsLoading(true);

    try {
      // Use custom category if "Other" is selected
      const categoryToSubmit = category === 'Other' ? customCategory.trim() : category;
      const response = await api.post<Service>('/api/services', {
        title: title.trim(),
        description: description.trim(),
        category: categoryToSubmit,
      });

      if (response.success && response.data) {
        onSuccess(response.data);
        handleClose();
      } else {
        setError(response.message || 'Failed to create service');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Add New Service</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Input
              label="Service Title *"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., React Development Tutoring"
              disabled={isLoading}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you'll offer, your experience level, and what people can expect..."
                rows={4}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none disabled:opacity-50"
              />
              <p className="text-xs text-gray-400 mt-1">{description.length}/2000 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value !== 'Other') setCustomCategory('');
                }}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all disabled:opacity-50 bg-white"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {/* Custom category input when "Other" is selected */}
              {category === 'Other' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter your custom category"
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all disabled:opacity-50"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-400 mt-1">Describe your service category</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Hourly Value</p>
                  <p className="text-xs text-gray-500">
                    All services are valued equally at 1 credit per hour
                  </p>
                </div>
                <div className="flex items-center px-4 py-2 bg-brand-100 text-brand-700 rounded-lg font-bold">
                  <Zap className="w-4 h-4 mr-1" />1 Credit/hr
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="shadow-brand-500/20 shadow-lg">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Service
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const MyServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch services on mount
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{ services: Service[] }>('/api/services/me');
      if (response.success && response.data) {
        setServices(response.data.services);
      } else {
        setError(response.message || 'Failed to fetch services');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceCreated = (newService: Service) => {
    setServices([newService, ...services]);
  };

  const toggleStatus = async (id: string) => {
    const service = services.find((s) => s.id === id);
    if (!service) return;

    setTogglingId(id);

    try {
      const response = await api.put<Service>(`/api/services/${id}`, {
        isActive: !service.isActive,
      });

      if (response.success && response.data) {
        setServices(
          services.map((s) => (s.id === id ? { ...s, isActive: response.data!.isActive } : s))
        );
      }
    } catch (err) {
      console.error('Failed to toggle service status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50/50 pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-center items-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <span className="ml-3 text-gray-600">Loading services...</span>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
              <p className="text-gray-500 mt-1">Skills you're offering to the community.</p>
            </div>
            <Button className="shadow-brand-500/20 shadow-lg" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2" /> Add New Service
            </Button>
          </div>

          {/* Error state */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error loading services</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <button onClick={fetchServices} className="text-sm text-red-700 underline mt-2">
                  Try again
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <motion.div
                layout
                key={service.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden group transition-all ${!service.isActive ? 'opacity-75 grayscale-[0.5]' : ''}`}
              >
                <div className="p-6 relative">
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${service.isActive ? 'bg-green-500' : 'bg-gray-500'}`}
                      />
                      {service.isActive ? 'Active' : 'Paused'}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                  <div className="text-xs text-gray-500 bg-gray-50 inline-block px-2 py-1 rounded-md mb-4 font-medium">
                    {service.category}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{service.description}</p>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Hourly Value
                      </p>
                      <p className="font-bold text-gray-900 flex items-center mt-1">
                        <Zap className="w-3.5 h-3.5 mr-1 text-brand-500" /> 1 Credit
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Created
                      </p>
                      <p className="font-bold text-gray-900 flex items-center mt-1">
                        <Clock className="w-3.5 h-3.5 mr-1 text-blue-500" />
                        {new Date(service.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                  <div className="flex items-center text-sm font-bold text-gray-700">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" /> 5.0
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="p-2 text-gray-500 hover:text-brand-600 hover:bg-white rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(service.id)}
                      disabled={togglingId === service.id}
                      className={`p-2 rounded-lg transition-colors ${service.isActive
                        ? 'text-gray-500 hover:text-orange-600 hover:bg-white'
                        : 'text-brand-600 hover:bg-white'
                        } disabled:opacity-50`}
                      title={service.isActive ? 'Pause' : 'Activate'}
                    >
                      {togglingId === service.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : service.isActive ? (
                        <PauseCircle className="w-4 h-4" />
                      ) : (
                        <PlayCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Empty State */}
            {services.length === 0 && !error && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No services yet</h3>
                <p className="text-gray-500 mb-6">
                  Start earning time credits by offering your skills.
                </p>
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first service
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      <AddServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleServiceCreated}
      />
    </PageTransition>
  );
};

export default MyServices;
