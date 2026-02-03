import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
  Calendar,
  Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import PageTransition from '../components/PageTransition';

// Availability options
const AVAILABILITY_OPTIONS = [
  'Weekdays (Mornings)',
  'Weekdays (Afternoons)',
  'Weekdays (Evenings)',
  'Weekends (Mornings)',
  'Weekends (Afternoons)',
  'Weekends (Evenings)',
  'Flexible',
];

// Skills options
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

// Default avatars for users who don't upload their own
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

const steps = [
  { id: 1, name: 'About', icon: User },
  { id: 2, name: 'Skills', icon: Briefcase },
  { id: 3, name: 'Availability', icon: Calendar },
  { id: 4, name: 'Complete', icon: Check },
];

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { user, completeOnboarding, isLoading } = useAuth();
  const navigate = useNavigate();
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [bio, setBio] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_AVATARS[0]);

  const handleNext = async () => {
    setError(null);

    if (currentStep === 1) {
      // Bio is optional, just proceed
      setDirection(1);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate skills
      if (selectedSkills.length === 0) {
        setError('Please select at least one skill');
        return;
      }
      setDirection(1);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Validate availability
      if (selectedAvailability.length === 0) {
        setError('Please select at least one availability slot');
        return;
      }
      setDirection(1);
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Complete onboarding
      try {
        await completeOnboarding({
          skills: selectedSkills,
          bio: bio || undefined,
          availability: selectedAvailability,
          profileImageUrl: selectedAvatar,
        });
        navigate('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const toggleAvailability = (slot: string) => {
    if (selectedAvailability.includes(slot)) {
      setSelectedAvailability(selectedAvailability.filter((s) => s !== slot));
    } else {
      setSelectedAvailability([...selectedAvailability, slot]);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true; // Bio is optional
      case 2:
        return selectedSkills.length > 0;
      case 3:
        return selectedAvailability.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Let's set up your profile in just a few steps</p>
        </div>

        {/* Progress */}
        <div className="w-full max-w-2xl mb-12">
          <div className="flex justify-between items-center relative z-10">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    currentStep > step.id
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : currentStep === step.id
                        ? 'bg-white border-brand-600 text-brand-600 scale-110 shadow-md'
                        : 'bg-white border-gray-200 text-gray-300'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs font-semibold mt-2 ${currentStep === step.id ? 'text-brand-700' : 'text-gray-400'}`}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 rounded-full" />
            <div
              className="absolute top-0 left-0 h-1 bg-brand-500 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="w-full max-w-2xl bg-white shadow-soft rounded-3xl p-8 md:p-12 relative overflow-hidden border border-gray-100">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Step 1: Bio & Avatar */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-3xl font-extrabold text-gray-900">
                      Tell us about yourself
                    </h3>
                    <p className="mt-2 text-gray-500">Choose an avatar and write a short bio</p>
                  </div>

                  {/* Avatar Selection */}
                  <div>
                    {/* Avatar Grid with Arrow Navigation */}
                    <div className="relative">
                      {/* Left Arrow */}
                      <button
                        onClick={() => {
                          const container = document.getElementById('avatar-scroll-container');
                          if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-brand-600 hover:bg-gray-50 border border-gray-200 transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {/* Scrollable Container (hidden scrollbar) */}
                      <div
                        id="avatar-scroll-container"
                        className="overflow-x-auto py-4 px-12 scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        <div className="flex gap-4 min-w-max">
                          {DEFAULT_AVATARS.map((avatar, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedAvatar(avatar)}
                              className={`flex-shrink-0 w-16 h-16 rounded-full overflow-hidden border-4 transition-all ${
                                selectedAvatar === avatar
                                  ? 'border-brand-500 ring-2 ring-brand-200'
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
                      </div>

                      {/* Right Arrow */}
                      <button
                        onClick={() => {
                          const container = document.getElementById('avatar-scroll-container');
                          if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-brand-600 hover:bg-gray-50 border border-gray-200 transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Bio (optional)
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
                      rows={4}
                      placeholder="Tell the community a bit about yourself, your interests, and why you want to exchange time..."
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-400 mt-1">{bio.length}/500 characters</p>
                  </div>
                </div>
              )}

              {/* Step 2: Skills */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-3xl font-extrabold text-gray-900">
                      What skills can you offer?
                    </h3>
                    <p className="mt-2 text-gray-500">
                      Select the services you can provide (at least one)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {SKILL_OPTIONS.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 transform hover:scale-105 ${
                          selectedSkills.includes(skill)
                            ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/30'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                  {selectedSkills.length > 0 && (
                    <p className="text-center text-sm text-gray-500">
                      {selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}

              {/* Step 3: Availability */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-3xl font-extrabold text-gray-900">
                      When are you available?
                    </h3>
                    <p className="mt-2 text-gray-500">
                      This helps match you with the right people (select at least one)
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABILITY_OPTIONS.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => toggleAvailability(slot)}
                        className={`flex items-center p-4 border rounded-xl transition-all duration-200 ${
                          selectedAvailability.includes(slot)
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                            selectedAvailability.includes(slot)
                              ? 'bg-brand-500 border-brand-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedAvailability.includes(slot) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="font-medium">{slot}</span>
                      </button>
                    ))}
                  </div>
                  {selectedAvailability.length > 0 && (
                    <p className="text-center text-sm text-gray-500">
                      {selectedAvailability.length} slot{selectedAvailability.length > 1 ? 's' : ''}{' '}
                      selected
                    </p>
                  )}
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div className="space-y-8 text-center">
                  <div className="flex justify-center">
                    <img
                      src={selectedAvatar}
                      alt="Your avatar"
                      className="w-24 h-24 rounded-full border-4 border-brand-100"
                    />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-gray-900">You're all set!</h3>
                    <p className="mt-2 text-gray-500">Ready to start exchanging time?</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4">
                    {bio && (
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider mb-2">
                          Bio
                        </h4>
                        <p className="text-gray-600 text-sm">{bio}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider mb-2">
                        Your Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider mb-2">
                        Availability
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAvailability.map((slot) => (
                          <span
                            key={slot}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-12 flex justify-between items-center border-t border-gray-100 pt-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              onClick={handleNext}
              size="lg"
              className="px-8 shadow-brand-500/20 shadow-lg"
              disabled={isLoading || !canProceed()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {currentStep === 4 ? 'Start Exchanging' : 'Continue'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Onboarding;
