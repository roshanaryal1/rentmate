import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Simplified StatCard Component
const StatCard = ({ title, value }) => (
  <div className="bg-white rounded p-4 shadow">
    <h3 className="text-gray-700">{title}</h3>
    <span className="text-2xl font-bold">{value}</span>
  </div>
);

// Simplified ActivityItem Component
const ActivityItem = ({ icon, title }) => (
  <div className="py-2 flex items-center">
    <div className="mr-2">{icon}</div>
    <p className="text-sm">{title}</p>
  </div>
);

// Simplified NotificationItem Component
const NotificationItem = ({ icon, title, time }) => (
  <div className="py-3 border-b border-gray-100">
    <div className="flex items-center">
      <div className="mr-2">{icon}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <div className="text-xs text-gray-500 mt-1">{time}</div>
      </div>
    </div>
  </div>
);

// Main AdminDashboard Component
const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { currentUser } = useAuth();

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    properties: { total: 0, occupied: 0 },
    renters: { active: 0, inactive: 0 },
    recentActivity: [],
    notifications: [],
  });

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Properties listener
        const propertiesRef = collection(db, 'equipment');
        const propertiesQuery = query(propertiesRef);
        
        const propertiesUnsubscribe = onSnapshot(propertiesQuery, (snapshot) => {
          const total = snapshot.size;
          let occupied = 0;
          
          snapshot.forEach(doc => {
            if (!doc.data().available) {
              occupied++;
            }
          });
          
          setDashboardData(prev => ({
            ...prev,
            properties: { total, occupied }
          }));
        });
        
        // Renters listener
        const usersRef = collection(db, 'users');
        const rentersQuery = query(usersRef, where("role", "==", "renter"));
        
        const rentersUnsubscribe = onSnapshot(rentersQuery, (snapshot) => {
          let active = 0;
          let inactive = 0;
          
          snapshot.forEach(doc => {
            const user = doc.data();
            if (user.status === 'inactive') {
              inactive++;
            } else {
              active++;
            }
          });
          
          setDashboardData(prev => ({
            ...prev,
            renters: { active, inactive }
          }));
        });
        
        // Recent activity listener
        const activityRef = collection(db, 'activity');
        const activityQuery = query(
          activityRef,
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        
        const activityUnsubscribe = onSnapshot(activityQuery, (snapshot) => {
          const activities = [];
          snapshot.forEach(doc => {
            activities.push({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate()
            });
          });
          
          setDashboardData(prev => ({
            ...prev,
            recentActivity: activities
          }));
        });
        
        // Notifications listener
        const notificationsRef = collection(db, 'notifications');
        const notificationsQuery = query(
          notificationsRef,
          orderBy('timestamp', 'desc'),
          limit(3)
        );
        
        const notificationsUnsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
          const notifications = [];
          snapshot.forEach(doc => {
            notifications.push({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate()
            });
          });
          
          setDashboardData(prev => ({
            ...prev,
            notifications: notifications
          }));
        });
        
        setLoading(false);
        
        // Cleanup listeners on unmount
        return () => {
          propertiesUnsubscribe();
          rentersUnsubscribe();
          activityUnsubscribe();
          notificationsUnsubscribe();
        };
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Helper functions for icons and time formatting
  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_renter':
        return <span className="text-blue-500">👤</span>;
      case 'maintenance':
        return <span className="text-orange-500">🔧</span>;
      case 'lease_approved':
        return <span className="text-green-500">✓</span>;
      case 'property_occupied':
        return <span className="text-purple-500">🏠</span>;
      case 'lease_sent':
        return <span className="text-blue-500">📄</span>;
      default:
        return <span className="text-gray-500">🕒</span>;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approval':
        return <span className="text-blue-500">🚩</span>;
      case 'alert':
        return <span className="text-yellow-500">⚠️</span>;
      case 'ticket':
        return <span className="text-gray-700">📥</span>;
      default:
        return <span className="text-blue-500">🔔</span>;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const diff = Math.floor((now - timestamp) / (1000 * 60 * 60));
    
    if (diff < 24) {
      return `${diff}h ago`;
    } else {
      return `${Math.floor(diff / 24)}d ago`;
    }
  };

  // Mock data if needed
  const activityData = dashboardData.recentActivity.length > 0 ? 
    dashboardData.recentActivity : 
    [
      { id: 1, type: 'new_renter', title: 'New renter added', timestamp: new Date(Date.now() - 3600000) },
      { id: 2, type: 'maintenance', title: 'Maintenance request created', timestamp: new Date(Date.now() - 7200000) },
      { id: 3, type: 'lease_approved', title: 'Lease approved', timestamp: new Date(Date.now() - 10800000) },
      { id: 4, type: 'property_occupied', title: 'Property marked as occupied', timestamp: new Date(Date.now() - 14400000) },
      { id: 5, type: 'lease_sent', title: 'Lease agreement sent', timestamp: new Date(Date.now() - 18000000) }
    ];

  const notificationData = dashboardData.notifications.length > 0 ?
    dashboardData.notifications :
    [
      { id: 1, type: 'approval', title: 'Pending approvals', timestamp: new Date(Date.now() - 7200000) },
      { id: 2, type: 'alert', title: 'Low inventory alert', timestamp: new Date(Date.now() - 10800000) },
      { id: 3, type: 'ticket', title: 'New support ticket', timestamp: new Date(Date.now() - 86400000) }
    ];

  // Chart data
  const renterChartData = [
    { name: 'Active', value: dashboardData.renters.active || 78 },
    { name: 'Inactive', value: dashboardData.renters.inactive || 12 }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-56 bg-slate-800 text-white">
        <div className="p-4 border-b border-slate-700">
          <span className="font-medium">RentMate</span>
        </div>
        
        <nav className="mt-4">
          <div className="mx-2 p-2 bg-slate-700 rounded">
            <span className="text-sm">Dashboard</span>
          </div>
          
          <div className="mt-3 px-2">
            <a href="#" className="block p-2 text-sm text-gray-300 hover:bg-slate-700 rounded">Properties</a>
            <a href="#" className="block p-2 text-sm text-gray-300 hover:bg-slate-700 rounded">Renters</a>
            <a href="#" className="block p-2 text-sm text-gray-300 hover:bg-slate-700 rounded">Maintenance</a>
            <a href="#" className="block p-2 text-sm text-gray-300 hover:bg-slate-700 rounded">Approvals</a>
            <a href="#" className="block p-2 text-sm text-gray-300 hover:bg-slate-700 rounded">Reports</a>
            <a href="#" className="block p-2 text-sm text-gray-300 hover:bg-slate-700 rounded">Settings</a>
          </div>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="text-lg font-medium">Dashboard</h1>
          
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="p-2 pl-8 border rounded w-56"
              />
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1 rounded-full text-gray-700 hover:bg-gray-100"
              >
                🔔
                {notificationData.length > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-blue-500 text-white text-xs flex items-center justify-center rounded-full">
                    {notificationData.length}
                  </span>
                )}
              </button>
              
              {/* Notifications Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-1 w-72 bg-white rounded shadow-lg z-10 border border-gray-200">
                  <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-medium">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notificationData.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        icon={getNotificationIcon(notification.type)}
                        title={notification.title}
                        time={formatTime(notification.timestamp)}
                      />
                    ))}
                  </div>
                  
                  <div className="p-2 text-center border-t border-gray-100">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      View all
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Profile Button */}
            <button>
              <div className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                <span className="text-xs font-medium">A</span>
              </div>
            </button>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="flex-1 p-4 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm">
              <p>⚠️ {error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <StatCard
                  title="Total Properties"
                  value={dashboardData.properties.total || 120}
                />
                <StatCard
                  title="Occupied"
                  value={dashboardData.properties.occupied || 87}
                />
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white rounded shadow p-4 mb-4">
                <h2 className="font-medium mb-3">Recent Activity</h2>
                <div className="divide-y divide-gray-100">
                  {activityData.map(activity => (
                    <ActivityItem
                      key={activity.id}
                      icon={getActivityIcon(activity.type)}
                      title={activity.title}
                    />
                  ))}
                </div>
              </div>
              
              {/* Renters Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded shadow p-4">
                  <h2 className="font-medium mb-3">Renters Overview</h2>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Active</span>
                      <span className="font-medium text-sm">{dashboardData.renters.active || 78}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-sm text-gray-700">Inactive</span>
                      <span className="font-medium text-sm">{dashboardData.renters.inactive || 12}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded shadow p-4">
                  <h2 className="font-medium mb-3">Renters Overview</h2>
                  
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart
                      data={renterChartData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip contentStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;