# FoodHub - Food Delivery Application

A full-stack food delivery web application built with React, Node.js/Express, MongoDB, and WebSocket for real-time tracking.

## Architecture

```
Frontend (React + Tailwind + Shadcn UI) → REST API + WebSocket → Backend (Node.js + Express) → MongoDB
```

## User Roles

| Role | Description |
|------|------------|
| **Customer** | Browse restaurants, order food, track deliveries, rate & review |
| **Restaurant Owner** | Manage restaurants, menus, orders, settings (veg/non-veg, photos) |
| **Delivery Partner** | Accept deliveries, share live location, mark delivered |
| **Admin** | Approve restaurants, manage users, view analytics, manage banners |

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB
- npm/yarn

### Backend Setup
```bash
cd backend
cp .env.example .env  # Configure environment variables
npm install
node server.js        # Starts on port 8001 with WebSocket
```

### Frontend Setup
```bash
cd frontend
yarn install
yarn start            # Starts on port 3000
```

### Environment Variables

**Backend (.env)**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=food_delivery
JWT_SECRET=your-secret-key
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=test_secret_xxx
EMERGENT_LLM_KEY=your-storage-key
PORT=8001
```

**Frontend (.env)**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## API Documentation

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/profile` | Get current user | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |

### Restaurants
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/restaurants` | List restaurants (paginated, filterable) | No |
| GET | `/api/restaurants/:id` | Restaurant detail + menu | No |
| GET | `/api/restaurants/my` | Owner's restaurants | Owner |
| POST | `/api/restaurants` | Create restaurant | Owner |
| PUT | `/api/restaurants/:id` | Update restaurant | Owner |
| PUT | `/api/restaurants/:id/settings` | Update settings (veg, photos, time) | Owner |

### Menu Items
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/menu?restaurantId=xxx` | Get menu items | No |
| GET | `/api/menu/my` | Owner's menu items | Owner |
| POST | `/api/menu` | Create menu item | Owner |
| PUT | `/api/menu/:id` | Update menu item | Owner |
| DELETE | `/api/menu/:id` | Delete menu item | Owner |

### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Place order | Customer |
| GET | `/api/orders/my` | Customer's orders | Customer |
| GET | `/api/orders/:id` | Order details | Auth |
| PUT | `/api/orders/:id/cancel` | Cancel order (min 10 char reason) | Customer |
| PUT | `/api/orders/:id/status` | Update order status | Owner |
| POST | `/api/orders/verify-payment` | Verify Razorpay payment | Customer |
| GET | `/api/orders/restaurant` | Restaurant's orders | Owner |
| GET | `/api/orders/notifications/list` | Get notifications | Owner |
| PUT | `/api/orders/notifications/read` | Mark notifications read | Owner |

### Addresses
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/addresses` | Get saved addresses | Yes |
| POST | `/api/addresses` | Add new address | Yes |
| PUT | `/api/addresses/:id` | Update address | Yes |
| DELETE | `/api/addresses/:id` | Delete address | Yes |
| PUT | `/api/addresses/location/current` | Update live location | Yes |

### Delivery Partner
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/delivery/dashboard` | Dashboard stats | Delivery |
| GET | `/api/delivery/available` | Available orders for pickup | Delivery |
| PUT | `/api/delivery/accept/:id` | Accept delivery | Delivery |
| PUT | `/api/delivery/location/:id` | Update live location | Delivery |
| PUT | `/api/delivery/delivered/:id` | Mark as delivered | Delivery |
| PUT | `/api/delivery/toggle-availability` | Go online/offline | Delivery |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/stats` | Dashboard statistics | Admin |
| GET | `/api/admin/users` | All users | Admin |
| PUT | `/api/admin/users/:id/toggle-status` | Activate/deactivate user | Admin |
| GET | `/api/admin/restaurants/pending` | Pending restaurant approvals | Admin |
| GET | `/api/admin/restaurants` | All restaurants | Admin |
| PUT | `/api/admin/restaurants/:id/status` | Approve/reject restaurant | Admin |
| GET | `/api/admin/orders` | All orders | Admin |
| POST | `/api/admin/banners` | Add banner | Admin |

### Search & Banners
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/search?q=query` | Instant search (restaurants + dishes) | No |
| GET | `/api/banners` | Get active banners | No |

### Reviews
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/reviews` | Submit review | Customer |
| GET | `/api/reviews/restaurant/:id` | Restaurant reviews | No |

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `join_order` | Client → Server | Join order room for updates |
| `leave_order` | Client → Server | Leave order room |
| `order_update` | Server → Client | Order status changed |
| `delivery_location` | Server → Client | Delivery partner location update |

**WebSocket Path:** `/api/socket.io`

## Order Flow

```
Customer places order → status: PLACED
    ↓
Restaurant accepts → status: ACCEPTED
    ↓
Restaurant prepares → status: PREPARING
    ↓
Food ready → status: READY (available for delivery pickup)
    ↓
Delivery partner picks up → status: PICKED_UP
    ↓
On the way (live tracking) → status: OUT_FOR_DELIVERY
    ↓
Delivered → status: DELIVERED
```

**Cancel Flow:** Customer can cancel before OUT_FOR_DELIVERY → requires 10+ char reason → notification sent to restaurant dashboard.

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@foodhub.com | Admin@123 |
| Customer | customer@test.com | customer123 |
| Restaurant Owner | owner@test.com | owner123 |
| Delivery Partner | delivery@test.com | delivery123 |

## Tech Stack
- **Frontend:** React 19, Tailwind CSS, Shadcn UI, Socket.io Client, Axios
- **Backend:** Node.js, Express, Mongoose, Socket.io, JWT, Razorpay
- **Database:** MongoDB
- **Real-time:** WebSocket (Socket.io)
- **Storage:** Emergent Object Storage (image uploads)
