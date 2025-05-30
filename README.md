# RentMate - Equipment Rental Platform

[![Version](https://img.shields.io/badge/version-1.2.1-blue.svg)](https://github.com/roshanaryal1/rentmate/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.8.1-orange.svg)](https://firebase.google.com/)

RentMate is a modern, full-featured equipment rental platform that connects equipment owners with renters. Built with React and Firebase, it provides a seamless experience for listing, browsing, and renting construction and industrial equipment.

## 🌟 Features

### For Equipment Renters
- **Browse Equipment**: Discover a wide variety of construction and industrial equipment
- **Advanced Search**: Filter by category, location, price, and availability
- **Rental Management**: Track current and past rentals with detailed history
- **User Dashboard**: Manage your rental history and preferences
- **Secure Authentication**: Google OAuth and email/password login
- **Mobile Responsive**: Access RentMate seamlessly on any device
- **Real-time Notifications**: Get updates on rental status and approvals
- **Equipment Details Modal**: View detailed equipment information before renting

### For Equipment Owners
- **List Equipment**: Add your equipment with detailed descriptions and pricing
- **Inventory Management**: Track availability and rental status
- **Rental Approval System**: Review and approve rental requests
- **Earnings Dashboard**: Monitor rental income and performance
- **Equipment Analytics**: View equipment performance metrics
- **Request Management**: Handle rental requests with approval/decline workflow

### For Administrators
- **User Management**: Oversee user accounts and permissions with role editing
- **Equipment Approval**: Review and approve new equipment listings
- **Platform Analytics**: Monitor platform usage with comprehensive charts
- **Content Moderation**: Ensure quality and safety standards
- **Advanced Dashboard**: Role-specific analytics and insights

## 🚀 Live Demo

Visit the live application: [RentMate Platform](https://rentmate-c7360.web.app)

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase account with Firestore and Authentication enabled
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/roshanaryal1/rentmate.git
   cd rentmate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Enable Firebase Hosting (optional)
   - Copy your Firebase configuration

4. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

```
rentmate/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── Dashboard/      # Dashboard components
│   │   ├── Equipment/      # Equipment-related components
│   │   ├── Rental/         # Rental management components
│   │   └── common/         # Shared components
│   ├── contexts/           # React contexts
│   ├── data/              # Sample data and constants
│   ├── pages/             # Page components
│   ├── services/          # API and service functions
│   ├── theme/             # Theme and styling
│   ├── App.js             # Main application component
│   └── index.js           # Application entry point
├── package.json
└── README.md
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## 🚀 Deployment

### Firebase Hosting
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize hosting:
   ```bash
   firebase init hosting
   ```

4. Deploy:
   ```bash
   npm run build
   firebase deploy
   ```

### GitHub Pages
1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

## 🔧 Configuration

### Firebase Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /equipment/{equipmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource.data.ownerId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    match /rentals/{rentalId} {
      allow read, write: if request.auth != null && (
        resource.data.renterId == request.auth.uid ||
        resource.data.ownerId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
  }
}
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow React best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/roshanaryal1/rentmate/issues) page
2. Create a new issue if your problem isn't already reported
3. Contact us at support@rentmate.com

## 🗺️ Roadmap

### Version 1.3.0 (Future)
- [ ] Equipment insurance integration
- [ ] Maintenance scheduling
- [ ] Review and rating system
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] Mobile app development

## 📊 What's New in v1.2.1 (January 2025)

### 🐛 Bug Fixes
- **Fixed authentication flow**: Resolved issues with user role assignment and persistent login
- **Improved rental request system**: Fixed approval/decline workflow for equipment owners
- **Enhanced error handling**: Better error messages and fallback states
- **UI/UX improvements**: Fixed responsive design issues on mobile devices
- **Performance optimizations**: Reduced bundle size and improved loading times

### 🔧 Improvements
- **Better notification system**: Enhanced real-time notifications for rental updates
- **Equipment detail modal**: Improved equipment viewing experience
- **Admin dashboard**: Enhanced user management with role editing capabilities
- **Search functionality**: Improved equipment search with better filtering
- **Form validation**: Enhanced validation across all forms

### 💻 Technical Updates
- Updated Firebase SDK integration
- Improved component error boundaries
- Enhanced TypeScript support preparation
- Better code splitting for performance
- Optimized Firebase security rules

For previous version details, see our [CHANGELOG](CHANGELOG.md).

## 🏆 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [Firebase](https://firebase.google.com/) - Backend services
- [Bootstrap](https://getbootstrap.com/) - CSS framework
- [React Router](https://reactrouter.com/) - Client-side routing
- [Bootstrap Icons](https://icons.getbootstrap.com/) - Icon library
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [date-fns](https://date-fns.org/) - Date utility library

---

**Made with ❤️ by ROSHAN, DHRUB, APKSHYA** | [GitHub](https://github.com/roshanaryal1/rentmate)