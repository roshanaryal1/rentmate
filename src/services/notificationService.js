// src/services/notificationService.js
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

export const notificationService = {
  // Create a new notification
  async createNotification({
    userId,
    type,
    title,
    message,
    data = {},
    priority = 'normal'
  }) {
    try {
      const notification = {
        userId,
        type,
        title,
        message,
        data,
        priority,
        read: false,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'notifications'), notification);
      console.log('✅ Notification created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  },

  // Send rental request notification to renter
  async sendRentalStatusNotification(rentalRequest, status, additionalData = {}) {
    try {
      let title, message, type;

      switch (status) {
        case 'approved':
          title = '🎉 Rental Request Approved!';
          message = `Great news! Your rental request for "${rentalRequest.equipmentName}" has been approved by the owner.`;
          type = 'rental_approved';
          break;
        case 'declined':
          title = '❌ Rental Request Declined';
          message = `Unfortunately, your rental request for "${rentalRequest.equipmentName}" has been declined.`;
          if (additionalData.reason) {
            message += ` Reason: ${additionalData.reason}`;
          }
          type = 'rental_declined';
          break;
        case 'completed':
          title = '✅ Rental Completed';
          message = `Your rental of "${rentalRequest.equipmentName}" has been completed. Please consider leaving a review!`;
          type = 'rental_completed';
          break;
        default:
          title = 'Rental Update';
          message = `There has been an update to your rental request for "${rentalRequest.equipmentName}".`;
          type = 'rental_update';
      }

      const notificationData = {
        equipmentId: rentalRequest.equipmentId,
        equipmentName: rentalRequest.equipmentName,
        rentalId: rentalRequest.id,
        ownerId: rentalRequest.ownerId,
        ownerName: rentalRequest.ownerName,
        status: status,
        ...additionalData
      };

      return await this.createNotification({
        userId: rentalRequest.renterId,
        type,
        title,
        message,
        data: notificationData,
        priority: status === 'approved' ? 'high' : 'normal'
      });
    } catch (error) {
      console.error('❌ Error sending rental status notification:', error);
      throw error;
    }
  },

  // Send notification to equipment owner about new rental request
  async sendNewRentalRequestNotification(rentalRequest, ownerId) {
    try {
      const title = '📋 New Rental Request';
      const message = `You have a new rental request for "${rentalRequest.equipmentName}" from ${rentalRequest.renterName}.`;
      
      const notificationData = {
        equipmentId: rentalRequest.equipmentId,
        equipmentName: rentalRequest.equipmentName,
        rentalId: rentalRequest.id,
        renterId: rentalRequest.renterId,
        renterName: rentalRequest.renterName,
        requestedDates: {
          start: rentalRequest.startDate,
          end: rentalRequest.endDate
        },
        totalPrice: rentalRequest.totalPrice
      };

      return await this.createNotification({
        userId: ownerId,
        type: 'new_rental_request',
        title,
        message,
        data: notificationData,
        priority: 'high'
      });
    } catch (error) {
      console.error('❌ Error sending new rental request notification:', error);
      throw error;
    }
  },

  // Get notifications for a user
  async getUserNotifications(userId, limitCount = 20, unreadOnly = false) {
    try {
      let notificationQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (unreadOnly) {
        notificationQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          where('read', '==', false),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(notificationQuery);
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return notifications;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return [];
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      const unreadQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(unreadQuery);
      const batch = [];

      snapshot.docs.forEach(doc => {
        batch.push(
          updateDoc(doc.ref, {
            read: true,
            readAt: serverTimestamp()
          })
        );
      });

      await Promise.all(batch);
      console.log(`✅ Marked ${batch.length} notifications as read for user:`, userId);
      return batch.length;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      const unreadQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(unreadQuery);
      return snapshot.size;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }
};

// React Hook for managing notifications
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = (autoRefresh = true, refreshInterval = 30000) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const [notifs, count] = await Promise.all([
        notificationService.getUserNotifications(currentUser.uid, 20),
        notificationService.getUnreadCount(currentUser.uid)
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true, readAt: new Date() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const markedCount = await notificationService.markAllAsRead(currentUser.uid);
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          read: true, 
          readAt: new Date() 
        }))
      );
      setUnreadCount(0);
      return markedCount;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchNotifications, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [currentUser, autoRefresh, refreshInterval]);

  return {
    notifications,
    unreadCount,
    loading,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead
  };
};