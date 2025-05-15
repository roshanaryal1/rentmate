import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HomeIcon,
  LibraryIcon,
  UserGroupIcon,
  AdjustmentsIcon,
  ClipboardCheckIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  XIcon,
  CheckCircleIcon,
  ExclamationIcon,
  InboxIcon
} from '@heroicons/react/outline';

export default function AdminDashboard() {
  const [equipment, setEquipment] = useState([
    { id: 1, status: 'approved' },
    { id: 2, status: 'pending' },
    { id: 3, status: 'approved' }
  ]);
  const [rentals, setRentals] = useState([
    { id: 1, status: 'active' },
    { id: 2, status: 'inactive' },
    { id: 3, status: 'active' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifications] = useState([
    { id: 1, type: 'approval', text: 'Pending approvals', time: '2h ago' },
    { id: 2, type: 'inventory', text: 'Low inventory alert', time: '3h ago' },
    { id: 3, type: 'ticket', text: 'New support ticket', time: '1d ago' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Analytics
  const analytics = useMemo(() => {
    const totalEquipment = equipment.length;
    const activeRentals = rentals.filter(r => r.status === 'active').length;
    const pendingEquipment = equipment.filter(e => e.status === 'pending').length;
    const approvedEquipment = equipment.filter(e => e.status === 'approved').length;
    return { totalEquipment, activeRentals, pendingEquipment, approvedEquipment };
  }, [equipment, rentals]);

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return <FullScreenSpinner />;

  return (
    <div className="flex bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        {error && <Alert message={error} type="error" />}

        {/* Header with improved styling */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-white rounded-xl shadow-sm p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Overview & Management Tools</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            {/* Enhanced Notifications */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(v => !v)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <BellIcon className="h-6 w-6 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="origin-top-right absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10 animate-in slide-in-from-top-5 duration-200">
                  <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
                    <span className="font-semibold text-gray-800">Notifications</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <XIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {notifications.map(n => (
                      <li key={n.id} className="px-4 py-3 flex items-center space-x-3 hover:bg-blue-50 transition-colors cursor-pointer">
                        {n.type === 'approval' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                        {n.type === 'inventory' && <ExclamationIcon className="h-5 w-5 text-yellow-500" />}
                        {n.type === 'ticket' && <InboxIcon className="h-5 w-5 text-blue-500" />}
                        <div className="flex-1">
                          <span className="text-sm text-gray-700 block">{n.text}</span>
                          <span className="text-xs text-gray-400">{n.time}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="text-center py-3 bg-gray-50">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Enhanced Avatar */}
            <div className="relative">
              <img
                src="/api/placeholder/32/32"
                alt="Admin Avatar"
                className="h-10 w-10 rounded-full border-2 border-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Total Equipment" 
            value={analytics.totalEquipment} 
            icon={LibraryIcon}
            color="blue"
            trend="+12%"
          />
          <MetricCard 
            title="Active Rentals" 
            value={analytics.activeRentals} 
            icon={CheckCircleIcon}
            color="green"
            trend="+8%"
          />
          <MetricCard 
            title="Pending Approvals" 
            value={analytics.pendingEquipment} 
            icon={ClipboardCheckIcon}
            color="yellow"
            trend="-5%"
          />
          <MetricCard 
            title="Approved Equipment" 
            value={analytics.approvedEquipment} 
            icon={ChartBarIcon}
            color="purple"
            trend="+15%"
          />
        </div>

        {/* Enhanced Activity & Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentActivity className="lg:col-span-2" />
          <OverviewCard 
            title="Rentals Overview" 
            active={analytics.activeRentals} 
            inactive={rentals.length - analytics.activeRentals} 
          />
        </div>
      </main>
    </div>
  );
}

function Sidebar() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const menus = [
    { name: 'Dashboard', icon: HomeIcon, color: 'blue' },
    { name: 'Equipment', icon: LibraryIcon, color: 'green' },
    { name: 'Users', icon: UserGroupIcon, color: 'purple' },
    { name: 'Maintenance', icon: AdjustmentsIcon, color: 'yellow' },
    { name: 'Approvals', icon: ClipboardCheckIcon, color: 'red' },
    { name: 'Reports', icon: ChartBarIcon, color: 'indigo' },
    { name: 'Settings', icon: CogIcon, color: 'gray' }
  ];

  return (
    <aside className="w-64 bg-white shadow-xl border-r border-gray-200 flex-shrink-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">
          <span className="text-blue-600">Rent</span>Mate
        </h1>
        <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
      </div>
      <nav className="mt-4 px-4">
        {menus.map(m => (
          <button
            key={m.name}
            onClick={() => setActiveMenu(m.name)}
            className={`w-full px-4 py-3 mb-2 text-left rounded-lg transition-all duration-200 flex items-center space-x-3 group ${
              activeMenu === m.name
                ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <m.icon className={`h-5 w-5 transition-colors ${
              activeMenu === m.name ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
            }`} />
            <span className="font-medium">{m.name}</span>
            {activeMenu === m.name && (
              <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
            )}
          </button>
        ))}
      </nav>
      
      {/* Sidebar Footer */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
          <h3 className="font-semibold text-sm">Upgrade to Pro</h3>
          <p className="text-xs opacity-90 mt-1">Get advanced analytics</p>
          <button className="mt-3 w-full bg-white text-blue-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </aside>
  );
}

function MetricCard({ title, value, icon: Icon, color, trend }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  const trendColor = trend?.startsWith('+') ? 'text-green-600' : 'text-red-600';

  return (
    <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`mt-1 text-sm ${trendColor} font-medium`}>
              {trend} from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function RecentActivity({ className = '' }) {
  const activities = [
    { text: 'New renter added', time: '2 minutes ago', type: 'user' },
    { text: 'Maintenance request created', time: '1 hour ago', type: 'maintenance' },
    { text: 'Lease approved', time: '3 hours ago', type: 'approval' },
    { text: 'Property marked as occupied', time: '5 hours ago', type: 'property' },
    { text: 'Lease agreement sent', time: '1 day ago', type: 'document' }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user': return <UserGroupIcon className="h-5 w-5 text-blue-500" />;
      case 'maintenance': return <AdjustmentsIcon className="h-5 w-5 text-yellow-500" />;
      case 'approval': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'property': return <HomeIcon className="h-5 w-5 text-purple-500" />;
      case 'document': return <ClipboardCheckIcon className="h-5 w-5 text-indigo-500" />;
      default: return <div className="w-5 h-5 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className={`bg-white shadow-sm rounded-xl p-6 border border-gray-100 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View All
        </button>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{activity.text}</p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewCard({ title, active, inactive }) {
  const total = active + inactive;
  const pctActive = total > 0 ? Math.round((active / total) * 100) : 0;
  const pctInactive = 100 - pctActive;

  return (
    <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">{title}</h2>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Active Rentals</span>
            <span className="text-sm font-bold text-green-600">{active}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500" 
              style={{ width: `${pctActive}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{pctActive}% of total</p>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Inactive Rentals</span>
            <span className="text-sm font-bold text-gray-600">{inactive}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="h-3 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 transition-all duration-500" 
              style={{ width: `${pctInactive}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{pctInactive}% of total</p>
        </div>
      </div>
    </div>
  );
}

function FullScreenSpinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="relative">
        <div className="animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 h-16 w-16" />
        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    </div>
  );
}

function Alert({ message, type }) {
  const styles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-500'
    }
  };

  const style = styles[type] || styles.error;

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-4 mb-6 flex items-center space-x-3`}>
      <div className={`${style.icon}`}>
        {type === 'error' ? (
          <ExclamationIcon className="h-5 w-5" />
        ) : (
          <CheckCircleIcon className="h-5 w-5" />
        )}
      </div>
      <p className={`${style.text} font-medium`}>{message}</p>
    </div>
  );
}