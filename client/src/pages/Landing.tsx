import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Star,
  ShieldCheck,
  Heart,
  ArrowRight,
  Zap,
  Users,
  Sparkles,
  Globe,
  Clock,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  MapPin,
  Calendar,
  Filter,
  Lock,
  Database,
  FileCheck,
  Scale,
} from 'lucide-react';
import { motion, useInView, useAnimation } from 'framer-motion';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import { CATEGORIES } from '../constants';

// Static testimonials for landing page
const TESTIMONIALS = [
  {
    id: '1',
    name: 'Rohit Sharma',
    role: 'Service Provider' as const,
    location: 'Bengaluru, Karnataka',
    avatar: '/avatars/rohit.png',
    text: 'I exchanged UI design hours for spoken English practice. The platform made it fair and stress-free.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Neha Verma',
    role: 'Service Seeker' as const,
    location: 'Indore, Madhya Pradesh',
    avatar: '/avatars/neha.png',
    text: 'Needed help setting up my laptop and WiFi. Found quick tech help in exchange for maths tutoring.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Arjun Iyer',
    role: 'Service Provider' as const,
    location: 'Chennai, Tamil Nadu',
    avatar: '/avatars/arjun.png',
    text: 'Feels like a modern version of neighbourhood support. Time is respected here.',
    rating: 4,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Counter = ({
  from,
  to,
  label,
  suffix = '',
}: {
  from: number;
  to: number;
  label: string;
  suffix?: string;
}) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;
    const node = nodeRef.current;
    if (!node) return;

    const duration = 2000;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const current = Math.floor(from + (to - from) * ease);
      node.textContent = current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [isInView, from, to, suffix]);

  return (
    <div className="flex flex-col items-start p-4 border-l-4 border-brand-200">
      <span
        ref={nodeRef}
        className="text-4xl md:text-5xl font-extrabold text-brand-600 mb-2 font-mono"
      >
        {from}
      </span>
      <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
};

const Landing: React.FC = () => {
  return (
    <PageTransition>
      <div className="bg-white overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-screen pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col justify-center">
          {/* Background Blobs */}
          <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-200/40 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-pulse"></div>
            <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-accent-100/60 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 text-sm font-semibold mb-8 border border-brand-100 shadow-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Trusted Skill Exchange
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                Your Time Has Value,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">
                  We Make It Fair.
                </span>
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 mb-10 leading-relaxed">
                Find trusted help, share your skills, and earn fair credits with transparent
                pricing, verified credibility, and a clear history for every exchange.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/browse">
                  <Button size="xl" className="shadow-brand-500/20 shadow-xl">
                    Find Help
                  </Button>
                </Link>
                <Link to="/requests">
                  <Button
                    variant="outline"
                    size="xl"
                    className="bg-white/50 backdrop-blur-sm border-gray-200 text-gray-700 hover:bg-white"
                  >
                    Ask for Help
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Explore Skills Section */}
        <section className="py-24 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Find Help Near You</h2>
              <p className="text-lg text-gray-500">Discover skills people in your community are ready to share.</p>
            </div>

            {/* Search & Filters Container */}
            <div className="max-w-4xl mx-auto mb-16 relative z-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white p-2 rounded-3xl shadow-soft border border-gray-100"
              >
                <div className="flex flex-col md:flex-row items-center">
                  <div className="flex-1 w-full relative flex items-center px-4 py-3 border-b md:border-b-0 md:border-r border-gray-100">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                      type="text"
                      placeholder="Search skills, services, or expertise"
                      className="w-full text-base text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Filters (Desktop) */}
                  <div className="hidden md:flex items-center gap-2 px-4">
                    <div className="flex items-center text-sm font-medium text-gray-600 hover:text-brand-600 cursor-pointer transition-colors">
                      <Filter className="w-4 h-4 mr-2" />
                      <span>Category</span>
                    </div>
                    <div className="h-6 w-px bg-gray-200 mx-3"></div>
                    <div className="flex items-center text-sm font-medium text-gray-600 hover:text-brand-600 cursor-pointer transition-colors">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>Location</span>
                    </div>
                    <div className="h-6 w-px bg-gray-200 mx-3"></div>
                    <div className="flex items-center text-sm font-medium text-gray-600 hover:text-brand-600 cursor-pointer transition-colors">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Availability</span>
                    </div>
                  </div>

                  <div className="p-2 w-full md:w-auto">
                    <Button size="lg" className="w-full md:w-auto rounded-xl shadow-brand-500/10">
                      Search
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Mobile Filter Tags */}
              <div className="flex md:hidden gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar px-1">
                <button className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">
                  Category
                </button>
                <button className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">
                  Location
                </button>
                <button className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">
                  Availability
                </button>
              </div>
            </div>

            {/* Categories Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {CATEGORIES.slice(0, 8).map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <motion.div
                    key={cat.name}
                    variants={itemVariants}
                    whileHover={{
                      y: -5,
                      boxShadow:
                        '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer group transition-all duration-300 flex flex-col items-center text-center hover:border-brand-200"
                  >
                    <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-brand-500 transition-colors duration-300">
                      <IconComponent className="w-7 h-7 text-brand-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                      {cat.name}
                    </h3>
                    <span className="text-xs font-medium text-gray-400 mt-1 bg-gray-50 px-2 py-0.5 rounded-full">
                      {cat.activeCount}+ active
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="mt-12 text-center">
              <Link
                to="/browse"
                className="inline-flex items-center text-brand-600 font-semibold hover:text-brand-700 transition-colors"
              >
                See all skills <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 1: Core Process Flow */}
        <section id="how-it-works" className="core-section min-h-screen bg-white relative flex flex-col justify-center py-24 lg:py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-20 md:mb-24">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                Simple, Fair, Easy to Use
              </h2>
              <p className="text-xl text-gray-500 leading-relaxed mb-4">
                No hidden fees, no complicated currency. Just time.
              </p>
              <p className="text-sm text-gray-400 font-semibold tracking-wide uppercase">
                Time exchanges are securely recorded and cannot be altered.
              </p>
            </div>

            {/* Core Process Flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-gray-200 via-brand-200 to-gray-200 z-0"></div>

              {[
                {
                  title: 'Share a Skill',
                  primary: 'List what you love to do. Earn 1 credit per hour.',
                  secondary:
                    'Earned hours are securely recorded so your contribution is always recognized.',
                  icon: Zap,
                },
                {
                  title: 'Ask for Help',
                  primary: 'Use credits to get help with what you need.',
                  secondary: 'Every exchange is tracked from start to completion.',
                  icon: Search,
                },
                {
                  title: 'Build Trust',
                  primary: 'Rate and review to grow your reputation.',
                  secondary: 'Your work history and feedback remain verifiable over time.',
                  icon: ShieldCheck,
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  whileHover={{ y: -5 }}
                  className="relative z-10 flex flex-col items-center text-center group"
                >
                  <div className="w-24 h-24 bg-white rounded-full border-4 border-gray-50 shadow-soft flex items-center justify-center mb-8 group-hover:border-brand-100 transition-colors duration-300">
                    <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                      <step.icon className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-900 font-medium mb-3">{step.primary}</p>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                    {step.secondary}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: How Fairness Is Ensured (Blockchain) */}
        <section id="trust" className="min-h-screen bg-gray-50 relative flex flex-col justify-center py-24 lg:py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-6xl mx-auto"
            >
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  How FairHour Ensures Fairness
                </h2>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                  FairHour uses blockchain technology in the background to keep time exchanges
                  honest and transparent.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    title: 'Tamper-Proof Time Ledger',
                    text: 'Once an exchange is completed, the hours earned or spent are permanently recorded. No one can edit, delete, or manipulate past exchanges.',
                    icon: Lock,
                  },
                  {
                    title: 'Transparent Rules',
                    text: 'An hour always equals an hour. The system applies the same rules consistently across all users.',
                    icon: Scale,
                  },
                  {
                    title: 'Built-In Trust',
                    text: 'You don’t need to rely on a single authority to resolve disputes. The record of work speaks for itself.',
                    icon: Database,
                  },
                  {
                    title: 'Your Work, Your History',
                    text: 'Your time, effort, and reputation belong to you. They persist independently of individual interactions.',
                    icon: FileCheck,
                  },
                ].map((card, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-8 hover:shadow-soft border border-gray-100 transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-brand-50 rounded-xl shadow-sm flex items-center justify-center text-brand-600 mb-6">
                      <card.icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-3">{card.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{card.text}</p>
                  </div>
                ))}
              </div>

              {/* Reassurance Block */}
              {/* <div className="mt-20 max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 text-center border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Blockchain, Made Invisible</h3>
                <p className="text-gray-600 leading-relaxed">
                  You don’t need to understand blockchain to use FairHour.
                  There are no tokens, wallets, or technical steps required.
                  The technology simply ensures that time exchanges remain fair and trustworthy.
                </p>
              </div> */}
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="min-h-screen py-24 bg-gray-900 text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
                  Trusted by communities <br />
                  who value <span className="text-brand-400">real connection</span>.
                </h2>
                <p className="text-gray-400 text-lg mb-8">
                  FairHour isn't just a marketplace; it's a movement to bring neighbors closer
                  together through fair exchange.
                </p>
                <Button variant="white" size="lg">
                  Join the Movement
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full"></div>
                <div className="grid gap-6 relative z-10">
                  {TESTIMONIALS.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ x: 50, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                      className={`bg-gray-800/80 backdrop-blur p-6 rounded-2xl border border-gray-700 ${i === 1 ? 'lg:-ml-12' : ''}`}
                    >
                      <div className="flex items-center mb-4">
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-12 h-12 rounded-full mr-4 border-2 border-brand-500"
                        />
                        <div>
                          <h4 className="font-bold text-white">{t.name}</h4>
                          <p className="text-xs text-gray-400">
                            {t.role} • {t.location}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-300 italic mb-3">"{t.text}"</p>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < t.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community Impact / Trust Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-brand-50 rounded-3xl p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-200/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

              <div className="flex-1 relative z-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
                  A growing exchange of <br />
                  <span className="text-brand-600">time and trust</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
                  Every hour traded strengthens our community fabric. From local gardening circles
                  to global coding mentorships, FairHour proves that everyone has something valuable
                  to give.
                </p>
                <div className="flex items-center gap-4">
                  <Link to="/signup">
                    <Button size="lg" className="shadow-lg shadow-brand-500/20">
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/browse">
                    <Button variant="ghost" size="lg">
                      Find Help
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex-1 w-full relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <Counter from={0} to={14500} label="Hours Exchanged" suffix="+" />
                  <Counter from={0} to={850} label="Active Members" />
                  <Counter from={0} to={42} label="Communities" />
                  <Counter from={0} to={98} label="Satisfaction Rate" suffix="%" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-16">
              {/* Brand Column */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center mb-6">
                  <div className="bg-brand-600 p-2 rounded-xl text-white mr-2 shadow-sm">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                    FairHour
                  </span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Empowering communities through fair time exchange. Built for people, not profit.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Platform */}
              <div>
                <h4 className="font-bold text-gray-900 mb-6">Platform</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                  <li>
                    <a href="#" className="hover:text-brand-600 transition-colors">
                      How it Works
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-brand-600 transition-colors">
                      Find Help
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-brand-600 transition-colors">
                      Help Requests
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-brand-600 transition-colors">
                      Trust & Safety
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="font-bold text-gray-900 mb-6">Resources</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                  <li>
                    <a href="#" className="hover:text-brand-600 transition-colors">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-brand-600 transition-colors">
                      Community Guidelines
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-brand-600 transition-colors">
                      Safety Tips
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-brand-600 transition-colors">
                      Contact Support
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                  <li>
                    <a href="#" className="hover:text-brand-600 transition-colors">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-brand-600 transition-colors">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-brand-600 transition-colors">
                      Cookie Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400 mb-4 md:mb-0">
                &copy; 2025 FairHour. All rights reserved.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Globe className="w-4 h-4" />
                <span>Built for communities, not marketplaces.</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Landing;
