// AdminDashboardWithFirebase.js
import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '../../theme/ThemeContext';
import AdminDashboard from './AdminDashboard';
import { 
  RentalStatisticsChart, 
  EquipmentDistributionChart, 
  RevenueChart 
} from './DashboardCharts';
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
import { db } from '../../firebase'; // Your existing Firebase config

const AdminDashboardWithFirebase = () => {
  // State for all dashboard data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    equipment: {
      total: 0,
      available: 0,
      pending: 0,
      approved: 0
    },
    rentals: {
      active: 0,
      inactive: 0,
      total: 0,
      revenue: 0
    },
    users: {
      total: 0,
      owners: 0,
      renters: 0
    },
    recentActivity: []
  });
  
  // Get equipment statistics
  const fetchEquipmentStats = async () => {
    try {
      // Get total equipment count
      const equipmentQuery = collection(db, 'equipment');
      const equipmentSnapshot = await getDocs(equipmentQuery);
      const totalEquipment = equipmentSnapshot.size;
      
      // Get available equipment count
      const availableQuery = query(
        collection(db, 'equipment'),
        where('available', '==', true)
      );
      const availableSnapshot = await getDocs(availableQuery);
      const availableEquipment = availableSnapshot.size;
      
      // Get pending equipment count
      const pendingQuery = query(
        collection(db, 'equipment'),
        where('status', '==', 'pending')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingEquipment = pendingSnapshot.size;
      
      // Get approved equipment count
      const approvedQuery = query(
        collection(db, 'equipment'),
        where('status', '==', 'approved')
      );
      const approvedSnapshot = await getDocs(approvedQuery);
      const approvedEquipment = approvedSnapshot.size;
      
      return {
        total: totalEquipment,
        available: availableEquipment,
        pending: pendingEquipment,
        approved: approvedEquipment
      };
    } catch (error) {
      console.error('Error fetching equipment stats:', error);
      throw error;
    }
  };
  
  // Get rental statistics
  const fetchRentalStats = async () => {
    try {
      // Get total rentals count
      const rentalsQuery = collection(db, 'rentals');
      const rentalsSnapshot = await getDocs(rentalsQuery);
      const totalRentals = rentalsSnapshot.size;
      
      // Get active rentals count
      const activeQuery = query(
        collection(db, 'rentals'),
        where('status', '==', 'active')
      );
      const activeSnapshot = await getDocs(activeQuery);
      const activeRentals = activeSnapshot.size;
      
      // Calculate total revenue
      let totalRevenue = 0;
      rentalsSnapshot.forEach(doc => {
        const rental = doc.data();
        if (rental.totalPrice) {
          totalRevenue += rental.totalPrice;
        }
      });
      
      return {
        total: totalRentals,
        active: activeRentals,
        inactive: totalRentals - activeRentals,
        revenue: totalRevenue
      };
    } catch (error) {
      console.error('Error fetching rental stats:', error);
      throw error;
    }
  };
  
  // Get user statistics
  const fetchUserStats = async () => {
    try {
      // Get total users count
      const usersQuery = collection(db, 'users');
      const usersSnapshot = await getDocs(usersQuery);
      const totalUsers = usersSnapshot.size;
      
      // Get owners count
      const ownersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'owner')
      );
      const ownersSnapshot = await getDocs(ownersQuery);
      const ownerUsers = ownersSnapshot.size;
      
      // Get renters count
      const rentersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'renter')
      );
      const rentersSnapshot = await getDocs(rentersQuery);
      const renterUsers = rentersSnapshot.size;
      
      return {
        total: totalUsers,
        owners: ownerUsers,
        renters: renterUsers
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  };
  
  // Get recent activity
  const fetchRecentActivity = async () => {
    try {
      // Recent rentals
      const recentRentalsQuery = query(
        collection(db, 'rentals'),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const recentRentalsSnapshot = await getDocs(recentRentalsQuery);
      
      // Recent equipment listings
      const recentEquipmentQuery = query(
        collection(db, 'equipment'),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const recentEquipmentSnapshot = await getDocs(recentEquipmentQuery);
      
      // Combine and format activities
      const activities = [];
      
      // Process rentals
      for (const rentalDoc of recentRentalsSnapshot.docs) {
        const rental = rentalDoc.data();
        
        // Get renter info
        let renterName = 'Unknown User';
        if (rental.renterId) {
          const renterDoc = await getDoc(doc(db, 'users', rental.renterId));
          if (renterDoc.exists()) {
            const renterData = renterDoc.data();
            renterName = renterData.displayName || renterData.email || 'Unknown User';
          }
        }
        
        // Get equipment info
        let equipmentName = 'Unknown Equipment';
        if (rental.equipmentId) {
          const equipmentDoc = await getDoc(doc(db, 'equipment', rental.equipmentId));
          if (equipmentDoc.exists()) {
            const equipmentData = equipmentDoc.data();
            equipmentName = equipmentData.name || 'Unknown Equipment';
          }
        }
        
        activities.push({
          id: rentalDoc.id,
          type: 'rental',
          text: `${renterName} rented ${equipmentName}`,
          date: rental.createdAt ? rental.createdAt.toDate() : new Date(),
          status: rental.status || 'unknown'
        });
      }
      
      // Process equipment listings
      for (const equipmentDoc of recentEquipmentSnapshot.docs) {
        const equipment = equipmentDoc.data();
        
        // Get owner info
        let ownerName = 'Unknown User';
        if (equipment.ownerId) {
          const ownerDoc = await getDoc(doc(db, 'users', equipment.ownerId));
          if (ownerDoc.exists()) {
            const ownerData = ownerDoc.data();
            ownerName = ownerData.displayName || ownerData.email || 'Unknown User';
          }
        }
        
        activities.push({
          id: equipmentDoc.id,
          type: 'equipment',
          text: `${ownerName} listed ${equipment.name || 'new equipment'}`,
          date: equipment.createdAt ? equipment.createdAt.toDate() : new Date(),
          status: equipment.status || 'unknown'
        });
      }
      
      // Sort all activities by date
      activities.sort((a, b) => b.date - a.date);
      
      // Limit to 5 most recent
      return activities.slice(0, 5);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  };
  
  // Get rental data for charts
  const fetchRentalChartData = async () => {
    try {
      // Get rentals for the last 6 months
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const rentalsQuery = query(
        collection(db, 'rentals'),
        orderBy('createdAt', 'asc')
      );
      
      const rentalsSnapshot = await getDocs(rentalsQuery);
      const rentals = rentalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Group by month
      const months = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.unshift({
          date: d,
          name: d.toLocaleString('default', { month: 'short' }),
          active: 0,
          inactive: 0,
          pending: 0,
          revenue: 0
        });
      }
      
      // Calculate stats for each month
      rentals.forEach(rental => {
        if (!rental.createdAt) return;
        
        const rentalDate = rental.createdAt.toDate();
        const monthIndex = months.findIndex(m => 
          m.date.getMonth() === rentalDate.getMonth() && 
          m.date.getFullYear() === rentalDate.getFullYear()
        );
        
        if (monthIndex >= 0) {
          if (rental.status === 'active') {
            months[monthIndex].active++;
          } else if (rental.status === 'inactive') {
            months[monthIndex].inactive++;
          } else if (rental.status === 'pending') {
            months[monthIndex].pending++;
          }
          
          if (rental.totalPrice) {
            months[monthIndex].revenue += rental.totalPrice;
          }
        }
      });
      
      return months;
    } catch (error) {
      console.error('Error fetching rental chart data:', error);
      throw error;
    }
  };
  
  // Get equipment distribution data
  const fetchEquipmentDistribution = async () => {
    try {
      const equipmentQuery = collection(db, 'equipment');
      const equipmentSnapshot = await getDocs(equipmentQuery);
      const equipment = equipmentSnapshot.docs.map(doc => doc.data());
      
      // Group by category
      const categoryMap = {};
      equipment.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!categoryMap[category]) {
          categoryMap[category] = 0;
        }
        categoryMap[category]++;
      });
      
      // Convert to array for chart
      const distribution = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value
      }));
      
      // Sort by highest count
      distribution.sort((a, b) => b.value - a.value);
      
      return distribution;
    } catch (error) {
      console.error('Error fetching equipment distribution:', error);
      throw error;
    }
  };
  
  // Load all dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Parallel data fetching
        const [
          equipmentStats,
          rentalStats,
          userStats,
          recentActivity,
          rentalChartData,
          equipmentDistribution
        ] = await Promise.all([
          fetchEquipmentStats(),
          fetchRentalStats(),
          fetchUserStats(),
          fetchRecentActivity(),
          fetchRentalChartData(),
          fetchEquipmentDistribution()
        ]);
        
        // Update state with all data
        setDashboardData({
          equipment: equipmentStats,
          rentals: rentalStats,
          users: userStats,
          recentActivity,
          rentalChartData,
          equipmentDistribution
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);
  
  return (
    <ThemeProvider>
      <AdminDashboard 
        loading={loading} 
        error={error}
        analytics={{
          totalEquipment: dashboardData.equipment.total,
          availableEquipment: dashboardData.equipment.available,
          pendingEquipment: dashboardData.equipment.pending,
          approvedEquipment: dashboardData.equipment.approved,
          activeRentals: dashboardData.rentals.active,
          totalRevenue: dashboardData.rentals.revenue
        }}
        recentActivity={dashboardData.recentActivity?.map(activity => ({
          text: activity.text,
          time: activity.date ? formatTimeAgo(activity.date) : 'recently',
          type: activity.type === 'rental' ? 'approval' : 
                activity.type === 'equipment' ? 'property' : 'document'
        }))}
      />
      
      {!loading && !error && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 48px' }}>
          <RentalStatisticsChart data={dashboardData.rentalChartData} />
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '24px',
            marginTop: '24px'
          }}>
            <EquipmentDistributionChart data={dashboardData.equipmentDistribution} />
            <RevenueChart data={dashboardData.rentalChartData} />
          </div>
        </div>
      )}
    </ThemeProvider>
  );
};

// Helper function to format date as "time ago"
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + ' years ago';
  }
  
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' months ago';
  }
  
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' days ago';
  }
  
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hours ago';
  }
  
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' minutes ago';
  }
  
  return 'just now';
}

export default AdminDashboardWithFirebase;
