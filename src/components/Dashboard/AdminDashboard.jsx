import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Import for navigation

// Firebase Imports
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebase'; // Fixed path to firebase
import { useAuth } from '../../contexts/AuthContext'; // Fixed path to AuthContext

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [metrics, setMetrics] = useState({
    equipment: 0,
    users: 0,
    revenue: 0,
    loading: true,
  });
  const [recentRentals, setRecentRentals] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate(); // Use React Router's navigate hook

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch real-time data from Firestore
  useEffect(() => {
    let unsubs = [];

    try {
      // Equipment count
      const eqRef = collection(db, 'equipment');
      const eqUnsub = onSnapshot(eqRef, (snap) => {
        setMetrics((prev) => ({ ...prev, equipment: snap.size }));
      });
      unsubs.push(eqUnsub);

      // Users count (only renters)
      const userRef = query(collection(db, 'users'), where('role', '==', 'renter'));
      const userUnsub = onSnapshot(userRef, (snap) => {
        setMetrics((prev) => ({ ...prev, users: snap.size }));
      });
      unsubs.push(userUnsub);

      // Revenue total
      const rentalRef = collection(db, 'rentals');
      const revenueUnsub = onSnapshot(rentalRef, (snap) => {
        const total = snap.docs.reduce((sum, doc) => sum + (doc.data().price || 0), 0);
        setMetrics((prev) => ({
          ...prev,
          revenue: total,
          loading: false,
        }));
      });
      unsubs.push(revenueUnsub);

      // Recent Rentals
      const recentRef = query(
        collection(db, 'rentals'),
        orderBy('startDate', 'desc'),
        limit(5)
      );
      const recentUnsub = onSnapshot(recentRef, (snap) => {
        const rentals = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentRentals(rentals);
        setRentalsLoading(false);
      });
      unsubs.push(recentUnsub);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setMetrics((prev) => ({ ...prev, loading: false }));
      setRentalsLoading(false);
    }

    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Use navigate instead of window.location
    } catch (err) {
      setError('Logout failed. Please try again.');
    }
  };

  const formattedRevenue = useMemo(() => {
    return metrics.revenue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    });
  }, [metrics.revenue]);

  const tabIcons = {
    Overview: (
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
      </svg>
    ),
    Equipment: (
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.993.993 0 00.01.042l1.358 5.43-.893.892C3.74 11.84 2 13.497 2 15a3 3 0 106 0c0-1.503-1.74-3.16-2.49-4.455l-.913-.913L9.44 9.44A1 1 0 0010 10v2a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1h-1a1 1 0 00-.707.293l-2.42 2.42a1 1 0 01-1.414 0L6.586 10A1 1 0 005.172 9.586l-.913-.913L3.74 7.26a1 1 0 01.042-.01 1 1 0 01.293-.144l1.358-.892L5 3.292A1 1 0 004.293 2H3z"></path>
      </svg>
    ),
    Users: (
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
      </svg>
    ),
    Rentals: (
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
      </svg>
    ),
    Analytics: (
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
      </svg>
    ),
    Settings: (
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
      </svg>
    ),
  };

  const statusColors = {
    Returned: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Overdue: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition duration-300 transform bg-white shadow-lg md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-xl font-bold">RentMate</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-500 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-4 px-4">
          {Object.keys(tabIcons).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center w-full px-4 py-2 mt-2 rounded-md capitalize ${
                activeTab === tab
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tabIcons[tab]}
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 focus:outline-none md:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-700">Admin Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <img
              src={currentUser?.photoURL || 'https://i.pravatar.cc/60'}
              alt="Profile"
              className="w-8 h-8 rounded-full border border-gray-300"
            />
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded">
              {error}
            </div>
          )}

          {activeTab === 'Overview' && (
            <>
              <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
                <StatCard icon={<CartIcon />} value={metrics.equipment} label="Total Equipment" loading={metrics.loading} />
                <StatCard icon={<UserIcon />} value={metrics.users} label="Total Renters" loading={metrics.loading} />
                <StatCard icon={<ChartIcon />} value={formattedRevenue} label="Total Revenue" loading={metrics.loading} />
              </div>

              <div className="p-4 bg-white rounded shadow">
                <h2 className="mb-4 text-lg font-medium">Recent Rentals</h2>
                <RecentRentalsTable rentals={recentRentals} loading={rentalsLoading} statusColors={statusColors} />
              </div>
            </>
          )}

          {activeTab !== 'Overview' && (
            <div className="p-4 bg-white rounded shadow">
              <p className="text-gray-500">{activeTab} section is under development.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// StatCard Component
function StatCard({ icon, value, label, loading }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex items-center">
        <div className="p-3 text-blue-600 bg-blue-100 rounded-full">{icon}</div>
        <div className="ml-4">
          <h2 className="text-2xl font-semibold">
            {loading ? <span className="animate-pulse">...</span> : value}
          </h2>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// RecentRentalsTable Component
function RecentRentalsTable({ rentals, loading, statusColors }) {
  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!rentals.length) {
    return <p className="text-sm text-gray-500">No recent rentals found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Equipment</th>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Renter</th>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Owner</th>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rentals.map((rental) => (
            <tr key={rental.id}>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H4zm0 2h12v10H4V5z" />
                  </svg>
                  {rental.equipmentName || 'N/A'}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{rental.renterName || 'Unknown'}</td>
              <td className="px-4 py-3 whitespace-nowrap">{rental.ownerName || 'Unknown'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {rental.startDate ? new Date(rental.startDate).toLocaleDateString() : 'Unknown'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${statusColors[rental.status] || 'bg-gray-100 text-gray-800'}`}>
                  {rental.status || 'Unknown'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Custom SVG Icons
function CartIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.993.993 0 00.01.042l1.358 5.43-.893.892C3.74 11.84 2 13.497 2 15a3 3 0 106 0c0-1.503-1.74-3.16-2.49-4.455l-.913-.913L9.44 9.44A1 1 0 0010 10v2a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1h-1a1 1 0 00-.707.293l-2.42 2.42a1 1 0 01-1.414 0L6.586 10A1 1 0 005.172 9.586l-.913-.913L3.74 7.26a1 1 0 01.042-.01 1 1 0 01.293-.144l1.358-.892L5 3.292A1 1 0 004.293 2H3z"></path>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0z"></path>
      <path d="M12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
    </svg>
  );
}