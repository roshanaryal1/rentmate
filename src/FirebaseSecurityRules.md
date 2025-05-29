# RentMate v1.2.0 Firebase Security Rules

This document provides the recommended Firebase security rules for RentMate v1.2.0. These rules enforce proper access control for different user roles (Renter, Owner, Admin) and ensure data security.

## Firestore Security Rules

Copy these rules to your Firebase console under Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    function isAdmin() {
      return hasRole('admin');
    }
    
    function isEquipmentOwner(equipmentId) {
      return isSignedIn() && 
        get(/databases/$(database)/documents/equipment/$(equipmentId)).data.ownerId == request.auth.uid;
    }
    
    function isRenter(rentalId) {
      return isSignedIn() &&
        get(/databases/$(database)/documents/rentals/$(rentalId)).data.renterId == request.auth.uid;
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own data
      // Only admins can read all user data
      allow read: if isOwner(userId) || isAdmin();
      
      // Users can create and update their own basic data
      // Only admins can change roles
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']) || isAdmin();
      
      // Only admins can delete users
      allow delete: if isAdmin();
    }
    
    // Equipment collection
    match /equipment/{equipmentId} {
      // Anyone signed in can read equipment
      allow read: if isSignedIn();
      
      // Only equipment owners or admins can create equipment
      allow create: if isSignedIn() && (
        request.resource.data.ownerId == request.auth.uid || isAdmin()
      );
      
      // Only equipment owners or admins can update equipment
      allow update: if isSignedIn() && (
        resource.data.ownerId == request.auth.uid || isAdmin()
      );
      
      // Only equipment owners or admins can delete equipment
      allow delete: if isSignedIn() && (
        resource.data.ownerId == request.auth.uid || isAdmin()
      );
    }
    
    // Rentals collection
    match /rentals/{rentalId} {
      // Equipment owners can read rentals for their equipment
      // Renters can read their own rentals
      // Admins can read all rentals
      allow read: if isSignedIn() && (
        resource.data.renterId == request.auth.uid ||
        resource.data.ownerId == request.auth.uid ||
        isAdmin()
      );
      
      // Anyone signed in can create a rental
      allow create: if isSignedIn() && request.resource.data.renterId == request.auth.uid;
      
      // Only the equipment owner, the renter, or an admin can update a rental
      allow update: if isSignedIn() && (
        resource.data.renterId == request.auth.uid ||
        resource.data.ownerId == request.auth.uid ||
        isAdmin()
      );
      
      // Only admins can delete rentals
      allow delete: if isAdmin();
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      // Anyone signed in can read reviews
      allow read: if isSignedIn();
      
      // Only the renter who completed the rental can create a review
      allow create: if isSignedIn() && 
        request.resource.data.renterId == request.auth.uid &&
        exists(/databases/$(database)/documents/rentals/$(request.resource.data.rentalId)) &&
        get(/databases/$(database)/documents/rentals/$(request.resource.data.rentalId)).data.renterId == request.auth.uid &&
        get(/databases/$(database)/documents/rentals/$(request.resource.data.rentalId)).data.status == 'completed';
      
      // Only the review author can update their review
      allow update: if isSignedIn() && resource.data.renterId == request.auth.uid;
      
      // Only the review author or an admin can delete a review
      allow delete: if isSignedIn() && (resource.data.renterId == request.auth.uid || isAdmin());
    }
    
    // Activity log collection - for admin-only usage
    match /activity/{activityId} {
      // Only admins can read all activity
      // Users can read their own activity
      allow read: if isSignedIn() && (
        resource.data.userId == request.auth.uid || isAdmin()
      );
      
      // System and users can create activity logs
      allow create: if isSignedIn();
      
      // No updates allowed to activity logs
      allow update: if false;
      
      // Only admins can delete activity logs
      allow delete: if isAdmin();
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      // Users can only read notifications intended for them
      allow read: if isSignedIn() && (
        resource.data.recipients.hasAny([request.auth.uid, 'all', request.auth.token.role]) || isAdmin()
      );
      
      // System and admins can create notifications
      allow create: if isSignedIn() && (
        request.resource.data.senderId == request.auth.uid || isAdmin()
      );
      
      // No one can update notifications
      allow update: if false;
      
      // Only admins can delete notifications
      allow delete: if isAdmin();
    }
  }
}
```

## Firebase Storage Rules

If you're using Firebase Storage for equipment images, use these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return request.auth.token.role == 'admin';
    }
    
    // Equipment images
    match /equipment/{equipmentId}/{fileName} {
      // Anyone can view equipment images
      allow read: if isSignedIn();
      
      // Only equipment owners or admins can upload/update images
      allow write: if isSignedIn() && (
        request.auth.uid == equipmentId.split('_')[0] || isAdmin()
      );
      
      // Only equipment owners or admins can delete images
      allow delete: if isSignedIn() && (
        request.auth.uid == equipmentId.split('_')[0] || isAdmin()
      );
    }
    
    // User profile images
    match /users/{userId}/{fileName} {
      // Anyone can view user profile images
      allow read: if isSignedIn();
      
      // Users can only upload/update their own profile images
      allow write: if isSignedIn() && request.auth.uid == userId;
      
      // Users can only delete their own profile images
      allow delete: if isSignedIn() && request.auth.uid == userId;
    }
    
    // Other files are admin-only
    match /{allPaths=**} {
      allow read: if isSignedIn();
      allow write, delete: if isAdmin();
    }
  }
}
```

## Firebase Authentication

Ensure you have these authentication providers enabled in your Firebase Authentication console:

1. Email/Password
2. Google
3. Anonymous (optional)

## Firebase Functions (Optional)

If you're using Cloud Functions, here are some recommended security configurations:

```javascript
// Secure HTTP functions with Firebase Auth
exports.secureFunction = functions.https.onCall((data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to use this feature.'
    );
  }
  
  // Check user roles for admin-only functions
  if (adminOnlyFunction && context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You must be an admin to use this feature.'
    );
  }
  
  // Function logic goes here
});
```

## Security Considerations

1. **User Roles**: Always verify user roles on the server-side, never trust client-side role claims.
2. **Data Validation**: Implement thorough data validation in your application code in addition to these security rules.
3. **Rate Limiting**: Consider implementing rate limiting for sensitive operations to prevent abuse.
4. **Regular Audits**: Regularly audit your security rules and access patterns.
5. **Least Privilege**: Follow the principle of least privilege - only grant the minimum permissions necessary.

## Testing Rules

You can test your security rules using the Firebase Rules Playground in the Firebase Console or using the Firebase Local Emulator Suite:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Initialize Firebase Emulators
firebase init emulators

# Start emulators
firebase emulators:start
```

## Updating Rules

To update your rules via the Firebase CLI:

```bash
# Save rules to a file
firebase firestore:rules > firestore.rules
firebase storage:rules > storage.rules

# After editing, deploy the updated rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

Always ensure your security rules are thoroughly tested before deploying to production. These rules are designed to work with RentMate v1.2.0's role-based access control system.