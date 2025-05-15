import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const { currentUser } = useAuth();

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch users
        const usersCollection = collection(db, "users");
        const userSnapshot = await getDocs(usersCollection);
        const usersList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList.filter(user => user.id !== currentUser.uid));
        
        // Fetch equipment
        const equipmentCollection = collection(db, "equipment");
        const equipmentSnapshot = await getDocs(equipmentCollection);
        const equipmentList = equipmentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEquipment(equipmentList);
        
        // Fetch rentals
        const rentalsCollection = collection(db, "rentals");
        const rentalsSnapshot = await getDocs(rentalsCollection);
        const rentalsList = rentalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRentals(rentalsList);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
        console.error(err);
      }
    }
    
    fetchData();
  }, [currentUser]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalRevenue = rentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
    const activeRentals = rentals.filter(rental => rental.status === 'active').length;
    const pendingEquipment = equipment.filter(item => item.status === 'pending').length;
    const approvedEquipment = equipment.filter(item => item.status === 'approved').length;
    const totalUsers = users.length;
    const ownerCount = users.filter(user => user.role === 'owner').length;
    const renterCount = users.filter(user => user.role === 'renter').length;
    
    // Revenue by category
    const revenueByCategory = {};
    rentals.forEach(rental => {
      const equipmentItem = equipment.find(eq => eq.id === rental.equipmentId);
      if (equipmentItem) {
        const category = equipmentItem.category || 'Other';
        revenueByCategory[category] = (revenueByCategory[category] || 0) + (rental.totalPrice || 0);
      }
    });

    return {
      totalRevenue,
      activeRentals,
      pendingEquipment,
      approvedEquipment,
      totalUsers,
      ownerCount,
      renterCount,
      revenueByCategory
    };
  }, [users, equipment, rentals]);

  // Handle equipment actions
  async function handleApproveEquipment(equipmentId) {
    try {
      const equipmentRef = doc(db, "equipment", equipmentId);
      await updateDoc(equipmentRef, {
        status: "approved",
        updatedAt: serverTimestamp()
      });
      
      setEquipment(prevEquipment => 
        prevEquipment.map(item => 
          item.id === equipmentId 
            ? { ...item, status: "approved" } 
            : item
        )
      );
    } catch (err) {
      setError('Failed to approve equipment');
      console.error(err);
    }
  }

  async function handleRejectEquipment(equipmentId) {
    try {
      const equipmentRef = doc(db, "equipment", equipmentId);
      await updateDoc(equipmentRef, {
        status: "rejected",
        updatedAt: serverTimestamp()
      });
      
      setEquipment(prevEquipment => 
        prevEquipment.map(item => 
          item.id === equipmentId 
            ? { ...item, status: "rejected" } 
            : item
        )
      );
    } catch (err) {
      setError('Failed to reject equipment');
      console.error(err);
    }
  }

  async function handleDeleteEquipment(equipmentId) {
    if (window.confirm("Are you sure you want to delete this equipment?")) {
      try {
        await deleteDoc(doc(db, "equipment", equipmentId));
        setEquipment(prevEquipment => 
          prevEquipment.filter(item => item.id !== equipmentId)
        );
      } catch (err) {
        setError('Failed to delete equipment');
        console.error(err);
      }
    }
  }

  // Handle user role changes
  async function handleChangeUserRole(userId, newRole) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, role: newRole } 
            : user
        )
      );
    } catch (err) {
      setError('Failed to update user role');
      console.error(err);
    }
  }

  // Filter and sort functions
  const filteredEquipment = useMemo(() => {
    let filtered = equipment.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
      return matchesSearch && matchesFilter;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'createdAt' && aVal && bVal) {
        aVal = aVal.toDate ? aVal.toDate() : new Date(aVal);
        bVal = bVal.toDate ? bVal.toDate() : new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [equipment, searchTerm, filterStatus, sortBy, sortOrder]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NZ', { 
      style: 'currency', 
      currency: 'NZD' 
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Admin Dashboard</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Manage users, equipment, and platform settings.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'equipment', label: 'Equipment Management' },
            { key: 'users', label: 'User Management' },
            { key: 'rentals', label: 'Rental Management' },
            { key: 'analytics', label: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={analytics.totalUsers}
              subtitle={`${analytics.ownerCount} owners, ${analytics.renterCount} renters`}
              icon="👥"
              color="blue"
            />
            <StatCard
              title="Total Equipment"
              value={equipment.length}
              subtitle={`${analytics.pendingEquipment} pending approval`}
              icon="🔧"
              color="green"
            />
            <StatCard
              title="Active Rentals"
              value={analytics.activeRentals}
              subtitle="Currently ongoing"
              icon="📋"
              color="yellow"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(analytics.totalRevenue)}
              subtitle="All time"
              icon="💰"
              color="purple"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedTab('equipment')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium text-blue-600">Review Pending Equipment</div>
                <div className="text-sm text-gray-500">{analytics.pendingEquipment} items waiting</div>
              </button>
              <button
                onClick={() => setSelectedTab('users')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium text-blue-600">Manage Users</div>
                <div className="text-sm text-gray-500">{analytics.totalUsers} total users</div>
              </button>
              <button
                onClick={() => setSelectedTab('analytics')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium text-blue-600">View Analytics</div>
                <div className="text-sm text-gray-500">Platform insights</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'equipment' && (
        <div className="space-y-4">
          {/* Equipment Controls */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Search</label>
                <input
                  type="text"
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status Filter</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="name">Name</option>
                  <option value="ratePerDay">Rate per Day</option>
                  <option value="category">Category</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Equipment Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEquipment.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">ID: {item.id.substring(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.ownerName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'approved' ? 'bg-green-100 text-green-800' :
                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.ratePerDay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {item.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveEquipment(item.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectEquipment(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDeleteEquipment(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'users' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.fullName || user.displayName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role || 'renter'}
                        onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        <option value="renter">Renter</option>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'rentals' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Renter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rentals.map((rental) => (
                  <tr key={rental.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {rental.equipmentName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rental.renterName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rental.ownerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(rental.totalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rental.status === 'active' ? 'bg-green-100 text-green-800' :
                        rental.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        rental.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rental.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          {/* Revenue Analytics */}
          <div className="bg-white shadow rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Revenue by Category</h4>
            <div className="space-y-3">
              {Object.entries(analytics.revenueByCategory)
                .sort(([,a], [,b]) => b - a)
                .map(([category, revenue]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-200 rounded-full h-2 w-24">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{
                            width: `${(revenue / Math.max(...Object.values(analytics.revenueByCategory))) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold">{formatCurrency(revenue)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Platform Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">User Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Renters</span>
                  <span className="font-semibold">{analytics.renterCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Owners</span>
                  <span className="font-semibold">{analytics.ownerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Users</span>
                  <span className="font-semibold">{analytics.totalUsers}</span>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Equipment Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Approved</span>
                  <span className="font-semibold text-green-600">{analytics.approvedEquipment}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending</span>
                  <span className="font-semibold text-yellow-600">{analytics.pendingEquipment}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Equipment</span>
                  <span className="font-semibold">{equipment.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Statistics Card Component
function StatCard({ title, value, subtitle, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700'
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-md ${colorClasses[color]} flex items-center justify-center`}>
              <span className="text-xl">{icon}</span>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
              {subtitle && (
                <dd className="text-sm text-gray-600">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}