# FoodHub - Food Delivery App PRD

## Problem Statement
Build a full-stack food delivery web application similar to Zomato focused on a single local city (Mumbai).

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (port 3000)
- **Backend**: Node.js + Express (port 8001)
- **Database**: MongoDB
- **Auth**: JWT-based
- **Payment**: Razorpay (test mode)
- **Storage**: Emergent Object Storage (image uploads)

## User Personas
1. **Customer** - Browse restaurants, order food, track orders
2. **Restaurant Owner** - Manage menus, handle orders
3. **Admin** - Approve restaurants, manage platform

## Core Requirements
- Multi-role auth (customer, restaurant_owner, admin)
- Restaurant browsing with search/filter/pagination
- Cart and checkout with COD/online payment
- Order tracking with status updates
- Restaurant owner dashboard (menu/order management)
- Admin panel (stats, approvals, user management)

## What's Been Implemented (Feb 2026)
- [x] Full Node.js + Express backend with MVC pattern
- [x] JWT authentication with 3 user roles
- [x] MongoDB models: User, Restaurant, MenuItem, Order, Review
- [x] REST APIs for all features (23 endpoints)
- [x] Database seeding (admin, test users, sample restaurants/menus)
- [x] React frontend with all pages (Home, RestaurantDetail, Cart, Checkout, Orders, Profile)
- [x] Restaurant Owner Dashboard (manage restaurants, menus, orders)
- [x] Admin Dashboard (stats, approve restaurants, manage users/orders)
- [x] Search and location-based filtering
- [x] Order status tracking with visual progress
- [x] Razorpay integration (test mode - payments simulated)
- [x] Object storage integration for image uploads

## Prioritized Backlog
### P0 (Done)
- All core features implemented and tested

### P1 (Next)
- Ratings & reviews UI (backend done)
- Image upload for menu items and restaurant covers
- Real Razorpay payment flow (needs valid test keys)

### P2 (Future)
- Push notifications
- Real-time order tracking
- Delivery partner role
- Advanced analytics dashboard
- Email notifications for order updates
