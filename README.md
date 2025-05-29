# RentMate - Equipment Rental Platform

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/roshanaryal1/rentmate/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-9.23.0-orange.svg)](https://firebase.google.com/)

RentMate is a modern, full-featured equipment rental platform that connects equipment owners with renters. Built with React and Firebase, it provides a seamless experience for listing, browsing, and renting construction and industrial equipment.

## 🌟 Features

### For Equipment Renters
- **Browse Equipment**: Discover a wide variety of construction and industrial equipment
- **Advanced Search**: Filter by category, location, price, and availability
- **Rental Management**: Track current and past rentals
- **User Dashboard**: Manage your rental history and preferences
- **Secure Authentication**: Google OAuth and email/password login
- **Mobile App**: Access RentMate on the go with our mobile application
- **Real-time Chat**: Communicate directly with equipment owners
- **Secure Payments**: Process rentals with integrated payment system

### For Equipment Owners
- **List Equipment**: Add your equipment with detailed descriptions and pricing
- **Inventory Management**: Track availability and rental status
- **Earnings Dashboard**: Monitor rental income and performance
- **Rental History**: View all past and current rentals
- **Equipment Tracking**: Monitor location of your equipment with GPS
- **Analytics Dashboard**: Gain insights into your rental business

### For Administrators
- **User Management**: Oversee user accounts and permissions
- **Equipment Approval**: Review and approve new equipment listings
- **Platform Analytics**: Monitor platform usage and performance
- **Content Moderation**: Ensure quality and safety standards

## 🚀 Live Demo

Visit the live application: [RentMate Demo](https://roshanaryal1.github.io/rentmate)

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase account
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
   - Copy your Firebase configuration

4. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   apiKey: "AIzaSyBcxPcu_CZtwWhhbBgFiJkRmgtcRW3FQs4",
  authDomain: "rentmate-c7360.firebaseapp.com",
  projectId: "rentmate-c7360",
  storageBucket: "rentmate-c7360.firebasestorage.app",
  messagingSenderId: "184718582938",
  appId: "1:184718582938:web:7990263a98ec92526aeb23",
  measurementId: "G-8W0V0Y8MJX"
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

### GitHub Pages
1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

### Firebase Hosting
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize hosting:
   ```bash
   firebase init hosting
   ```

3. Deploy:
   ```bash
   npm run build
   firebase deploy
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

### Version 1.2 (Future)
- [ ] Multi-language support
- [ ] Equipment insurance integration
- [ ] Maintenance scheduling
- [ ] Review and rating system

## 📊 Stats

- **Total Equipment Categories**: 15+
- **Sample Equipment Items**: 50+
- **User Roles**: 3 (Renter, Owner, Admin)
- **Supported Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Platforms**: Android, iOS

## 🏆 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [Firebase](https://firebase.google.com/) - Backend services
- [Bootstrap](https://getbootstrap.com/) - CSS framework
- [React Router](https://reactrouter.com/) - Client-side routing
- [Bootstrap Icons](https://icons.getbootstrap.com/) - Icon library
- [Stripe](https://stripe.com/) - Payment processing

---

**Made with ❤️ by ROSHAN, DHRUB, APKSHYA (https://github.com/roshanaryal1)**