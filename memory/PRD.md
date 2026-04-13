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
1. **Customer** - Browse restaurants, order food, track orders, leave reviews
2. **Restaurant Owner** - Manage menus, handle orders, track revenue
3. **Admin** - Approve restaurants, manage platform

## What's Been Implemented (Feb 2026)
### Phase 1 (Initial Build)
- [x] Node.js + Express backend (MVC pattern, 23 endpoints)
- [x] JWT auth with 3 user roles
- [x] MongoDB models: User, Restaurant, MenuItem, Order, Review
- [x] Database seeding with sample data
- [x] Home page with hero, search, location filters, pagination
- [x] Restaurant detail page with menu items
- [x] Cart, Checkout, Orders pages
- [x] Restaurant Owner & Admin Dashboards

### Phase 2 (UX Improvements)
- [x] Sticky "View Cart" bottom bar on restaurant detail page
- [x] Unified cart+checkout page with: items, +Add more, notes, suggested items, apply coupon, delivery time, delivery form, payment, order summary
- [x] Coupon system (WELCOME50, FOOD100) 
- [x] Owner Dashboard redesigned: sidebar nav, Overview/Orders/Menu/Restaurants (management-only, no public browsing)
- [x] Ratings & Reviews UI on restaurant detail page
- [x] Rate & Review dialog for delivered orders
- [x] Full mobile responsiveness across all pages

## Prioritized Backlog
### P1
- Real image upload for menu items (needs valid storage key)
- Real Razorpay payment flow
- Backend coupon management (currently client-side)

### P2
- Push notifications / real-time order tracking
- Delivery partner role
- Advanced analytics dashboard
- Email notifications for order updates
