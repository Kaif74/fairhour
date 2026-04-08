import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Clock, FileText, Tag, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../hooks/useAuth';
import api from '../api';
import { CATEGORY_NAMES } from '../constants';

const CreateRequest: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    serviceCategory: '',
    description: '',
    hours: 1,
  });
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim() || formData.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }
    // Determine the final category (use custom if "Other" is selected)
    const finalCategory = formData.serviceCategory === 'Other' ? customCategory.trim() : formData.serviceCategory;
    if (!finalCategory) {
      setError(formData.serviceCategory === 'Other' ? 'Please enter a custom category' : 'Please select a category');
      return;
    }
    if (!formData.description.trim() || formData.description.length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      // Use custom category if "Other" is selected
      const categoryToSubmit = formData.serviceCategory === 'Other' ? customCategory.trim() : formData.serviceCategory;
      await api.post('/api/requests', {
        title: formData.title.trim(),
        serviceCategory: categoryToSubmit,
        description: formData.description.trim(),
        hours: formData.hours,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to create request:', err);
      setError(err.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50/50 pt-20 pb-12 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8 text-center max-w-md"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Help Request Posted!</h2>
            <p className="text-gray-500 mb-4">
              Your help request is live. People in the community can now offer to help.
            </p>
            <p className="text-sm text-gray-400">Redirecting to home...</p>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ask for Help</h1>
            <p className="text-gray-500">
              Tell the community what you need and how many credits you&apos;re offering.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8"
          >
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Help Request Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Need help moving furniture this weekend"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                maxLength={100}
              />
              <p className="text-xs text-gray-400 mt-1">{formData.title.length}/100 characters</p>
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Category
              </label>
              <div className="relative">
                <select
                  value={formData.serviceCategory}
                  onChange={(e) => {
                    setFormData({ ...formData, serviceCategory: e.target.value });
                    if (e.target.value !== 'Other') setCustomCategory('');
                  }}
                  className="appearance-none w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {CATEGORY_NAMES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {/* Custom category input when "Other" is selected */}
              {formData.serviceCategory === 'Other' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter your custom category"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-400 mt-1">Describe your service category</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you need help with, any specific requirements, preferred timing, etc."
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-gray-400 mt-1">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Hours */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Time Credits Offered
              </label>
              <p className="text-xs text-gray-500 mb-3">
                How many credits are you offering in return for this help?
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <div className="flex items-center bg-brand-50 px-4 py-2 rounded-xl">
                  <Clock className="w-4 h-4 text-brand-600 mr-2" />
                  <span className="text-lg font-bold text-brand-700">{formData.hours}</span>
                  <span className="text-brand-600 ml-1">hr{formData.hours !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="button" variant="secondary" fullWidth onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Request'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
};

export default CreateRequest;
