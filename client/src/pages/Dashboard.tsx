import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Clock,
  Search,
  Briefcase,
  Star,
  MessageSquare,
  ChevronRight,
  Zap,
  Plus,
  Loader2,
  HandHelping,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { getTimeBalance } from '../api/auth';
import { getUserOccupationCredibility } from '../api/credibility';
import { getMyServices, getMyExchanges, Service, Exchange } from '../api/dashboard';
import Button from '../components/Button';
import CredibilityPills from '../components/CredibilityPills';
import PageTransition from '../components/PageTransition';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiUserOccupationCredibility } from '../types';

interface DashboardService extends Service {
  credibility?: ApiUserOccupationCredibility | null;
}

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtext: string;
  color: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  title,
  value,
  subtext,
  color,
  isLoading,
}) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-4 opacity-10">
      <Icon className="w-24 h-24" />
    </div>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      {isLoading ? (
        <div className="h-9 w-20 bg-gray-200 animate-pulse rounded mt-1" />
      ) : (
        <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
      )}
      <p className="text-gray-400 text-xs mt-2 flex items-center">{subtext}</p>
    </div>
  </motion.div>
);

// Empty state component
const EmptyState: React.FC<{ message: string; action?: { label: string; to: string } }> = ({
  message,
  action,
}) => (
  <div className="text-center py-8">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Briefcase className="w-8 h-8 text-gray-400" />
    </div>
    <p className="text-gray-500 mb-4">{message}</p>
    {action && (
      <Link to={action.to}>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      </Link>
    )}
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State for dashboard data
  const [balance, setBalance] = useState({ balance: 0, hoursEarned: 0, hoursSpent: 0 });
  const [services, setServices] = useState<DashboardService[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        return;
      }

      setIsLoading(true);
      try {
        const [balanceData, servicesData, exchangesData] = await Promise.all([
          getTimeBalance(),
          getMyServices(),
          getMyExchanges(),
        ]);

        setBalance(balanceData);
        const servicesWithCredibility = await Promise.all(
          servicesData.map(async (service) => {
            if (!service.occupationId || !user?.id) {
              return { ...service, credibility: null };
            }

            const credibility = await getUserOccupationCredibility(user.id, service.occupationId);
            return { ...service, credibility };
          })
        );

        setServices(servicesWithCredibility);
        setExchanges(exchangesData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  // Generate avatar from name initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate active exchanges
  const activeExchanges = exchanges.filter(
    (e) => e.status === 'PENDING' || e.status === 'ACCEPTED' || e.status === 'ACTIVE'
  );
  const completedExchanges = exchanges.filter((e) => e.status === 'COMPLETED');

  // Time period state for chart
  const [chartPeriod, setChartPeriod] = useState<
    'today' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all'
  >('1w');

  // Generate chart data from actual exchanges based on selected period
  const generateChartData = () => {
    const now = new Date();
    const periods: { name: string; startDate: Date; endDate: Date }[] = [];

    switch (chartPeriod) {
      case 'today':
        // Show hours of today (8 AM to 8 PM or current hour)
        const currentHour = now.getHours();
        const startHour = 8; // Start from 8 AM
        const endHour = Math.max(currentHour, 18); // End at current hour or 6 PM
        for (let hour = startHour; hour <= endHour; hour++) {
          const date = new Date(now);
          date.setHours(hour, 0, 0, 0);
          const endDate = new Date(date);
          endDate.setHours(hour, 59, 59, 999);
          periods.push({
            name: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
            startDate: date,
            endDate: endDate,
          });
        }
        break;
      case '1w':
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          periods.push({
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            startDate: new Date(date.setHours(0, 0, 0, 0)),
            endDate: new Date(date.setHours(23, 59, 59, 999)),
          });
        }
        break;
      case '1m':
        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() - i * 7);
          const startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 6);
          periods.push({
            name: `W${4 - i}`,
            startDate,
            endDate,
          });
        }
        break;
      case '3m':
      case '6m':
      case '1y':
        // Monthly data
        const monthCount = chartPeriod === '3m' ? 3 : chartPeriod === '6m' ? 6 : 12;
        for (let i = monthCount - 1; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          periods.push({
            name: date.toLocaleDateString('en-US', { month: 'short' }),
            startDate: new Date(date.getFullYear(), date.getMonth(), 1),
            endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
          });
        }
        break;
      case 'all':
        // Get all unique months from exchanges
        const allDates = completedExchanges.map((e) => new Date(e.completedAt || e.createdAt));
        if (allDates.length === 0) {
          // Show current month if no data
          periods.push({
            name: now.toLocaleDateString('en-US', { month: 'short' }),
            startDate: new Date(now.getFullYear(), now.getMonth(), 1),
            endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
          });
        } else {
          const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
          let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
          while (current <= now) {
            periods.push({
              name: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
              startDate: new Date(current),
              endDate: new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999),
            });
            current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
          }
        }
        break;
    }

    // Calculate cumulative balance up to each period
    return periods.map((period) => {
      // Get all completed exchanges up to this period's end
      const exchangesUpToPeriod = completedExchanges.filter(
        (e) => new Date(e.completedAt || e.createdAt) <= period.endDate
      );

      // Calculate balance using providerId and requesterId directly
      let earned = 0;
      let spent = 0;
      exchangesUpToPeriod.forEach((e) => {
        if (e.providerId === user?.id) earned += e.hours;
        // Exclude self-referential (signup bonus)
        if (e.requesterId === user?.id && e.providerId !== e.requesterId) spent += e.hours;
      });

      return {
        name: period.name,
        balance: earned - spent,
      };
    });
  };

  const chartData = generateChartData();

  // Period options for dropdown
  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: '1w', label: 'Last week' },
    { value: '1m', label: 'Last month' },
    { value: '3m', label: 'Last 3 months' },
    { value: '6m', label: 'Last 6 months' },
    { value: '1y', label: 'Last year' },
    { value: 'all', label: 'All time' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center mb-8 pb-8 border-b border-gray-100">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.name}
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div
                  className={`w-12 h-12 rounded-full mr-4 bg-brand-500 flex items-center justify-center text-white font-bold text-lg ${user.profileImageUrl ? 'hidden' : ''}`}
                >
                  {getInitials(user.name)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{user.name}</h4>
                  <p className="text-xs text-gray-500">{user.location || 'Location not set'}</p>
                </div>
              </div>
              <nav className="space-y-2">
                {[
                  { name: 'Home', icon: Briefcase, path: '/dashboard' },
                  { name: 'Services I Offer', icon: Zap, path: '/my-services' },
                  { name: 'Help I Asked For', icon: Clock, path: '/my-requests' },
                  { name: 'Messages', icon: MessageSquare, path: '/messages' },
                  { name: 'Find Help', icon: Search, path: '/browse' },
                  { name: 'Help Requests', icon: HandHelping, path: '/requests' },
                ].map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 mr-3 ${isActive(item.path) ? 'text-brand-600' : 'text-gray-400'}`}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user.name.split(' ')[0]}!
                </h1>
                <p className="text-gray-500">Everything happening in your FairHour account.</p>
              </div>
              <div className="flex gap-3">
                <Link to="/my-services">
                  <Button size="sm" variant="secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Share a Skill
                  </Button>
                </Link>
                <Link to="/my-requests">
                  <Button size="sm">
                    <HandHelping className="w-4 h-4 mr-2" />
                    Ask for Help
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                icon={Clock}
                title="Time Balance"
                value={`${balance.balance.toFixed(1)}h`}
                subtext={`Earned: ${balance.hoursEarned}h | Spent: ${balance.hoursSpent}h`}
                color="bg-brand-500"
                isLoading={isLoading}
              />
              <StatCard
                icon={Briefcase}
                title="Active Exchanges"
                value={activeExchanges.length}
                subtext={`${completedExchanges.length} completed total`}
                color="bg-blue-500"
                isLoading={isLoading}
              />
              <StatCard
                icon={Star}
                title="Reputation"
                value={user.reputationScore.toFixed(1)}
                subtext="Based on reviews"
                color="bg-yellow-400"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900">Balance History</h3>
                  <select
                    value={chartPeriod}
                    onChange={(e) => setChartPeriod(e.target.value as typeof chartPeriod)}
                    className="text-sm border border-gray-200 bg-gray-50 rounded-lg px-3 py-1.5 text-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 cursor-pointer"
                  >
                    {periodOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#22c55e"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorBalance)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-6">Recent Activity</h3>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center p-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse mr-3" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4 mb-2" />
                          <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : exchanges.length === 0 ? (
                  <EmptyState message="No exchanges yet. Start offering or requesting services!" />
                ) : (
                  <div className="space-y-4">
                    {exchanges.slice(0, 5).map((exchange) => (
                      <div
                        key={exchange.id}
                        onClick={() => navigate(`/activity?exchange=${exchange.id}`)}
                        className="flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {exchange.hours}h exchange
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {new Date(exchange.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            exchange.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : exchange.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : exchange.status === 'ACCEPTED'
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {exchange.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/activity">
                    <Button variant="ghost" fullWidth className="mt-4 text-sm">
                    See all activity
                  </Button>
                </Link>
              </div>
            </div>

            {/* Services I Offer */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Services I Offer</h3>
                <Link
                  to="/my-services"
                  className="text-brand-600 text-sm font-semibold hover:underline flex items-center"
                >
                  See all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5"
                    >
                      <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4 mb-4" />
                      <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2 mb-2" />
                      <div className="h-3 bg-gray-200 animate-pulse rounded w-1/4" />
                    </div>
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
                  <EmptyState
                    message="You haven't shared any services yet."
                    action={{ label: 'Add a Service', to: '/my-services' }}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.slice(0, 3).map((service) => (
                    <motion.div
                      key={service.id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 hover:shadow-lg transition-all"
                    >
                      <h3 className="font-bold text-gray-900 mb-2">{service.title}</h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {service.description}
                      </p>
                      {service.credibility && (
                        <div className="mb-4">
                          <CredibilityPills
                            declaredLevel={service.credibility.declaredLevel}
                            badge={service.credibility.badge}
                            credibilityScore={service.credibility.credibilityScore}
                            compact
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          {service.category}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            service.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
