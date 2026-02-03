/**
 * FairHour Constants
 * Application-wide constants and configuration values
 */

import { LucideIcon } from 'lucide-react';
import {
  GraduationCap,
  Monitor,
  Palette,
  Home,
  Heart,
  PenTool,
  Wrench,
  Leaf,
  Music,
  Dumbbell,
  Camera,
  UtensilsCrossed,
  Languages,
  Car,
  Scissors,
  Scale,
  Dog,
  PartyPopper,
  Baby,
  Sparkles,
  Briefcase,
  Hammer,
  Shirt,
  BookOpen,
  Gamepad2,
  Laptop,
  Stethoscope,
  Truck,
  HelpCircle,
  MoreHorizontal,
} from 'lucide-react';

// =============================================================================
// CATEGORIES
// =============================================================================

export interface Category {
  name: string;
  icon: LucideIcon;
  activeCount: number;
}

export const CATEGORIES: Category[] = [
  // Education & Learning
  { name: 'Tutoring', icon: GraduationCap, activeCount: 47 },
  { name: 'Language Lessons', icon: Languages, activeCount: 32 },
  { name: 'Music Lessons', icon: Music, activeCount: 28 },
  { name: 'Academic Help', icon: BookOpen, activeCount: 35 },

  // Technology
  { name: 'Tech Help', icon: Monitor, activeCount: 38 },
  { name: 'Web Development', icon: Laptop, activeCount: 29 },
  { name: 'IT Support', icon: HelpCircle, activeCount: 22 },

  // Creative
  { name: 'Design', icon: Palette, activeCount: 24 },
  { name: 'Photography', icon: Camera, activeCount: 31 },
  { name: 'Writing', icon: PenTool, activeCount: 19 },
  { name: 'Crafts & DIY', icon: Scissors, activeCount: 18 },

  // Home & Garden
  { name: 'Home Services', icon: Home, activeCount: 56 },
  { name: 'Repairs', icon: Wrench, activeCount: 42 },
  { name: 'Gardening', icon: Leaf, activeCount: 28 },
  { name: 'Carpentry', icon: Hammer, activeCount: 21 },
  { name: 'Cleaning', icon: Sparkles, activeCount: 45 },

  // Health & Wellness
  { name: 'Fitness Training', icon: Dumbbell, activeCount: 33 },
  { name: 'Healthcare', icon: Stethoscope, activeCount: 15 },
  { name: 'Beauty & Wellness', icon: Sparkles, activeCount: 27 },
  { name: 'Care', icon: Heart, activeCount: 31 },
  { name: 'Childcare', icon: Baby, activeCount: 24 },

  // Lifestyle
  { name: 'Cooking', icon: UtensilsCrossed, activeCount: 26 },
  { name: 'Pet Care', icon: Dog, activeCount: 34 },
  { name: 'Event Planning', icon: PartyPopper, activeCount: 16 },
  { name: 'Gaming Help', icon: Gamepad2, activeCount: 20 },

  // Professional
  { name: 'Legal & Admin', icon: Scale, activeCount: 12 },
  { name: 'Business Help', icon: Briefcase, activeCount: 18 },

  // Transportation & Moving
  { name: 'Transportation', icon: Car, activeCount: 29 },
  { name: 'Moving Help', icon: Truck, activeCount: 37 },
  { name: 'Errands', icon: Shirt, activeCount: 23 },

  // Other/Custom
  { name: 'Other', icon: MoreHorizontal, activeCount: 15 },
];

// Simple array of category names for dropdowns
export const CATEGORY_NAMES: string[] = CATEGORIES.map((c) => c.name);

// Get icon for a category name (returns MoreHorizontal for unknown categories)
export const getCategoryIcon = (categoryName: string): LucideIcon => {
  const category = CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  return category?.icon || MoreHorizontal;
};


// =============================================================================
// API ENDPOINTS
// =============================================================================

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
  USERS: {
    ME: '/api/users/me',
    PROFILE: '/api/users/profile',
    ONBOARDING: '/api/users/onboarding/complete',
    BALANCE: '/api/users/me/balance',
  },
  SERVICES: {
    BASE: '/api/services',
    MY_SERVICES: '/api/services/me',
  },
  REQUESTS: {
    BASE: '/api/requests',
    MY_REQUESTS: '/api/requests/me',
  },
  EXCHANGES: {
    BASE: '/api/exchanges',
    MY_EXCHANGES: '/api/exchanges/me',
  },
  CONVERSATIONS: {
    BASE: '/api/conversations',
  },
};

// =============================================================================
// STORAGE KEYS
// =============================================================================

export const STORAGE_KEYS = {
  TOKEN: 'fairhour_token',
  USER: 'fairhour_user',
  THEME: 'fairhour_theme',
};

// =============================================================================
// APP CONFIG
// =============================================================================

export const APP_CONFIG = {
  APP_NAME: 'FairHour',
  APP_DESCRIPTION: 'Time-based skill exchange platform',
  DEFAULT_AVATAR_BG: '22c55e',
  DEFAULT_AVATAR_COLOR: 'fff',
  CREDIT_PER_HOUR: 1,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_TITLE_LENGTH: 3,
  MIN_DESCRIPTION_LENGTH: 10,
};

// =============================================================================
// VALIDATION
// =============================================================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};
