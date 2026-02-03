import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { CATEGORIES } from '../constants';
import { ApiService, ApiServicesResponse, ServiceDisplay, apiServiceToDisplay } from '../types';
import PageTransition from '../components/PageTransition';
import api from '../api';

const Browse: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [services, setServices] = useState<ServiceDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 300;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Fetch services from database on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await api.get<ApiServicesResponse>('/api/services', { auth: false });

        if (response.success && response.data?.services) {
          // Transform API services to display format
          const displayServices = response.data.services.map(apiServiceToDisplay);
          setServices(displayServices);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
        setError('Failed to load services from server');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const filteredServices = services.filter(
    (service) =>
      (selectedCategory === 'All' || service.category === selectedCategory) &&
      (service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search & Filter Header */}
          <div className="flex flex-col gap-4 mb-8">
            {/* Search Bar - Full Width */}
            <div className="w-full">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-4 border-none rounded-2xl shadow-soft text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white transition-all"
                  placeholder="Search for skills, services, or people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Categories - Horizontally Scrollable */}
            <div className="relative flex items-center">
              {/* Left scroll button */}
              <button
                onClick={() => scrollCategories('left')}
                className="absolute left-0 z-10 p-2 bg-white shadow-md rounded-full text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-all"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div
                ref={categoryScrollRef}
                className="flex gap-3 overflow-x-auto pb-2 scroll-smooth no-scrollbar flex-1 mx-12"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`whitespace-nowrap px-6 py-3 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${selectedCategory === 'All' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'bg-white text-gray-600 shadow-soft hover:bg-gray-50'}`}
                >
                  All
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`whitespace-nowrap px-6 py-3 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${selectedCategory === cat.name ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'bg-white text-gray-600 shadow-soft hover:bg-gray-50'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Right scroll button */}
              <button
                onClick={() => scrollCategories('right')}
                className="absolute right-0 z-10 p-2 bg-white shadow-md rounded-full text-gray-600 hover:text-brand-600 hover:bg-brand-50 transition-all"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <Link key={service.id} to={`/service/${service.id}`} className="block">
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl shadow-soft border border-gray-100 flex flex-col overflow-hidden group cursor-pointer h-full"
                  >
                    <div className="p-6 flex-grow">
                      <div className="flex items-center mb-4">
                        <div className="relative">
                          <img
                            src={service.providerAvatar}
                            alt={service.providerName}
                            className="h-12 w-12 rounded-full border-2 border-white shadow-sm"
                          />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-bold text-gray-900">{service.providerName}</p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />{' '}
                            {service.providerLocation || 'San Francisco'}
                          </p>
                        </div>
                      </div>

                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold tracking-wide uppercase">
                          {service.category}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-brand-600 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{service.description}</p>
                    </div>

                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full shadow-sm">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                        <span className="text-xs font-bold text-gray-900">{service.rating}</span>
                      </div>
                      <div className="flex items-center text-brand-700 font-bold text-sm">
                        <Clock className="h-4 w-4 mr-1.5" />
                        {service.costPerHour} hr
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-32 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No services found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filter.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Browse;
