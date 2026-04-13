# FoodHub - Food Delivery App PRD

## Architecture
- Frontend: React + Tailwind + Shadcn UI + Socket.io Client (port 3000)
- Backend: Node.js + Express + Socket.io (port 8001)
- Database: MongoDB
- Auth: JWT (4 roles), Payment: Razorpay (test), Storage: Emergent Object Storage

## Implemented (Feb 2026)
### Phase 1-3: Core + UX + Tracking
- Full CRUD for restaurants, menus, orders, reviews
- Zomato-style home: location selector, search, banner carousel, restaurant cards with rotating photos, veg/non-veg
- Cart + checkout unified page with coupons, notes, delivery details
- Order tracking with WebSocket real-time updates, 7-step status flow
- Cancel order with min 10-char reason + restaurant notifications

### Phase 4: Delivery Partner + Scalability
- Delivery partner role: dashboard, accept orders, share live location, mark delivered, toggle availability
- WebSocket server for real-time order updates and delivery location
- Instant search (debounced, restaurants + dishes)
- Persistent cart bar on home screen
- Restaurant settings (isVeg, photos, delivery time) editable by owner
- Multi-photo restaurant cards with auto-rotate
- Address management API (save, edit, delete)
- Comprehensive README with all 32+ API endpoints

## Backlog
P1: Real Razorpay, backend coupons, image upload
P2: Google Maps integration, push notifications, analytics
