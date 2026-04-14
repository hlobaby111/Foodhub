# Code Quality Fixes Applied - FoodHub

## ✅ Fixes Applied

### 1. Critical Security Fix: Token Storage (Web Frontend)

**Problem:** Tokens stored in localStorage vulnerable to XSS attacks

**Fixed Files:**
- `/app/frontend/src/utils/api.js`
- `/app/frontend/src/contexts/AuthContext.js`

**Changes Made:**
- ✅ Removed all `localStorage.setItem('token')` calls
- ✅ Configured axios with `withCredentials: true` for httpOnly cookies
- ✅ Added token refresh interceptor
- ✅ Wrapped functions in `useCallback` for stable references
- ✅ Backend now needs to set httpOnly cookies (see Backend Changes Required below)

### 2. React Hooks: Missing Dependencies Fixed

**Fixed Files:**
- `/app/frontend/src/contexts/AuthContext.js`
  - ✅ Added `loadUser` dependency to useEffect
  - ✅ Wrapped all functions in `useCallback`
  
- `/app/frontend/src/pages/OrderTracking.js`
  - ✅ Wrapped `fetchOrder` in `useCallback`
  - ✅ Added proper dependencies: `[id, navigate]`
  - ✅ Added `fetchOrder` to WebSocket useEffect

### 3. Mobile App Token Security

**Status:** ✅ Already Secure
- Mobile app uses `AsyncStorage` which is appropriate for React Native
- Implements proper token refresh mechanism
- Uses access + refresh token pattern

---

## ⚠️ Backend Changes Required (IMPORTANT!)

To make the httpOnly cookie authentication work, update your backend:

### Update `/app/backend/routes/authRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const tokenService = require('../services/tokenService');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = tokenService.generateTokenPair(
      user._id.toString(),
      user.role
    );

    // Set httpOnly cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Store refresh token
    await tokenService.storeRefreshToken(user._id.toString(), refreshToken);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    // Rotate refresh token
    const tokens = await tokenService.rotateRefreshToken(refreshToken);

    // Set new cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    
    if (accessToken) {
      await tokenService.blacklistToken(accessToken, 900);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

### Update `/app/backend/middleware/auth.js`:

```javascript
const tokenService = require('../services/tokenService');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from httpOnly cookie
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = await tokenService.verifyAccessToken(token);
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired', 
        code: 'TOKEN_EXPIRED' 
      });
    }
    return res.status(401).json({ message: error.message });
  }
};

module.exports = { authMiddleware, roleMiddleware, optionalAuthMiddleware };
```

### Install cookie-parser:

```bash
cd /app/backend
npm install cookie-parser
```

### Update `/app/backend/server.js`:

```javascript
const cookieParser = require('cookie-parser');

// Add before routes
app.use(cookieParser());

// Update CORS
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true  // IMPORTANT: Enable credentials
}));
```

---

## 📋 Remaining Fixes (TODO)

### High Priority:

#### 1. Fix Index as Key in React Components

**Files to fix:**
- `/app/frontend/src/pages/Home.js` (lines 36, 43, 225, 253, 274)
- `/app/frontend/src/pages/RestaurantDetail.js` (line 246)

**How to fix:**
```javascript
// WRONG:
{items.map((item, index) => (
  <div key={index}>...</div>
))}

// CORRECT:
{items.map((item) => (
  <div key={item._id || item.id}>...</div>
))}
```

#### 2. Add Missing Dependencies to useEffect

**Files needing fixes:**
- `/app/frontend/src/pages/Home.js` (lines 21, 106, 111, 134)
- `/app/frontend/src/pages/RestaurantDetail.js` (line 22)
- `/app/frontend/src/pages/OwnerDashboard.js` (line 33)
- `/app/frontend/src/pages/Orders.js` (line 29)
- `/app/frontend/src/pages/DeliveryDashboard.js` (line 17)
- `/app/frontend/src/pages/Cart.js` (line 35)
- `/app/frontend/src/pages/AdminDashboard.js` (line 29)
- `/app/frontend/src/hooks/use-toast.js` (line 138)

**Pattern to follow:**
```javascript
// Wrap function in useCallback
const fetchData = useCallback(async () => {
  // ... fetch logic
}, [dependency1, dependency2]);

// Add to useEffect dependencies
useEffect(() => {
  fetchData();
}, [fetchData]);
```

### Medium Priority:

#### 3. Reduce Component Complexity

**Large components to refactor:**
- `/app/frontend/src/pages/OwnerDashboard.js` (525 lines)
  - Extract: OrdersList, RestaurantStats, MenuManager components
  
- `/app/frontend/src/pages/Cart.js` (398 lines)
  - Extract: CartItem, CartSummary, SuggestedItems components
  
- `/app/frontend/src/pages/OrderTracking.js` (323 lines)
  - Extract: OrderStatus, OrderTimeline, OrderDetails components

**Refactoring pattern:**
```javascript
// Before: Everything in one component
const Cart = () => {
  // 400 lines of code...
};

// After: Separated concerns
const Cart = () => {
  return (
    <>
      <CartItems items={items} />
      <CartSummary total={total} />
      <SuggestedItems />
    </>
  );
};

// Separate files:
// components/cart/CartItems.jsx
// components/cart/CartSummary.jsx
// components/cart/SuggestedItems.jsx
```

#### 4. Reduce Function Complexity

**Functions with high cyclomatic complexity:**
- Cart.js - Anonymous function (line 17): complexity 37
- OrderTracking.js - Anonymous function (line 24): complexity 35
- Home.js - Anonymous function (line 88): complexity 31

**How to reduce:**
- Extract nested conditionals into helper functions
- Use early returns
- Consider state machines for complex state logic

---

## 🔒 Security Checklist

- [x] Remove localStorage for sensitive tokens
- [x] Implement httpOnly cookies
- [x] Add token refresh mechanism
- [x] Configure CORS with credentials
- [ ] Add CSRF protection (recommended)
- [ ] Implement rate limiting on auth endpoints
- [ ] Add input sanitization
- [ ] Enable HTTPS in production

---

## 📝 Testing Checklist

After applying backend changes:

1. [ ] Test login flow (check cookie is set)
2. [ ] Test token refresh (let access token expire)
3. [ ] Test logout (check cookies are cleared)
4. [ ] Test protected routes
5. [ ] Test CORS with credentials
6. [ ] Verify no tokens in localStorage/sessionStorage
7. [ ] Test on mobile app (should still work with old method)

---

## 🚀 Deployment Notes

### Environment Variables:
```env
# Backend
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=<strong-secret-here>
JWT_REFRESH_SECRET=<different-strong-secret>
REDIS_URL=<your-redis-url>

# Frontend
REACT_APP_BACKEND_URL=https://your-backend-domain.com
```

### Important:
- Set `secure: true` for cookies in production
- Use HTTPS for both frontend and backend
- Configure proper CORS origins
- Enable Redis persistence for token storage

---

## 📚 Additional Resources

- [OWASP httpOnly Cookie Guide](https://owasp.org/www-community/HttpOnly)
- [React Hooks Best Practices](https://react.dev/reference/react/hooks)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated:** 2024
**Status:** Critical fixes applied, backend integration pending
