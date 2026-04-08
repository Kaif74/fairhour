import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Trash2,
  Search,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';
import PageTransition from '../components/PageTransition';
import { api } from '../api';
import { CATEGORIES } from '../constants';
import { ApiService, ApiOccupation } from '../types';

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
  const [occupationId, setOccupationId] = useState('');
  const [selectedOccupation, setSelectedOccupation] = useState<ApiOccupation | null>(null);
  const [occupationSearch, setOccupationSearch] = useState('');
  const [occupationResults, setOccupationResults] = useState<ApiOccupation[]>([]);
  const [isOccupationDropdownOpen, setIsOccupationDropdownOpen] = useState(false);
  const [isSearchingOccupations, setIsSearchingOccupations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const occupationDropdownRef = useRef<HTMLDivElement>(null);
  const occupationInputRef = useRef<HTMLInputElement>(null);

  // Debounced occupation search
  const searchOccupations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setOccupationResults([]);
      return;
    }
    setIsSearchingOccupations(true);
    try {
      const response = await api.get<{ occupations: ApiOccupation[] }>(
        `/api/occupations?search=${encodeURIComponent(query)}`,
        { auth: false }
      );
      if (response.success && response.data?.occupations) {
        setOccupationResults(response.data.occupations);
      }
    } catch {
      // Non-critical
    } finally {
      setIsSearchingOccupations(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (occupationSearch.trim()) {
        searchOccupations(occupationSearch.trim());
      } else {
        setOccupationResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [occupationSearch, searchOccupations]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (occupationDropdownRef.current && !occupationDropdownRef.current.contains(e.target as Node)) {
        setIsOccupationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group occupations by majorGroup
  const groupedResults = occupationResults.reduce<Record<string, ApiOccupation[]>>((acc, occ) => {
    if (!acc[occ.majorGroup]) acc[occ.majorGroup] = [];
    acc[occ.majorGroup].push(occ);
    return acc;
  }, {});

  const skillLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Elementary';
      case 2: return 'Skilled';
      case 3: return 'Technical';
      case 4: return 'Professional';
      default: return 'Unknown';
    }
  };

  const skillLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-gray-100 text-gray-700';
      case 2: return 'bg-blue-100 text-blue-700';
      case 3: return 'bg-purple-100 text-purple-700';
      case 4: return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSelectOccupation = (occ: ApiOccupation) => {
    setOccupationId(occ.id);
    setSelectedOccupation(occ);
    setOccupationSearch('');
    setOccupationResults([]);
    setIsOccupationDropdownOpen(false);
  };

  const handleClearOccupation = () => {
    setOccupationId('');
    setSelectedOccupation(null);
    setOccupationSearch('');
    setOccupationResults([]);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setCustomCategory('');
    setOccupationId('');
    setSelectedOccupation(null);
    setOccupationSearch('');
    setOccupationResults([]);
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
      const categoryToSubmit = category === 'Other' ? customCategory.trim() : category;
      const response = await api.post<Service>('/api/services', {
        title: title.trim(),
        description: description.trim(),
        category: categoryToSubmit,
        occupationId: occupationId || null,
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
            <h2 className="text-xl font-bold text-gray-900">Add a Service</h2>
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

            {/* Occupation / Skill Classification — Searchable Picker */}
            <div ref={occupationDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skill Classification (NCO)</label>
              
              {/* Selected Occupation Chip */}
              {selectedOccupation ? (
                <div className="flex items-center justify-between p-3 bg-brand-50 border border-brand-200 rounded-xl mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${skillLevelColor(selectedOccupation.skillLevel)}`}>
                      {skillLevelLabel(selectedOccupation.skillLevel)}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">{selectedOccupation.title}</span>
                    <span className="text-xs text-brand-600 font-bold whitespace-nowrap">×{selectedOccupation.baseMultiplier}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearOccupation}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Search Input */
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isSearchingOccupations ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <input
                    ref={occupationInputRef}
                    type="text"
                    value={occupationSearch}
                    onChange={(e) => {
                      setOccupationSearch(e.target.value);
                      setIsOccupationDropdownOpen(true);
                    }}
                    onFocus={() => setIsOccupationDropdownOpen(true)}
                    placeholder="Search occupations... e.g. plumber, teacher, accountant"
                    disabled={isLoading}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all disabled:opacity-50 bg-white text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOccupationDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              )}

              {/* Dropdown Results */}
              <AnimatePresence>
                {isOccupationDropdownOpen && !selectedOccupation && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-20 relative"
                  >
                    {occupationSearch.length < 2 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">
                        <Search className="w-5 h-5 mx-auto mb-2 opacity-50" />
                        Type at least 2 characters to search occupations
                      </div>
                    ) : isSearchingOccupations ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">
                        <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
                        Searching...
                      </div>
                    ) : Object.keys(groupedResults).length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">
                        No occupations found for "{occupationSearch}"
                      </div>
                    ) : (
                      Object.entries(groupedResults).map(([group, occs]) => (
                        <div key={group}>
                          <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0">
                            {group}
                          </div>
                          {occs.map((occ) => (
                            <button
                              key={occ.id}
                              type="button"
                              onClick={() => handleSelectOccupation(occ)}
                              className="w-full text-left px-3 py-2.5 hover:bg-brand-50 transition-colors flex items-center justify-between gap-2 group/item"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${skillLevelColor(occ.skillLevel)}`}>
                                  L{occ.skillLevel}
                                </span>
                                <span className="text-sm text-gray-800 truncate group-hover/item:text-brand-700 transition-colors">
                                  {occ.title}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-brand-600 whitespace-nowrap">×{occ.baseMultiplier}</span>
                            </button>
                          ))}
                        </div>
                      ))
                    )}

                    {/* None option always at bottom */}
                    {occupationSearch.length >= 2 && (
                      <div className="border-t border-gray-100">
                        <button
                          type="button"
                          onClick={handleClearOccupation}
                          className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-500 font-medium"
                        >
                          None — Default (1 cr/hr)
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-xs text-gray-400 mt-1.5">
                {selectedOccupation
                  ? `[${selectedOccupation.ncoCode}] ${selectedOccupation.majorGroup}`
                  : 'Search and select an occupation to set your skill-based credit multiplier'
                }
              </p>
            </div>

            {/* Credit Rate + Trust Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Credit Rate</p>
                  <p className="text-xs text-gray-500">
                    {occupationId
                      ? 'Rate determined by skill level, reputation, and demand'
                      : 'Select a skill classification to earn more credits'
                    }
                  </p>
                </div>
                <div className="flex items-center px-4 py-2 bg-brand-100 text-brand-700 rounded-lg font-bold">
                  <Zap className="w-4 h-4 mr-1" />
                  {occupationId && selectedOccupation
                    ? `×${selectedOccupation.baseMultiplier}`
                    : '1'
                  } cr/hr
                </div>
              </div>

              {/* Trust dampening info */}
              {occupationId && selectedOccupation && selectedOccupation.baseMultiplier > 1 && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                  <Shield className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-700">
                    <p className="font-semibold mb-0.5">Trust-based rate unlock</p>
                    <p className="text-amber-600">New providers start at a reduced rate that unlocks to ×{selectedOccupation.baseMultiplier} as you complete exchanges and build positive reviews.</p>
                  </div>
                </div>
              )}
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
                    Save Service
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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/api/services/${id}`);
      if (response.success) {
        setServices(services.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete service:', err);
      alert('Failed to delete service.');
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
              <h1 className="text-2xl font-bold text-gray-900">Services I Offer</h1>
              <p className="text-gray-500 mt-1">Skills and services people can book from you.</p>
            </div>
            <Button className="shadow-brand-500/20 shadow-lg" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2" /> Add a Service
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
                    <div className="relative">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="text-gray-400 hover:text-gray-600 p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === service.id ? null : service.id);
                          }}
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {openDropdownId === service.id && (
                        <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10"
                             onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              navigate(`/service/${service.id}?edit=true`);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center font-medium"
                          >
                            <Edit2 className="w-4 h-4 mr-2 text-gray-400" />
                            Edit Service
                          </button>
                          <button
                            onClick={() => {
                              toggleStatus(service.id);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center font-medium"
                          >
                            {service.isActive ? <PauseCircle className="w-4 h-4 mr-2 text-gray-400" /> : <PlayCircle className="w-4 h-4 mr-2 text-brand-500" />}
                            {service.isActive ? 'Pause Service' : 'Activate Service'}
                          </button>
                          <div className="mx-2 my-1 border-b border-gray-100"></div>
                          <button
                            onClick={() => {
                              handleDeleteService(service.id);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center font-medium"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Service
                          </button>
                        </div>
                      )}
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
                        Base Rate
                      </p>
                      <p className="font-bold text-gray-900 flex items-center mt-1">
                        <Zap className="w-3.5 h-3.5 mr-1 text-brand-500" />
                        From {(service as any).occupation?.baseMultiplier ?? 1} cr/hr
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
                    <Star className={`w-4 h-4 mr-1 ${(service as any).user?.reputationScore > 0 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    {(service as any).user?.reputationScore > 0 ? (
                      (service as any).user.reputationScore.toFixed(1)
                    ) : (
                      <span className="font-medium text-gray-400">No reviews yet</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/service/${service.id}?edit=true`)}
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
