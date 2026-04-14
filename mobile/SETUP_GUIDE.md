# FoodHub Mobile App - Setup & Installation Guide

## Overview
React Native mobile application for FoodHub food delivery platform (Customer App Only)

## Features Implemented ✅
- 🔐 **Authentication**: Login & Register
- 🏠 **Home**: Browse restaurants with search, filters, and location selector
- 🍽️ **Restaurant Detail**: View menu and add items to cart
- 🛒 **Cart Management**: Add/remove items, quantity control
- 💳 **Checkout**: Address management, payment options
- 📦 **Order Tracking**: Real-time order status with WebSocket
- 📱 **Profile**: User profile management, order history

## Tech Stack
- React Native (Expo ~50.0.0)
- React Navigation v6 (Stack + Bottom Tabs)
- React Native Paper v5 (UI Components)
- Axios (API calls)
- Socket.io Client (Real-time tracking)
- AsyncStorage (Local storage)

## Project Structure
```
mobile/
├── src/
│   ├── screens/           # All screen components
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   ├── RestaurantDetailScreen.js
│   │   ├── CartScreen.js
│   │   ├── CheckoutScreen.js
│   │   ├── OrdersScreen.js
│   │   ├── OrderTrackingScreen.js
│   │   └── ProfileScreen.js
│   ├── navigation/        # Navigation setup
│   │   └── AppNavigator.js
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.js
│   │   └── CartContext.js
│   ├── services/          # API service layer
│   │   └── api.js
│   ├── utils/             # Utilities & constants
│   │   ├── theme.js
│   │   └── constants.js
├── App.js                 # Root component
├── package.json
├── app.json
└── README.md
```

## Prerequisites
1. **Node.js 18+**
2. **Expo CLI**: Install globally
   ```bash
   npm install -g expo-cli
   ```
3. **Expo Go App**: Download on your phone
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Installation

### Step 1: Install Dependencies
```bash
cd mobile
npm install
# or
yarn install
```

### Step 2: Configure Backend URL
Edit `mobile/.env`:

**For testing with localhost:**
- Android Emulator: `BACKEND_URL=http://10.0.2.2:8001`
- iOS Simulator: `BACKEND_URL=http://localhost:8001`
- Physical Device: `BACKEND_URL=http://YOUR_IP:8001`

**For deployed backend:**
```
BACKEND_URL=https://your-backend-url.com
```

### Step 3: Start the Backend
Make sure your FoodHub backend is running:
```bash
cd backend
node server.js
# Backend should be running on port 8001
```

### Step 4: Start the Mobile App
```bash
cd mobile
npm start
# or
expo start
```

## Running the App

### On Physical Device (Recommended for Testing)
1. Start the app: `npm start`
2. Scan the QR code with:
   - **iOS**: Camera app (will open in Expo Go)
   - **Android**: Expo Go app

### On Android Emulator
1. Start Android emulator
2. Press `a` in Expo DevTools terminal

### On iOS Simulator (Mac only)
1. Press `i` in Expo DevTools terminal

## Important Notes

### Backend Connection
- The backend URL in `.env` must be accessible from your device
- For physical devices testing with localhost:
  1. Get your computer's IP address:
     - Mac/Linux: `ifconfig | grep inet`
     - Windows: `ipconfig`
  2. Update `.env`: `BACKEND_URL=http://YOUR_IP:8001`
  3. Both device and computer must be on same WiFi network

### WebSocket Connection
- Real-time order tracking uses WebSocket at `/api/socket.io`
- Ensure backend WebSocket server is running
- Connection automatically established in OrderTracking screen

### Test Credentials
```
Email: customer@test.com
Password: customer123
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Run on Android emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Run in web browser |

## Screen Flow

### Authentication Flow
```
Login/Register → Main App (Bottom Tabs)
```

### Order Flow
```
Home → Restaurant Detail → Cart → Checkout → Order Tracking
```

### Tab Navigation
- **Home Tab**: Browse restaurants, search, view details
- **Orders Tab**: View order history, track orders
- **Profile Tab**: User profile, settings, logout

## API Integration

### Endpoints Used
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/restaurants` - List restaurants
- `GET /api/restaurants/:id` - Restaurant details
- `GET /api/menu` - Menu items
- `GET /api/search` - Search restaurants/dishes
- `GET /api/banners` - Banner carousel
- `GET /api/addresses` - User addresses
- `POST /api/addresses` - Add address
- `POST /api/orders` - Place order
- `GET /api/orders/my` - User's orders
- `GET /api/orders/:id` - Order details
- `PUT /api/orders/:id/cancel` - Cancel order
- WebSocket: Order status updates

## Troubleshooting

### Issue: Can't connect to backend
**Solution:**
- Check backend is running on port 8001
- Verify `BACKEND_URL` in `.env`
- For physical device, use IP address instead of localhost
- Ensure firewall allows connections on port 8001

### Issue: WebSocket not connecting
**Solution:**
- Verify backend has Socket.io configured
- Check backend WebSocket path: `/api/socket.io`
- Review console logs for connection errors

### Issue: App crashes on startup
**Solution:**
- Clear cache: `expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for missing dependencies

### Issue: Images not loading
**Solution:**
- Check internet connection
- Verify image URLs are accessible
- Check if backend storage service is running

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### For Standalone Apps
Follow [Expo documentation](https://docs.expo.dev/distribution/building-standalone-apps/)

## UI/UX Features

### Design System
- **Colors**: Matches web app (Orange primary #E05D36)
- **Components**: Material Design via React Native Paper
- **Icons**: Material Community Icons
- **Fonts**: System fonts with custom weights

### Responsive Design
- Works on all screen sizes
- Optimized for phones (portrait mode)
- Touch-friendly buttons and controls

### Animations
- Photo carousel on restaurant cards
- Banner auto-rotation
- Smooth transitions
- Loading states

## Performance Optimizations

1. **Image Caching**: Automatic via React Native
2. **Debounced Search**: 500ms delay on search input
3. **Lazy Loading**: Pagination for restaurants
4. **State Management**: Efficient context usage
5. **WebSocket**: Only connects when needed

## Security

- JWT tokens stored in AsyncStorage
- HTTPS recommended for production
- Input validation on forms
- Secure password fields
- Token auto-refresh on API errors

## Future Enhancements

Potential features for future versions:
- [ ] Push notifications for order updates
- [ ] Google Maps integration for live delivery tracking
- [ ] Image upload for profile pictures
- [ ] In-app reviews and ratings
- [ ] Favorites/Wishlist
- [ ] Order history filters
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Biometric authentication

## Support

For issues or questions:
- Check backend logs: `/var/log/supervisor/backend.err.log`
- Review Expo logs in terminal
- Verify all dependencies are installed
- Ensure Node.js version compatibility

## License
Private - FoodHub Project

---
**Built with ❤️ using React Native & Expo**
