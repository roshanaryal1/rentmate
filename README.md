# RentMate - Equipment Rental Platform
[![Version](https://img.shields.io/badge/version-1.3.1-blue.svg)](https://github.com/roshanaryal1/rentmate/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.8.1-orange.svg)](https://firebase.google.com/)
[![Material-UI](https://img.shields.io/badge/Material--UI-7.1.0-blue.svg)](https://mui.com/)

RentMate is a modern, full-featured equipment rental platform that connects equipment owners with renters. Built with React and Firebase, it provides a seamless experience for listing, browsing, and managing equipment rentals with advanced features like QR code integration, enhanced analytics, and Material-UI components.

## 🌟 Features

### 🆕 **New in v1.3.0**
- **🔄 QR Code Integration**: Generate and scan QR codes for equipment tracking
- **📊 Enhanced Analytics**: Advanced Material-UI powered dashboards with better data visualization
- **📱 Improved Mobile Experience**: Better responsive design with Material-UI components
- **🎨 Modern UI/UX**: Upgraded to Material-UI 7.1.0 for better user experience
- **⚡ Performance Boost**: Optimized with React 19.1.0 and latest dependencies
- **🔧 Better Error Handling**: Enhanced error boundaries and user feedback

### For Equipment Renters
- **Browse Equipment**: Discover a wide variety of construction and industrial equipment
- **Advanced Search**: Filter by category, location, price, and availability
- **QR Code Scanning**: Quick equipment identification and details access
- **Rental Management**: Track current and past rentals with detailed history
- **User Dashboard**: Comprehensive analytics and rental insights
- **Secure Authentication**: Google OAuth and email/password login
- **Mobile Responsive**: Access RentMate seamlessly on any device
- **Real-time Notifications**: Get updates on rental status and approvals
- **Equipment Details Modal**: View detailed equipment information with enhanced UI

### For Equipment Owners
- **List Equipment**: Add your equipment with detailed descriptions and pricing
- **QR Code Generation**: Create QR codes for easy equipment identification
- **Inventory Management**: Track availability and rental status with visual analytics
- **Rental Approval System**: Review and approve rental requests
- **Earnings Dashboard**: Monitor rental income with advanced charts and projections
- **Equipment Analytics**: View equipment performance metrics with Material-UI components
- **Request Management**: Handle rental requests with improved workflow

### For Administrators
- **User Management**: Oversee user accounts and permissions with enhanced role editing
- **Equipment Approval**: Review and approve new equipment listings
- **Platform Analytics**: Monitor platform usage with comprehensive Material-UI charts
- **Content Moderation**: Ensure quality and safety standards
- **Advanced Dashboard**: Role-specific analytics with better data visualization
- **System Health Monitoring**: Track platform performance and user engagement

## 🚀 Live Demo

Visit the live application: [RentMate Platform](https://rentmate-c7360.web.app)

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher) - **Updated requirement for v1.3.0**
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
│   │   ├── Dashboard/      # Dashboard components with Material-UI
│   │   ├── Equipment/      # Equipment-related components
│   │   ├── Rental/         # Rental management components
│   │   ├── QRCode/         # QR code generation and scanning (NEW)
│   │   └── common/         # Shared components
│   ├── contexts/           # React contexts
│   ├── data/              # Sample data and constants
│   ├── pages/             # Page components
│   ├── services/          # API and service functions
│   ├── theme/             # Material-UI theme and styling
│   ├── utils/             # Utility functions (NEW)
│   ├── App.js             # Main application component
│   └── index.js           # Application entry point
├── package.json
└── README.md
```

## 🆕 New Features in v1.3.0

### QR Code Integration
- **Equipment QR Codes**: Each equipment item now has a unique QR code
- **Quick Scanning**: Scan QR codes to instantly access equipment details
- **Offline Access**: QR codes work even with limited connectivity

### Enhanced Analytics
- **Material-UI Charts**: Beautiful, interactive charts for better data visualization
- **Real-time Updates**: Live data updates with improved performance
- **Export Functionality**: Export reports and analytics data

### Improved User Experience
- **Material-UI Components**: Consistent, modern UI across all pages
- **Better Mobile Support**: Enhanced responsive design
- **Loading States**: Improved loading indicators and transitions

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
1. Deploy using built-in script:
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
- Use Material-UI components for consistency
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

### Version 1.4.0 (Planned)
- [ ] Equipment insurance integration
- [ ] Maintenance scheduling system
- [ ] Review and rating system
- [ ] Multi-language support (i18n)
- [ ] Payment integration (Stripe)
- [ ] Push notifications
- [ ] Advanced reporting features

## 📊 What's New in v1.3.0 (June 2025)

### 🚀 Major Features
- **Material-UI Upgrade**: Enhanced UI/UX with Material-UI 7.1.0
- **Advanced Analytics**: Better data visualization and insights
- **Performance Improvements**: Optimized with React 19.1.0
- **Enhanced Mobile Experience**: Better responsive design

### 🔧 Technical Improvements
- Upgraded to React 19.1.0 for better performance
- Added Material-UI 7.1.0 for consistent design system
- Implemented QR code generation and scanning
- Enhanced error handling and user feedback
- Improved component structure and maintainability
- Better accessibility compliance

### 🐛 Bug Fixes
- Fixed authentication persistence issues
- Improved mobile responsiveness
- Enhanced error message clarity
- Fixed chart rendering issues
- Improved form validation

For detailed changelog, see [CHANGELOG.md](CHANGELOG.md).

## 🏆 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [Firebase](https://firebase.google.com/) - Backend services
- [Material-UI](https://mui.com/) - React component library
- [React Router](https://reactrouter.com/) - Client-side routing
- [QRCode.React](https://github.com/zpao/qrcode.react) - QR code generation
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [date-fns](https://date-fns.org/) - Date utility library

---

**Made with ❤️ by ROSHAN, DHRUB, APKSHYA** | [GitHub](https://github.com/roshanaryal1/rentmate)