# FoodHub Mobile App

React Native mobile application for FoodHub food delivery platform (Customer App)

## Features
- Browse restaurants
- Search restaurants and dishes
- Order food with cart management
- Real-time order tracking
- Payment integration (Razorpay)
- Address management
- Order history

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)

### Installation
```bash
cd mobile
npm install
```

### Running the App
```bash
npm start
```

This will open Expo DevTools. You can:
- Scan QR code with Expo Go app (Android/iOS)
- Press 'a' for Android emulator
- Press 'i' for iOS simulator

### Backend Configuration
Update `BACKEND_URL` in `.env` file to point to your backend server.

For localhost testing:
- Android Emulator: `http://10.0.2.2:8001`
- iOS Simulator: `http://localhost:8001`
- Physical Device: `http://YOUR_IP:8001`

## Tech Stack
- React Native (Expo)
- React Navigation
- React Native Paper (UI Components)
- Axios (API calls)
- Socket.io Client (Real-time tracking)
- AsyncStorage (Local storage)

## Screens
1. **Auth**: Login, Register
2. **Home**: Restaurant browsing with search and filters
3. **Restaurant Detail**: Menu and ordering
4. **Cart**: Cart management
5. **Checkout**: Address and payment
6. **Orders**: Order history
7. **Order Tracking**: Real-time order tracking
8. **Profile**: User profile and settings
