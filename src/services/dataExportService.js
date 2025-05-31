// src/services/dataExportService.js - Data export and import utilities

import { 
  collection, 
  getDocs, 
  addDoc,
  updateDoc,
  doc,
  query, 
  where,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { analyticsService } from './analyticsService';

class DataExportService {
  // CSV utilities
  convertToCSV(data, headers) {
    if (!data || !data.length) return '';

    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  downloadJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // User data export
  async exportUsers(format = 'csv', filters = {}) {
    try {
      let q = collection(db, 'users');

      if (filters.role) {
        q = query(q, where('role', '==', filters.role));
      }

      if (filters.banned !== undefined) {
        q = query(q, where('banned', '==', filters.banned));
      }

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          role: data.role || '',
          emailVerified: data.emailVerified || false,
          banned: data.banned || false,
          banReason: data.banReason || '',
          phone: data.phone || '',
          address: data.address || '',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || '',
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || ''
        };
      });

      const filename = `users_export_${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        const headers = [
          'id', 'email', 'displayName', 'role', 'emailVerified', 'banned', 
          'banReason', 'phone', 'address', 'createdAt', 'updatedAt'
        ];
        const csvContent = this.convertToCSV(users, headers);
        this.downloadCSV(csvContent, `${filename}.csv`);
      } else {
        this.downloadJSON(users, `${filename}.json`);
      }

      return {
        success: true,
        count: users.length,
        filename: `${filename}.${format}`
      };
    } catch (error) {
      console.error('Error exporting users:', error);
      throw error;
    }
  }

  // Equipment data export
  async exportEquipment(format = 'csv', filters = {}) {
    try {
      let q = collection(db, 'equipment');

      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters.approvalStatus) {
        q = query(q, where('approvalStatus', '==', filters.approvalStatus));
      }

      if (filters.available !== undefined) {
        q = query(q, where('available', '==', filters.available));
      }

      const snapshot = await getDocs(q);
      const equipment = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          ratePerDay: data.ratePerDay || 0,
          location: data.location || '',
          ownerId: data.ownerId || '',
          ownerName: data.ownerName || '',
          available: data.available || false,
          approvalStatus: data.approvalStatus || '',
          approvedAt: data.approvedAt?.toDate?.()?.toISOString() || '',
          rejectedAt: data.rejectedAt?.toDate?.()?.toISOString() || '',
          rejectionReason: data.rejectionReason || '',
          imageUrl: data.imageUrl || '',
          condition: data.condition || '',
          specifications: JSON.stringify(data.specifications || {}),
          createdAt: data.createdAt?.toDate?.()?.toISOString() || '',
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || ''
        };
      });

      const filename = `equipment_export_${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        const headers = [
          'id', 'name', 'description', 'category', 'ratePerDay', 'location',
          'ownerId', 'ownerName', 'available', 'approvalStatus', 'approvedAt',
          'rejectedAt', 'rejectionReason', 'imageUrl', 'condition', 'specifications',
          'createdAt', 'updatedAt'
        ];
        const csvContent = this.convertToCSV(equipment, headers);
        this.downloadCSV(csvContent, `${filename}.csv`);
      } else {
        this.downloadJSON(equipment, `${filename}.json`);
      }

      return {
        success: true,
        count: equipment.length,
        filename: `${filename}.${format}`
      };
    } catch (error) {
      console.error('Error exporting equipment:', error);
      throw error;
    }
  }

  // Rental data export
  async exportRentals(format = 'csv', filters = {}) {
    try {
      let q = collection(db, 'rentals');

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters.startDate && filters.endDate) {
        q = query(
          q,
          where('createdAt', '>=', filters.startDate),
          where('createdAt', '<=', filters.endDate)
        );
      }

      const snapshot = await getDocs(q);
      const rentals = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          equipmentId: data.equipmentId || '',
          equipmentName: data.equipmentName || '',
          equipmentCategory: data.equipmentCategory || '',
          renterId: data.renterId || '',
          renterName: data.renterName || '',
          renterEmail: data.renterEmail || '',
          ownerId: data.ownerId || '',
          ownerName: data.ownerName || '',
          ownerEmail: data.ownerEmail || '',
          startDate: data.startDate?.toDate?.()?.toISOString() || '',
          endDate: data.endDate?.toDate?.()?.toISOString() || '',
          totalCost: data.totalCost || 0,
          platformFee: data.platformFee || 0,
          status: data.status || '',
          paymentStatus: data.paymentStatus || '',
          paymentMethod: data.paymentMethod || '',
          notes: data.notes || '',
          rating: data.rating || 0,
          review: data.review || '',
          disputeReason: data.disputeReason || '',
          refundAmount: data.refundAmount || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || '',
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || '',
          completedAt: data.completedAt?.toDate?.()?.toISOString() || '',
          cancelledAt: data.cancelledAt?.toDate?.()?.toISOString() || ''
        };
      });

      const filename = `rentals_export_${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        const headers = [
          'id', 'equipmentId', 'equipmentName', 'equipmentCategory', 'renterId',
          'renterName', 'renterEmail', 'ownerId', 'ownerName', 'ownerEmail',
          'startDate', 'endDate', 'totalCost', 'platformFee', 'status',
          'paymentStatus', 'paymentMethod', 'notes', 'rating', 'review',
          'disputeReason', 'refundAmount', 'createdAt', 'updatedAt',
          'completedAt', 'cancelledAt'
        ];
        const csvContent = this.convertToCSV(rentals, headers);
        this.downloadCSV(csvContent, `${filename}.csv`);
      } else {
        this.downloadJSON(rentals, `${filename}.json`);
      }

      return {
        success: true,
        count: rentals.length,
        filename: `${filename}.${format}`
      };
    } catch (error) {
      console.error('Error exporting rentals:', error);
      throw error;
    }
  }

  // Analytics report export
  async exportAnalyticsReport(startDate, endDate, format = 'json') {
    try {
      const report = await analyticsService.generateComprehensiveReport(startDate, endDate);
      
      const filename = `analytics_report_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}`;

      if (format === 'csv') {
        // Create multiple CSV sheets for different data
        const summaryData = [
          {
            metric: 'Total Users',
            value: report.summary.users.total,
            change: report.summary.users.growth.percentage
          },
          {
            metric: 'Total Equipment',
            value: report.summary.equipment.total,
            change: report.summary.equipment.growth.percentage
          },
          {
            metric: 'Total Rentals',
            value: report.summary.rentals.total,
            change: report.summary.rentals.growth.percentage
          },
          {
            metric: 'Total Revenue',
            value: report.summary.rentals.revenue.total,
            change: report.summary.rentals.revenue.growth
          }
        ];

        const csvContent = this.convertToCSV(summaryData, ['metric', 'value', 'change']);
        this.downloadCSV(csvContent, `${filename}_summary.csv`);
      } else {
        this.downloadJSON(report, `${filename}.json`);
      }

      return {
        success: true,
        filename: `${filename}.${format}`,
        report
      };
    } catch (error) {
      console.error('Error exporting analytics report:', error);
      throw error;
    }
  }

  // Admin action logs export
  async exportAdminLogs(format = 'csv', limit = 1000) {
    try {
      const q = query(
        collection(db, 'adminActions'),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          action: data.action || '',
          adminId: data.adminId || '',
          targetUserId: data.targetUserId || '',
          targetUserEmail: data.targetUserEmail || '',
          targetEquipmentId: data.targetEquipmentId || '',
          targetEquipmentName: data.targetEquipmentName || '',
          targetRentalId: data.targetRentalId || '',
          reason: data.reason || '',
          oldRole: data.oldRole || '',
          newRole: data.newRole || '',
          duration: data.duration || '',
          timestamp: data.timestamp?.toDate?.()?.toISOString() || ''
        };
      });

      const filename = `admin_logs_export_${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        const headers = [
          'id', 'action', 'adminId', 'targetUserId', 'targetUserEmail',
          'targetEquipmentId', 'targetEquipmentName', 'targetRentalId',
          'reason', 'oldRole', 'newRole', 'duration', 'timestamp'
        ];
        const csvContent = this.convertToCSV(logs, headers);
        this.downloadCSV(csvContent, `${filename}.csv`);
      } else {
        this.downloadJSON(logs, `${filename}.json`);
      }

      return {
        success: true,
        count: logs.length,
        filename: `${filename}.${format}`
      };
    } catch (error) {
      console.error('Error exporting admin logs:', error);
      throw error;
    }
  }

  // Bulk import utilities
  parseCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return { headers: [], data: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return { headers, data };
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  // Bulk equipment import
  async importEquipment(csvText, options = {}) {
    try {
      const { headers, data } = this.parseCSV(csvText);
      
      // Validate required headers
      const requiredHeaders = ['name', 'category', 'ratePerDay', 'location', 'ownerId'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      const batch = writeBatch(db);
      const results = {
        success: 0,
        errors: [],
        total: data.length
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          // Validate data
          if (!row.name || !row.category || !row.ratePerDay || !row.location || !row.ownerId) {
            throw new Error('Missing required fields');
          }

          const equipmentData = {
            name: row.name,
            description: row.description || '',
            category: row.category,
            ratePerDay: parseFloat(row.ratePerDay) || 0,
            location: row.location,
            ownerId: row.ownerId,
            ownerName: row.ownerName || '',
            available: row.available !== 'false',
            approvalStatus: options.autoApprove ? 'approved' : 'pending',
            condition: row.condition || 'good',
            imageUrl: row.imageUrl || '',
            specifications: row.specifications ? JSON.parse(row.specifications) : {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          if (options.autoApprove) {
            equipmentData.approvedAt = serverTimestamp();
          }

          const docRef = doc(collection(db, 'equipment'));
          batch.set(docRef, equipmentData);
          results.success++;

        } catch (error) {
          results.errors.push({
            row: i + 1,
            data: row,
            error: error.message
          });
        }
      }

      await batch.commit();

      return results;
    } catch (error) {
      console.error('Error importing equipment:', error);
      throw error;
    }
  }

  // Bulk user role update
  async importUserRoleUpdates(csvText) {
    try {
      const { headers, data } = this.parseCSV(csvText);
      
      // Validate headers
      if (!headers.includes('userId') || !headers.includes('role')) {
        throw new Error('CSV must contain userId and role columns');
      }

      const batch = writeBatch(db);
      const results = {
        success: 0,
        errors: [],
        total: data.length
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          if (!row.userId || !row.role) {
            throw new Error('Missing userId or role');
          }

          if (!['renter', 'owner', 'admin'].includes(row.role)) {
            throw new Error(`Invalid role: ${row.role}`);
          }

          const userRef = doc(db, 'users', row.userId);
          batch.update(userRef, {
            role: row.role,
            updatedAt: serverTimestamp()
          });
          
          results.success++;

        } catch (error) {
          results.errors.push({
            row: i + 1,
            data: row,
            error: error.message
          });
        }
      }

      await batch.commit();

      return results;
    } catch (error) {
      console.error('Error importing user role updates:', error);
      throw error;
    }
  }

  // Platform settings backup/restore
  async exportPlatformSettings() {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'platform'));
      const settings = settingsDoc.exists() ? settingsDoc.data() : {};

      const filename = `platform_settings_backup_${new Date().toISOString().split('T')[0]}.json`;
      this.downloadJSON(settings, filename);

      return {
        success: true,
        filename,
        settings
      };
    } catch (error) {
      console.error('Error exporting platform settings:', error);
      throw error;
    }
  }

  async importPlatformSettings(settingsData) {
    try {
      // Remove timestamps and system fields
      const cleanedSettings = { ...settingsData };
      delete cleanedSettings.createdAt;
      delete cleanedSettings.updatedAt;

      await updateDoc(doc(db, 'settings', 'platform'), {
        ...cleanedSettings,
        updatedAt: serverTimestamp(),
        importedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error importing platform settings:', error);
      throw error;
    }
  }

  // Generate sample CSV templates
  generateUserTemplate() {
    const headers = ['email', 'displayName', 'role', 'phone', 'address'];
    const sampleData = [
      {
        email: 'john.doe@example.com',
        displayName: 'John Doe',
        role: 'renter',
        phone: '+1234567890',
        address: '123 Main St, City, State'
      }
    ];

    const csvContent = this.convertToCSV(sampleData, headers);
    this.downloadCSV(csvContent, 'user_import_template.csv');
  }

  generateEquipmentTemplate() {
    const headers = [
      'name', 'description', 'category', 'ratePerDay', 'location', 
      'ownerId', 'ownerName', 'condition', 'imageUrl'
    ];
    const sampleData = [
      {
        name: 'Sample Drill',
        description: 'High-quality electric drill',
        category: 'Tools',
        ratePerDay: '25.00',
        location: 'New York, NY',
        ownerId: 'owner123',
        ownerName: 'Equipment Owner',
        condition: 'excellent',
        imageUrl: 'https://example.com/drill.jpg'
      }
    ];

    const csvContent = this.convertToCSV(sampleData, headers);
    this.downloadCSV(csvContent, 'equipment_import_template.csv');
  }
}

export const dataExportService = new DataExportService();