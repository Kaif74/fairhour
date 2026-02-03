import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Star,
  Clock,
  Calendar,
  Edit2,
  X,
  Loader2,
  Check,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { getTimeBalance } from '../api/auth';
import { getMyServices, Service } from '../api/dashboard';
import Button from '../components/Button';
import Input from '../components/Input';
import PageTransition from '../components/PageTransition';

// Default avatars
const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kabir',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ishaan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Riya',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Vivaan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Anaya',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Siya',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nisha',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Neha',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Varun',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavya',
];

// Availability options for editing
const AVAILABILITY_OPTIONS = [
  'Weekdays (Mornings)',
  'Weekdays (Afternoons)',
  'Weekdays (Evenings)',
  'Weekends (Mornings)',
  'Weekends (Afternoons)',
  'Weekends (Evenings)',
  'Flexible',
];

// Skill options
const SKILL_OPTIONS = [
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

// Edit Profile Modal
const EditProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  onSave: (data: {
    name: string;
    location: string;
    bio: string;
    skills: string[];
    availability: string[];
    profileImageUrl: string;
  }) => Promise<void>;
}> = ({ isOpen, onClose, user, onSave }) => {
  const [name, setName] = useState(user.name);
  const [location, setLocation] = useState(user.location || '');
  const [bio, setBio] = useState(user.bio || '');
  const [skills, setSkills] = useState<string[]>(user.skills || []);
  const [availability, setAvailability] = useState<string[]>(user.availability || []);
  const [profileImageUrl, setProfileImageUrl] = useState(
    user.profileImageUrl || DEFAULT_AVATARS[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<
    'basic' | 'skills' | 'availability' | 'avatar'
  >('basic');

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const toggleAvailability = (slot: string) => {
    if (availability.includes(slot)) {
      setAvailability(availability.filter((s) => s !== slot));
    } else {
      setAvailability([...availability, slot]);
    }
  };

  const handleSave = async () => {
    setError(null);

    if (!name.trim() || name.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (skills.length === 0) {
      setError('Please select at least one skill');
      return;
    }

    if (availability.length === 0) {
      setError('Please select at least one availability slot');
      return;
    }

    setIsLoading(true);

    try {
      await onSave({
        name: name.trim(),
        location: location.trim(),
        bio: bio.trim(),
        skills,
        availability,
        profileImageUrl,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
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
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-6">
            {[
              { id: 'basic', label: 'Basic Info' },
              { id: 'skills', label: 'Skills' },
              { id: 'availability', label: 'Availability' },
              { id: 'avatar', label: 'Avatar' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === tab.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {activeSection === 'basic' && (
              <div className="space-y-5">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
                <Input
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 mt-1">{bio.length}/500</p>
                </div>
              </div>
            )}

            {activeSection === 'skills' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Select the skills you can offer</p>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        skills.includes(skill)
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">{skills.length} selected</p>
              </div>
            )}

            {activeSection === 'availability' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">When are you available?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABILITY_OPTIONS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => toggleAvailability(slot)}
                      className={`flex items-center p-4 border rounded-xl transition-all ${
                        availability.includes(slot)
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                          availability.includes(slot)
                            ? 'bg-brand-500 border-brand-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {availability.includes(slot) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="font-medium text-sm">{slot}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'avatar' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Choose your profile picture</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  {DEFAULT_AVATARS.map((avatar, idx) => (
                    <button
                      key={idx}
                      onClick={() => setProfileImageUrl(avatar)}
                      className={`w-20 h-20 rounded-full overflow-hidden border-4 transition-all ${
                        profileImageUrl === avatar
                          ? 'border-brand-500 ring-4 ring-brand-100 scale-110'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={avatar}
                        alt={`Avatar ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center text-sm text-gray-500">
                  <Camera className="w-4 h-4 inline mr-1" />
                  More avatar options coming soon
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'About' | 'Skills' | 'Reviews'>('About');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [balance, setBalance] = useState({ balance: 0, hoursEarned: 0, hoursSpent: 0 });
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [balanceData, servicesData] = await Promise.all([getTimeBalance(), getMyServices()]);
        setBalance(balanceData);
        setServices(servicesData);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveProfile = async (data: {
    name: string;
    location: string;
    bio: string;
    skills: string[];
    availability: string[];
    profileImageUrl: string;
  }) => {
    await updateProfile(data);
  };

  if (!user) return <div className="p-8 text-center">Please log in.</div>;

  // Safe avatar URL - never broken
  const avatarUrl = user.profileImageUrl || DEFAULT_AVATARS[0];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Card */}
          <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden mb-8">
            <div className="h-48 bg-gradient-to-r from-brand-600 to-accent-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>
            <div className="px-8 pb-8">
              <div className="relative flex flex-col md:flex-row justify-between items-end -mt-16 mb-6">
                <div className="flex items-end">
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="h-32 w-32 rounded-3xl border-4 border-white shadow-lg bg-white object-cover"
                    onError={(e) => {
                      // Fallback on error
                      (e.target as HTMLImageElement).src = DEFAULT_AVATARS[0];
                    }}
                  />
                  <div className="ml-6 mb-2 hidden md:block">
                    <h1 className="text-3xl font-extrabold text-gray-900">{user.name}</h1>
                    <div className="flex items-center text-gray-500 mt-1">
                      <MapPin className="h-4 w-4 mr-1" /> {user.location || 'Location not set'}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3 mt-4 md:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                </div>
              </div>

              <div className="md:hidden mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <div className="flex items-center text-gray-500 mt-1 text-sm">
                  <MapPin className="h-4 w-4 mr-1" /> {user.location || 'Location not set'}
                </div>
              </div>

              <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg mr-3">
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                      Rating
                    </p>
                    <p className="font-bold text-gray-900">
                      {user.reputationScore?.toFixed(1) || '5.0'}
                    </p>
                  </div>
                </div>
                <div className="w-px h-10 bg-gray-100 hidden sm:block"></div>
                <div className="flex items-center">
                  <div className="p-2 bg-brand-50 text-brand-600 rounded-lg mr-3">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                      Balance
                    </p>
                    <p className="font-bold text-gray-900">
                      {isLoading ? '...' : `${balance.balance.toFixed(1)} Hours`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar Stats */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Availability</h3>
                <div className="space-y-3">
                  {user.availability && user.availability.length > 0 ? (
                    user.availability.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex items-center text-sm text-gray-700 bg-gray-50 p-3 rounded-xl"
                      >
                        <Calendar className="h-4 w-4 mr-3 text-brand-500" />
                        {slot}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No availability set</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Impact</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Hours Earned</span>
                    <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md text-sm">
                      +{isLoading ? '...' : balance.hoursEarned.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Hours Spent</span>
                    <span className="font-bold text-gray-900">
                      -{isLoading ? '...' : balance.hoursSpent.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-500 h-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          balance.hoursEarned > 0
                            ? (balance.hoursEarned / (balance.hoursEarned + balance.hoursSpent)) *
                                100
                            : 50
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 text-center pt-2">
                    Member since{' '}
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Tabs Content */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-soft border border-gray-100 min-h-[500px] overflow-hidden">
                <div className="border-b border-gray-100 px-2">
                  <nav className="flex space-x-2 p-2">
                    {['About', 'Skills', 'Reviews'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                          activeTab === tab
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="p-8">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'About' && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Biography</h3>
                        <p className="text-gray-600 leading-relaxed mb-8">
                          {user.bio || 'No bio yet. Click "Edit Profile" to add one!'}
                        </p>
                      </div>
                    )}
                    {activeTab === 'Skills' && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">My Skills</h3>
                        <div className="flex flex-wrap gap-2 mb-10">
                          {user.skills && user.skills.length > 0 ? (
                            user.skills.map((skill) => (
                              <span
                                key={skill}
                                className="bg-white text-gray-700 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 shadow-sm"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-gray-500">No skills added yet</p>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Services I Offer</h3>
                        <div className="space-y-4">
                          {services.length > 0 ? (
                            services.map((service) => (
                              <div
                                key={service.id}
                                className="border border-gray-200 rounded-2xl p-5 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                                      {service.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {service.description}
                                    </p>
                                  </div>
                                  <span className="font-bold text-brand-600 text-sm bg-brand-50 px-3 py-1 rounded-full">
                                    1 Hr
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500">
                              No services yet. Go to My Services to add one!
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {activeTab === 'Reviews' && (
                      <div className="space-y-6">
                        <p className="text-gray-500 text-center py-8">
                          No reviews yet. Complete some exchanges to receive reviews!
                        </p>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSave={handleSaveProfile}
      />
    </PageTransition>
  );
};

export default Profile;
