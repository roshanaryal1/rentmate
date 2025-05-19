// src/components/Dashboard/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  getDocs,
  where,
  limit,
  orderBy,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../../firebase';
// ← Changed this to default import:
import ThemeProvider from '../../theme/ThemeContext';
import {
  HomeIcon,
  LibraryIcon,
  UserGroupIcon,
  ClipboardCheckIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  XIcon,
  CheckCircleIcon
} from '@heroicons/react/outline';
import { ExclamationIcon } from '@heroicons/react/solid';

// Define chart components directly instead of importing
// RentalStatisticsChart component
const RentalStatisticsChart = ({ data }) => {
  // Simple placeholder implementation for the chart
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500 dark:text-gray-400">
        {data && data.length 
          ? `Chart showing ${data.length} data points for rental statistics` 
          : "No rental data available"}
      </p>
    </div>
  );
};

// EquipmentDistributionChart component
const EquipmentDistributionChart = ({ data }) => {
  // Simple placeholder implementation for the chart
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500 dark:text-gray-400">
        {data && data.length 
          ? `Chart showing distribution of ${data.length} equipment categories` 
          : "No equipment data available"}
      </p>
    </div>
  );
};

// RevenueChart component
const RevenueChart = ({ data }) => {
  // Simple placeholder implementation for the chart
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500 dark:text-gray-400">
        {data && data.length 
          ? `Chart showing revenue data with ${data.length} data points` 
          : "No revenue data available"}
      </p>
    </div>
  );
};

// Define the Sidebar component
const Sidebar = () => {
  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
        <div className="h-16 flex items-center justify-center border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Admin Panel</h2>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <HomeIcon className="w-5 h-5 mr-3" />
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <LibraryIcon className="w-5 h-5 mr-3" />
              <span>Equipment</span>
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <ClipboardCheckIcon className="w-5 h-5 mr-3" />
              <span>Rentals</span>
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <UserGroupIcon className="w-5 h-5 mr-3" />
              <span>Users</span>
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChartBarIcon className="w-5 h-5 mr-3" />
              <span>Reports</span>
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <CogIcon className="w-5 h-5 mr-3" />
              <span>Settings</span>
            </a>
          </nav>
        </div>
      </div>
    </aside>
  );
};

// Define the TopNavigation component
const TopNavigation = ({ notifications, notificationsOpen, setNotificationsOpen }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Dashboard</h1>
        </div>
        <div className="flex items-center">
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            >
              <BellIcon className="h-6 w-6" />
              {notifications && notifications.length > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>
            
            {notificationsOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <div className="px-4 py-2 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                    <button 
                      onClick={() => setNotificationsOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {notifications && notifications.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className="px-4 py-2 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                              {notification.read ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              ) : (
                                <ExclamationIcon className="h-5 w-5 text-yellow-500" />
                              )}
                            </div>
                            <div className="ml-3 w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {notification.message}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                {notification.timestamp}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No new notifications
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Activity components
const ActivityIcon = ({ type }) => {
  switch (type) {
    case 'rental':
      return <ClipboardCheckIcon className="h-5 w-5 text-blue-500" />;
    case 'user':
      return <UserGroupIcon className="h-5 w-5 text-green-500" />;
    case 'equipment':
      return <LibraryIcon className="h-5 w-5 text-purple-500" />;
    default:
      return <BellIcon className="h-5 w-5 text-gray-500" />;
  }
};

const ActivityList = ({ activities }) => {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, index) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {index !== activities.length - 1 ? (
                <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
              ) : null}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-8 ring-white dark:ring-gray-900">
                    <ActivityIcon type={activity.type} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {activity.timestamp}
                    </p>
                  </div>
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>{activity.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const StatsCard = ({ title, value, subtitle, icon, change, isPositive }) => {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900">{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
        <div className="text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">{subtitle}</span>
            {change && (
              <span
                className={`inline-flex items-center text-sm font-medium ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {isPositive ? '↑' : '↓'} {Math.abs(change)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Define the fetch functions
const fetchEquipmentStats = async () => {
  try {
    const equipmentRef = collection(db, 'equipment');
    const equipmentSnapshot = await getDocs(equipmentRef);
    
    let total = 0;
    let available = 0;
    let pending = 0;
    let approved = 0;

    equipmentSnapshot.forEach(doc => {
      const data = doc.data();
      total++;
      
      if (data.status === 'available') available++;
      if (data.status === 'pending') pending++;
      if (data.status === 'approved') approved++;
    });

    return { total, available, pending, approved };
  } catch (error) {
    console.error('Error fetching equipment stats:', error);
    return { total: 0, available: 0, pending: 0, approved: 0 };
  }
};

const fetchRentalStats = async () => {
  try {
    const rentalRef = collection(db, 'rentals');
    const rentalSnapshot = await getDocs(rentalRef);
    
    let total = 0;
    let active = 0;
    let inactive = 0;
    let revenue = 0;

    rentalSnapshot.forEach(doc => {
      const data = doc.data();
      total++;
      
      if (data.status === 'active') {
        active++;
        revenue += data.amount || 0;
      }
      if (data.status === 'inactive' || data.status === 'completed') inactive++;
    });

    return { total, active, inactive, revenue };
  } catch (error) {
    console.error('Error fetching rental stats:', error);
    return { total: 0, active: 0, inactive: 0, revenue: 0 };
  }
};

const fetchUserStats = async () => {
  try {
    const userRef = collection(db, 'users');
    const userSnapshot = await getDocs(userRef);
    
    let total = 0;
    let owners = 0;
    let renters = 0;

    userSnapshot.forEach(doc => {
      const data = doc.data();
      total++;
      
      if (data.role === 'owner') owners++;
      if (data.role === 'renter') renters++;
    });

    return { total, owners, renters };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { total: 0, owners: 0, renters: 0 };
  }
};

const fetchRecentActivity = async () => {
  try {
    const activityRef = collection(db, 'activity');
    const q = query(
      activityRef,
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const activitySnapshot = await getDocs(q);
    
    const activities = [];
    activitySnapshot.forEach(doc => {
      activities.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return activities;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
};

const fetchRentalChartData = async () => {
  try {
    const rentalRef = collection(db, 'rentals');
    const rentalSnapshot = await getDocs(rentalRef);
    
    // Group rentals by month
    const monthlyData = {};
    
    rentalSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.createdAt) {
        const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${month}`;
        
        if (!monthlyData[key]) {
          monthlyData[key] = { month: new Date(year, month, 1), count: 0 };
        }
        
        monthlyData[key].count++;
      }
    });
    
    // Convert to array and sort by date
    return Object.values(monthlyData).sort((a, b) => a.month - b.month);
  } catch (error) {
    console.error('Error fetching rental chart data:', error);
    return [];
  }
};

const fetchEquipmentDistribution = async () => {
  try {
    const equipmentRef = collection(db, 'equipment');
    const equipmentSnapshot = await getDocs(equipmentRef);
    
    // Group equipment by category
    const categoryData = {};
    
    equipmentSnapshot.forEach(doc => {
      const data = doc.data();
      const category = data.category || 'Uncategorized';
      
      if (!categoryData[category]) {
        categoryData[category] = { name: category, value: 0 };
      }
      
      categoryData[category].value++;
    });
    
    // Convert to array
    return Object.values(categoryData);
  } catch (error) {
    console.error('Error fetching equipment distribution:', error);
    return [];
  }
};

const fetchNotifications = async () => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const notificationsSnapshot = await getDocs(q);
    
    const notifications = [];
    notificationsSnapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Main AdminDashboard component
const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    equipment: { total: 0, available: 0, pending: 0, approved: 0 },
    rentals: { total: 0, active: 0, inactive: 0, revenue: 0 },
    users: { total: 0, owners: 0, renters: 0 },
    recentActivity: [],
    notifications: [],
    rentalChartData: [],
    equipmentDistribution: []
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          equipmentStats,
          rentalStats,
          userStats,
          recentActivity,
          rentalChartData,
          equipmentDistribution,
          notifications
        ] = await Promise.all([
          fetchEquipmentStats(),
          fetchRentalStats(),
          fetchUserStats(),
          fetchRecentActivity(),
          fetchRentalChartData(),
          fetchEquipmentDistribution(),
          fetchNotifications()
        ]);

        setDashboardData({
          equipment: equipmentStats,
          rentals: rentalStats,
          users: userStats,
          recentActivity,
          rentalChartData,
          equipmentDistribution,
          notifications
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    const refreshInterval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavigation
            notifications={dashboardData.notifications}
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
          />
          <main className="flex-1 overflow-y-auto p-5">
            {error && (
              <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
                <div className="flex items-center">
                  <ExclamationIcon className="h-6 w-6 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24 border-t-blue-600 animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Dashboard content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
                  {/* Equipment Stats */}
                  <StatsCard 
                    title="Total Equipment" 
                    value={dashboardData.equipment.total}
                    subtitle={`${dashboardData.equipment.available} available`}
                    icon={<LibraryIcon className="h-6 w-6 text-blue-600" />}
                  />
                  
                  {/* Rental Stats */}
                  <StatsCard 
                    title="Active Rentals" 
                    value={dashboardData.rentals.active}
                    subtitle={`${dashboardData.rentals.total} total rentals`}
                    icon={<ClipboardCheckIcon className="h-6 w-6 text-green-600" />}
                  />
                  
                  {/* User Stats */}
                  <StatsCard 
                    title="Total Users" 
                    value={dashboardData.users.total}
                    subtitle={`${dashboardData.users.owners} owners, ${dashboardData.users.renters} renters`}
                    icon={<UserGroupIcon className="h-6 w-6 text-purple-600" />}
                  />
                  
                  {/* Revenue Stats */}
                  <StatsCard 
                    title="Total Revenue" 
                    value={`$${dashboardData.rentals.revenue.toLocaleString()}`}
                    subtitle="From active rentals"
                    icon={<ChartBarIcon className="h-6 w-6 text-yellow-600" />}
                    change={5.3}
                    isPositive={true}
                  />
                </div>
                
                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Rental Statistics</h3>
                    <div className="h-64">
                      <RentalStatisticsChart data={dashboardData.rentalChartData} />
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Equipment Distribution</h3>
                    <div className="h-64">
                      <EquipmentDistributionChart data={dashboardData.equipmentDistribution} />
                    </div>
                  </div>
                </div>
                
                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-5 border-b dark:border-gray-700 sm:px-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <ActivityList activities={dashboardData.recentActivity} />
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default AdminDashboard;