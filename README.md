# 🍔 FoodHub - Full-Stack Food Delivery Platform

A production-ready, enterprise-grade food delivery application similar to Zomato, featuring a React Native mobile app and React web application with secure OTP-based authentication.

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

---

## 📱 Features

### Mobile App (Customer)
- 🎨 **Splash Screen** with Zomato-style animation
- 📞 **OTP Authentication** via phone number (AuthKey integration)
- 🍽️ **Browse Restaurants** with search & filters
- 🛒 **Cart Management** with restaurant validation
- 💳 **Secure Checkout** with address management
- 📦 **Real-time Order Tracking** via WebSocket
- 📜 **Order History** with detailed tracking
- 👤 **Profile Management**

### Web App (Full Platform)
- 👥 **Multi-role Support**: Customer, Restaurant Owner, Delivery Partner, Admin
- 📊 **Restaurant Dashboard** for owners
- 🚚 **Delivery Dashboard** for partners
- 👑 **Admin Dashboard** for platform management
- 📧 **Email/Password Authentication**
- All customer features from mobile app

---

## 🏗️ Tech Stack

### Mobile App
- **Framework:** React Native (Expo ~50.0.0)
- **UI:** React Native Paper, Material Icons
- **Navigation:** React Navigation v6
- **State:** Context API (Auth + Cart)
- **Networking:** Axios, Socket.io Client
- **Storage:** AsyncStorage

### Web App
- **Framework:** React 18
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Routing:** React Router v6
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js v20+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis (ioredis)
- **Real-time:** Socket.io
- **Authentication:** JWT (Access + Refresh Tokens)
- **OTP Service:** AuthKey API
- **Payment:** Razorpay
- **Security:** Helmet, CORS, Rate Limiting

---

## 📂 Project Structure

```
foodhub/
├── mobile/                 # React Native Mobile App
│   ├── src/
│   │   ├── screens/       # App screens (9 screens)
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # Auth & Cart contexts
│   │   ├── navigation/    # Navigation setup
│   │   ├── services/      # API service
│   │   └── utils/         # Theme & constants
│   ├── App.js
│   └── package.json
│
├── frontend/              # React Web App
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # UI components
│   │   ├── contexts/     # Global state
│   │   └── utils/        # Utilities
│   └── package.json
│
├── backend/               # Node.js Backend
│   ├── config/           # Configuration (DB, Redis)
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Auth, validation, rate limiting
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── services/         # Business logic (Token, OTP)
│   ├── utils/            # Helper functions
│   └── server.js
│
├── CODE_QUALITY_FIXES.md # Security & code quality guide
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- MongoDB ([Install Guide](https://docs.mongodb.com/manual/installation/))
- Redis ([Install Guide](https://redis.io/docs/getting-started/))
- Expo CLI: `npm install -g expo-cli`

### 1. Clone Repository
```bash
git clone https://github.com/hlobaby111/Foodhub.git
cd Foodhub
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your credentials
```

**Required Environment Variables:**
```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=food_delivery

# JWT Secrets
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AuthKey (OTP Service)
AUTHKEY_API_KEY=your-authkey-api-key
AUTHKEY_TEMPLATE_ID=your-template-id

# Razorpay (Payment)
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Server
PORT=8001
NODE_ENV=development
```

**Start Backend:**
```bash
node server.js
# Server runs on http://localhost:8001
```

### 3. Mobile App Setup

```bash
cd mobile
npm install

# Update .env with backend URL
echo "BACKEND_URL=http://localhost:8001" > .env
```

**Run Mobile App:**
```bash
npm start
# Scan QR code with Expo Go app
```

**For Device-Specific URLs:**
- **Android Emulator:** `BACKEND_URL=http://10.0.2.2:8001`
- **iOS Simulator:** `BACKEND_URL=http://localhost:8001`
- **Physical Device:** `BACKEND_URL=http://YOUR_COMPUTER_IP:8001`

### 4. Web App Setup

```bash
cd frontend
npm install

# Create .env
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Start web app
npm start
# Opens on http://localhost:3000
```

---

## 🔐 Authentication

### Mobile App (OTP-based)
1. Enter 10-digit phone number
2. Receive OTP via SMS (AuthKey)
3. Verify OTP (auto-login/signup)
4. Access tokens (15min) + Refresh tokens (7 days)

**Test Mode:** In development, OTP is logged to console

### Web App (Email/Password)
- Traditional login with email/password
- Supports httpOnly cookies (secure)
- Token refresh on expiry

---

## 🧪 Testing

### Test Credentials
```
Customer Account:
Email: customer@test.com
Password: customer123

Restaurant Owner:
Email: owner@test.com
Password: owner123

Delivery Partner:
Email: delivery@test.com
Password: delivery123

Admin:
Email: admin@foodhub.com
Password: Admin@123
```

### Test Phone (Development)
Any 10-digit number starting with 6-9 (Indian format)

---

## 📡 API Endpoints

### Authentication
- `POST /api/otp-auth/send-otp` - Send OTP
- `POST /api/otp-auth/verify-otp` - Verify OTP & login
- `POST /api/otp-auth/refresh-token` - Refresh access token
- `POST /api/otp-auth/logout` - Logout
- `GET /api/otp-auth/me` - Get current user

### Restaurants
- `GET /api/restaurants` - List restaurants
- `GET /api/restaurants/:id` - Get restaurant details
- `POST /api/restaurants` - Create restaurant (owner)

### Orders
- `POST /api/orders` - Place order
- `GET /api/orders/my` - My orders
- `GET /api/orders/:id` - Order details
- `PUT /api/orders/:id/cancel` - Cancel order

### Menu
- `GET /api/menu?restaurantId=:id` - Get menu

**Full API Documentation:** 32+ endpoints

---

## 🔒 Security Features

- ✅ **JWT Authentication** with access & refresh tokens
- ✅ **Token Rotation** on refresh
- ✅ **httpOnly Cookies** (web app)
- ✅ **Redis-based** token blacklisting
- ✅ **Rate Limiting** (API, Auth, OTP)
- ✅ **Input Validation** (express-validator)
- ✅ **Security Headers** (Helmet.js)
- ✅ **CORS** configuration
- ✅ **Password Hashing** (bcrypt)
- ✅ **OTP Expiry** (5 minutes)
- ✅ **Failed Attempt Blocking** (5 attempts/hour)

---

## 📱 Mobile App Screenshots

| Splash | Phone Input | OTP | Home |
|--------|-------------|-----|------|
| 🍔 Animated Logo | 📱 Enter Number | 🔢 Verify OTP | 🍽️ Browse |

| Restaurant | Cart | Checkout | Tracking |
|------------|------|----------|----------|
| 🍱 Menu | 🛒 Items | 💳 Payment | 📦 Live Status |

---

## 🌐 Deployment

### Backend (Node.js)
- **Recommended:** Railway, Render, DigitalOcean
- **Requirements:** MongoDB, Redis
- Set environment variables
- Enable HTTPS

### Mobile App
```bash
# Build for production
cd mobile
expo build:android  # APK for Android
expo build:ios      # IPA for iOS

# Or publish to Expo
expo publish
```

### Web App
```bash
cd frontend
npm run build
# Deploy to Vercel, Netlify, or any static host
```

---

## 🛠️ Development

### Install Dependencies
```bash
# Install all dependencies
npm run install:all

# Or individually
cd backend && npm install
cd frontend && npm install
cd mobile && npm install
```

### Start Development Servers
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Web
cd frontend && npm start

# Terminal 3 - Mobile
cd mobile && npm start
```

### Code Quality
See `CODE_QUALITY_FIXES.md` for:
- Security best practices
- React hooks guidelines
- Component refactoring tips

---

## 📚 Documentation

- **`/mobile/README.md`** - Mobile app setup & features
- **`/mobile/SETUP_GUIDE.md`** - Detailed mobile app guide
- **`/CODE_QUALITY_FIXES.md`** - Security & code quality
- **`/MOBILE_APP_SUMMARY.md`** - Feature overview
- **`/QUICK_REFERENCE.md`** - Quick commands reference

---

## 🐛 Troubleshooting

### Backend not connecting
```bash
# Check MongoDB
mongosh

# Check Redis
redis-cli ping

# Check backend logs
tail -f /var/log/backend.log
```

### Mobile app can't reach backend
- Use correct IP for your device type
- Ensure backend is running
- Check firewall settings
- Same WiFi network (for physical devices)

### OTP not sending
- Verify AuthKey credentials in `.env`
- Check console logs (development mode)
- Verify phone number format (10 digits, starts with 6-9)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@hlobaby111](https://github.com/hlobaby111)

---

## 🙏 Acknowledgments

- React Native & Expo team
- MongoDB & Redis communities
- AuthKey for OTP service
- Razorpay for payment integration

---

## 📊 Project Stats

- **Lines of Code:** ~15,000+
- **Files:** 100+
- **API Endpoints:** 32+
- **Mobile Screens:** 9
- **Web Pages:** 15+
- **Security Features:** 10+

---

## 🚀 What's Next?

- [ ] Push notifications (Firebase)
- [ ] Google Maps integration
- [ ] In-app reviews & ratings
- [ ] Referral system
- [ ] Loyalty points
- [ ] Multi-language support
- [ ] Dark mode

---

**Built with ❤️ using MERN Stack + React Native**

**⭐ Star this repo if you find it useful!**
