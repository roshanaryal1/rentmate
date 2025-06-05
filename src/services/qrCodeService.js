// src/services/qrCodeService.js
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const qrCodeService = {
  // Generate QR data for equipment
  generateEquipmentQR: async (equipmentId, ownerId) => {
    try {
      const qrData = {
        type: 'equipment',
        equipmentId,
        ownerId,
        createdAt: serverTimestamp(),
        actions: ['view_details', 'request_rental', 'report_issue']
      };

      const qrRef = await addDoc(collection(db, 'qrCodes'), qrData);
      
      // Update equipment with QR code ID
      await updateDoc(doc(db, 'equipment', equipmentId), {
        qrCodeId: qrRef.id,
        qrCodeUrl: `${window.location.origin}/qr/${qrRef.id}`,
        updatedAt: serverTimestamp()
      });

      return {
        qrId: qrRef.id,
        qrUrl: `${window.location.origin}/qr/${qrRef.id}`,
        qrData: JSON.stringify(qrData)
      };
    } catch (error) {
      console.error('Error generating equipment QR:', error);
      throw error;
    }
  },

  // Generate QR for rental check-in/out
  generateRentalQR: async (rentalId, type = 'checkin') => {
    try {
      const qrData = {
        type: 'rental',
        rentalId,
        action: type, // 'checkin' or 'checkout'
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      const qrRef = await addDoc(collection(db, 'qrCodes'), qrData);
      
      return {
        qrId: qrRef.id,
        qrUrl: `${window.location.origin}/qr/${qrRef.id}`,
        qrData: JSON.stringify(qrData)
      };
    } catch (error) {
      console.error('Error generating rental QR:', error);
      throw error;
    }
  },

  // Generate QR for admin invitation
  generateAdminInviteQR: async (inviterId, inviteCode) => {
    try {
      const qrData = {
        type: 'admin_invite',
        inviterId,
        inviteCode,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      const qrRef = await addDoc(collection(db, 'qrCodes'), qrData);
      
      return {
        qrId: qrRef.id,
        qrUrl: `${window.location.origin}/qr/${qrRef.id}`,
        qrData: JSON.stringify(qrData)
      };
    } catch (error) {
      console.error('Error generating admin invite QR:', error);
      throw error;
    }
  },

  // Generate QR for feedback/rewards
  generateFeedbackQR: async (rentalId, rewardPoints = 0) => {
    try {
      const qrData = {
        type: 'feedback',
        rentalId,
        rewardPoints,
        createdAt: serverTimestamp(),
        actions: ['leave_review', 'claim_rewards']
      };

      const qrRef = await addDoc(collection(db, 'qrCodes'), qrData);
      
      return {
        qrId: qrRef.id,
        qrUrl: `${window.location.origin}/qr/${qrRef.id}`,
        qrData: JSON.stringify(qrData)
      };
    } catch (error) {
      console.error('Error generating feedback QR:', error);
      throw error;
    }
  },

  // Process scanned QR code
  processScannedQR: async (qrId) => {
    try {
      const qrDoc = await getDoc(doc(db, 'qrCodes', qrId));
      
      if (!qrDoc.exists()) {
        throw new Error('QR code not found');
      }

      const qrData = qrDoc.data();
      
      // Check if QR code has expired
      if (qrData.expiresAt && qrData.expiresAt.toDate() < new Date()) {
        throw new Error('QR code has expired');
      }

      return {
        id: qrDoc.id,
        ...qrData
      };
    } catch (error) {
      console.error('Error processing scanned QR:', error);
      throw error;
    }
  },

  // Get QR codes for equipment
  getEquipmentQRCodes: async (ownerId) => {
    try {
      const q = query(
        collection(db, 'qrCodes'),
        where('type', '==', 'equipment'),
        where('ownerId', '==', ownerId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting equipment QR codes:', error);
      throw error;
    }
  },

  // Update QR code usage stats
  updateQRUsage: async (qrId, action) => {
    try {
      const qrRef = doc(db, 'qrCodes', qrId);
      const qrDoc = await getDoc(qrRef);
      
      if (qrDoc.exists()) {
        const currentData = qrDoc.data();
        const usageCount = (currentData.usageCount || 0) + 1;
        const lastUsed = serverTimestamp();
        
        await updateDoc(qrRef, {
          usageCount,
          lastUsed,
          lastAction: action
        });
      }
    } catch (error) {
      console.error('Error updating QR usage:', error);
      // Don't throw error as this is analytics only
    }
  }
};