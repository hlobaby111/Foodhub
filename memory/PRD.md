# FoodHub - Food Delivery App PRD

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (port 3000)
- **Backend**: Node.js + Express (port 8001)
- **Database**: MongoDB
- **Auth**: JWT-based (3 roles: customer, restaurant_owner, admin)
- **Payment**: Razorpay (test mode)

## What's Been Implemented

### Phase 1 - Core Build
- Node.js + Express backend (MVC, 32 endpoints)
- JWT auth, MongoDB models, database seeding
- Restaurant browsing, cart, checkout, orders

### Phase 2 - UX Improvements
- Sticky View Cart bar, unified cart+checkout page
- Coupon system, reviews UI, responsive design
- Owner Dashboard with sidebar management panel

### Phase 3 - Order Tracking & Zomato-style UI
- [x] Zomato-style home: location selector, search, banner carousel (admin-managed), filters, restaurant grid
- [x] Order Tracking page (/track/:id) with live status steps, restaurant info, delivery address
- [x] Cancel order with min 10-char reason, notification to restaurant dashboard
- [x] Owner notifications tab for cancellation alerts
- [x] Orders page: Track Order for active, cancel reason display for cancelled
- [x] Banner carousel with 3 default banners (seeded)

## Backlog
### P1
- Real Razorpay payment flow, image uploads
- Backend coupon management
### P2
- Real-time WebSocket updates, delivery partner role
- Advanced analytics, email notifications
