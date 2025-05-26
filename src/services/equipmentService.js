import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export const equipmentService = {
  // For Renters: Get equipment from OTHER owners only
  async getEquipmentForRenter(currentUserId) {
    try {
      console.log('🔍 Fetching equipment for renter, excluding userId:', currentUserId);
      
      // Get all approved equipment first, then filter out user's own equipment
      const equipmentQuery = query(
        collection(db, 'equipment'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(equipmentQuery);
      const allEquipment = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out user's own equipment
      const otherOwnersEquipment = allEquipment.filter(item => 
        item.ownerId !== currentUserId
      );
      
      console.log(`✅ Found ${otherOwnersEquipment.length} equipment items from other owners`);
      return otherOwnersEquipment;
    } catch (error) {
      console.error('❌ Error fetching equipment for renter:', error);
      return [];
    }
  },

  // For Owners: Get only THEIR equipment
  async getEquipmentForOwner(ownerId) {
    try {
      console.log('🔍 Fetching equipment for owner:', ownerId);
      
      const equipmentQuery = query(
        collection(db, 'equipment'),
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(equipmentQuery);
      const equipment = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ Found ${equipment.length} equipment items for owner`);
      return equipment;
    } catch (error) {
      console.error('❌ Error fetching equipment for owner:', error);
      return [];
    }
  },

  // For Admin: Get ALL equipment
  async getAllEquipment() {
    try {
      console.log('🔍 Fetching all equipment for admin');
      
      const equipmentQuery = query(
        collection(db, 'equipment'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(equipmentQuery);
      const equipment = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ Found ${equipment.length} total equipment items`);
      return equipment;
    } catch (error) {
      console.error('❌ Error fetching all equipment:', error);
      return [];
    }
  },

  // Get single equipment by ID
  async getEquipmentById(equipmentId) {
    try {
      const docRef = doc(db, 'equipment', equipmentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Equipment not found');
      }
    } catch (error) {
      console.error('❌ Error fetching equipment by ID:', error);
      throw error;
    }
  },

  // Add new equipment
  async addEquipment(equipmentData) {
    try {
      const docRef = await addDoc(collection(db, 'equipment'), {
        ...equipmentData,
        status: 'approved', // Auto-approve for now
        available: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Equipment added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding equipment:', error);
      throw error;
    }
  },

  // Update equipment
  async updateEquipment(equipmentId, updateData) {
    try {
      const docRef = doc(db, 'equipment', equipmentId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Equipment updated:', equipmentId);
    } catch (error) {
      console.error('❌ Error updating equipment:', error);
      throw error;
    }
  },

  // Delete equipment
  async deleteEquipment(equipmentId) {
    try {
      const docRef = doc(db, 'equipment', equipmentId);
      await deleteDoc(docRef);
      
      console.log('✅ Equipment deleted:', equipmentId);
    } catch (error) {
      console.error('❌ Error deleting equipment:', error);
      throw error;
    }
  },

  // Get equipment statistics
  async getEquipmentStats(ownerId = null) {
    try {
      let equipmentQuery;
      
      if (ownerId) {
        // Stats for specific owner
        equipmentQuery = query(
          collection(db, 'equipment'),
          where('ownerId', '==', ownerId)
        );
      } else {
        // Global stats
        equipmentQuery = query(collection(db, 'equipment'));
      }
      
      const snapshot = await getDocs(equipmentQuery);
      const equipment = snapshot.docs.map(doc => doc.data());
      
      const stats = {
        total: equipment.length,
        available: equipment.filter(item => item.available).length,
        unavailable: equipment.filter(item => !item.available).length,
        approved: equipment.filter(item => item.status === 'approved').length,
        pending: equipment.filter(item => item.status === 'pending').length,
        categories: {}
      };
      
      // Count by category
      equipment.forEach(item => {
        const category = item.category || 'Other';
        stats.categories[category] = (stats.categories[category] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('❌ Error fetching equipment stats:', error);
      return {
        total: 0,
        available: 0,
        unavailable: 0,
        approved: 0,
        pending: 0,
        categories: {}
      };
    }
  }
};