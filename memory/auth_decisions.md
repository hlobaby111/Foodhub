# Authentication — Decisions & Implementation Reference

> Last updated: April 15, 2026  
> Covers: OTP Flow, Tokens, Redis, WebSocket, Rate Limiting

---

## 1. Entry Point — Phone + OTP Auth (Mobile)

### Flow
```
PhoneInputScreen
  → POST /api/otp-auth/send-otp
      [otpLimiter middleware]   max 2 req/min per IP
      [checkRateLimit(phone)]   Redis: otp_limit_{phone}  TTL = 30s
      generateOTP()             6-digit random number
      hashOTP(otp)              SHA-256 hash — NEVER store plain text in Redis
      Redis.setex(otp_{phone})  stores HASH, TTL = 5 minutes
      AuthKey SMS (or console in dev)
      Returns: 200 + otp (dev only)
      waitSeconds: 30 passed to OTPVerificationScreen

OTPVerificationScreen
  timer = 30s (server-authoritative, synced from 429 waitSeconds on resend)
  → POST /api/otp-auth/verify-otp
      [authLimiter middleware]       max 5 attempts per 15min per IP
      incrementFailedAttempts(phone) Redis: otp_failed_{phone}, TTL 1hr
      if >= 5 failures → 429 blocked
      verifyOTP()
        Redis.get(otp_{phone})     → stored hash
        SHA-256(input) === stored? → match
        Redis.del(otp_{phone})     → single-use, deleted immediately on success
      clearFailedAttempts(phone)
      User.findOne({ phone })
        not found → create new user (isPhoneVerified: true)
        found     → update isPhoneVerified: true
      tokenService.generateTokenPair(userId, role)
        accessToken  → JWT, secret=JWT_SECRET, expires 15 min
        refreshToken → JWT, secret=JWT_REFRESH_SECRET, expires 7 days
      Redis.sadd(refresh_{userId}, refreshToken)  ← SET, multi-device
      Redis.expire(refresh_{userId}, 7 days)
      Returns: { accessToken, refreshToken, user, isNewUser, needsProfile }

Mobile persistSession()
  AsyncStorage.setItem('accessToken', ...)
  AsyncStorage.setItem('refreshToken', ...)
  AsyncStorage.setItem('user', ...)
  AsyncStorage.removeItem('token')   ← cleans up legacy key

AuthContext.setUser(userData)
  → AppNavigator detects user → switches to MainTabs automatically
```

---

## 2. Email/Password Auth (Web + Mobile fallback)

### Routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET  /api/auth/profile`   (authMiddleware required)
- `PUT  /api/auth/profile`   (authMiddleware required)

### Token contract (same as OTP auth — unified)
```
returns { accessToken, refreshToken, user }
```
- Uses `tokenService.generateTokenPair()`
- Stores refreshToken via `tokenService.storeRefreshToken()` (Redis SET)
- Frontend reads `accessToken || token` for backward compat
- Stored as `authToken` in `localStorage` (web)

---

## 3. Token Architecture

### Access Token
| Property | Value |
|---|---|
| Secret | `process.env.JWT_SECRET` (throws at startup if missing) |
| Expires | 15 minutes |
| Payload | `{ userId, role, type: 'access' }` |
| Blacklist | Redis `bl_{token}` on logout, TTL = 900s |

### Refresh Token
| Property | Value |
|---|---|
| Secret | `process.env.JWT_REFRESH_SECRET` (throws at startup if missing) |
| Expires | 7 days |
| Payload | `{ userId, role, type: 'refresh' }` |
| Storage | Redis SET `refresh_{userId}` — one entry per device |
| Rotation | Every use: old token removed + blacklisted, new pair issued |

### Multi-device support
- Each device stores its own refresh token in the SET
- Logout removes only that device's token (`srem`)
- `removeAllRefreshTokens()` available for "logout everywhere" feature

### Token verification flow (authMiddleware)
```
Authorization: Bearer {accessToken}
  → tokenService.verifyAccessToken(token)
  →   Redis.get(bl_{token}) → if blacklisted, reject
  →   jwt.verify(token, JWT_SECRET)
  →   if decoded.type exists and !== 'access' → reject
       (backward compat: old tokens without type claim still accepted)
  → User.findById(decoded.userId)
  → if !user.isActive → 403
  → req.user = user, req.userId = decoded.userId
```

---

## 4. Token Refresh Flow

```
Mobile api.js interceptor
  on 401 with code TOKEN_EXPIRED:
    refreshToken = AsyncStorage.getItem('refreshToken')
    POST /api/otp-auth/refresh-token { refreshToken }
      tokenService.rotateRefreshToken(oldToken)
        verifyRefreshToken(oldToken)             checks bl_ blacklist + type
        Redis.sismember(refresh_{userId}, old)   must exist in user's SET
        Redis.srem(refresh_{userId}, old)        remove old from SET
        blacklistToken(old, 7days)               prevent reuse
        generateTokenPair()                      new access + refresh
      storeRefreshToken(userId, newRefreshToken) adds to SET
      returns { accessToken, refreshToken }
    AsyncStorage.setItem('accessToken', new)
    AsyncStorage.setItem('refreshToken', new)
    retry original request
  on refresh failure → clear storage → user logs in again
```

---

## 5. Logout

### Single-device logout
```
POST /api/otp-auth/logout
  body: { refreshToken }
  header: Authorization: Bearer {accessToken}
    blacklistToken(accessToken, 900s)
    removeRefreshToken(userId, refreshToken)  ← srem from SET
```

### Mobile client sends
```javascript
const refreshToken = await AsyncStorage.getItem('refreshToken');
await api.post('/api/otp-auth/logout', { refreshToken });
```

---

## 6. WebSocket Authentication

```
Mobile OrderTrackingScreen:
  AsyncStorage.getItem('accessToken')
  io(BACKEND_URL, { auth: { token: accessToken } })

Backend server.js:
  io.use(async (socket, next) => {
    token = socket.handshake.auth?.token || header Authorization
    tokenService.verifyAccessToken(token)
    socket.userId = decoded.userId
    socket.userRole = decoded.role
    next()
  })
  // Unauthenticated connections are rejected before reaching any handler
```

---

## 7. Rate Limiting

| Limiter | Window | Max | Applied to |
|---|---|---|---|
| `apiLimiter` | 15 min | 100 req | All `/api/*` routes |
| `authLimiter` | 15 min | 5 req | `POST /verify-otp` |
| `otpLimiter` | 1 min | 2 req | `POST /send-otp` |
| `checkRateLimit` (Redis) | 30 sec | 1 per phone | Per-phone OTP cooldown |
| `incrementFailedAttempts` | 1 hr | 5 fails | Per-phone wrong OTP block |

> `skipInDevelopment` has been **removed**. Rate limits apply in all environments.

---

## 8. OTP Security Details

| Property | Value |
|---|---|
| Length | 6 digits |
| Storage | SHA-256 hash in Redis (never plain text) |
| TTL | 5 minutes |
| Single-use | Deleted immediately on first successful verify |
| Resend cooldown | 30s per phone (Redis), timer synced via `waitSeconds` in 429 |
| Wrong attempt limit | 5 per hour per phone, then 1hr block |

---

## 9. Redis Key Map

| Key | Type | TTL | Purpose |
|---|---|---|---|
| `otp_{phone}` | string (hash) | 5 min | OTP hash for verification |
| `otp_limit_{phone}` | string | 30s | Per-phone resend cooldown |
| `otp_failed_{phone}` | string (int) | 1 hr | Failed attempt counter |
| `refresh_{userId}` | SET | 7 days | Active refresh tokens per user |
| `bl_{token}` | string | varies | Blacklisted tokens |

---

## 10. Environment Variables Required

```env
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<different-strong-random-secret>
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<if needed>
REDIS_DISABLED=false      # set true to use in-memory fallback (dev only)
NODE_ENV=development|production
AUTHKEY_API_KEY=<sms-api-key>
AUTHKEY_TEMPLATE_ID=<sms-template-id>
```

> ⚠️ Server will **throw at startup** if `JWT_SECRET` or `JWT_REFRESH_SECRET` are missing.

---

## 11. What Is Still NOT Done (Next Steps)

| Item | Priority | Status |
|---|---|---|
| ~~HTTPS enforcement~~ | High | ✅ Done |
| ~~httpOnly cookie for web (replace localStorage)~~ | High | ✅ Done |
| Order ownership check on WebSocket `join_order` | Medium | ❌ Open |
| "Logout from all devices" API endpoint | Medium | ❌ Open |
| Email verification for email/password auth | Medium | ❌ Open |
| Refresh token per-device metadata (device name, last used) | Low | ❌ Open |

---

## 12. HTTPS Enforcement

**Backend `server.js`:**
- In production, an Express middleware checks `X-Forwarded-Proto` header (set by reverse proxy / load balancer) and issues a `301` redirect to HTTPS if the request arrived over plain HTTP.
- This runs **before all other middleware** so nothing leaks over HTTP.

```javascript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
```

**HSTS header (via helmet):**
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- Only active in `NODE_ENV=production` to avoid breaking local dev.
- Tells browsers to **always** use HTTPS for this domain for the next year.

---

## 13. httpOnly Cookie Auth (Web)

### Why cookies instead of localStorage
- `localStorage` tokens are readable by any JavaScript on the page — XSS attack steals them instantly.
- `httpOnly` cookies are **never readable by JS** — XSS cannot exfiltrate them.

### Cookie settings
| Property | Value | Reason |
|---|---|---|
| `httpOnly` | `true` | JS cannot read |
| `secure` | `true` in production | Only sent over HTTPS |
| `sameSite` | `strict` | Prevents CSRF — cookie only sent on same-site navigations |
| `path` | `/` | Available for all API calls |
| `maxAge` (access) | 15 min | Matches JWT expiry |
| `maxAge` (refresh) | 7 days | Matches refresh JWT expiry |

### Cookies set
| Cookie | Content | TTL |
|---|---|---|
| `access_token` | JWT access token | 15 min |
| `refresh_token` | JWT refresh token | 7 days |

### Endpoints that set cookies
- `POST /api/auth/login` — sets both cookies
- `POST /api/auth/register` — sets both cookies

### Endpoint that clears cookies
- `POST /api/auth/logout` — clears both cookies + blacklists access token

### Web token refresh flow
```
Browser request → 401 (access_token cookie expired)
  api.js interceptor queues pending requests
  POST /api/auth/refresh-token   (refresh_token cookie auto-sent)
    → rotateRefreshToken(refresh_token from cookie)
    → sets new access_token + refresh_token cookies
  Retry all queued requests (new cookie auto-sent)
  If refresh also fails → dispatch 'auth:sessionExpired' event
    → AuthContext listener clears user state → user sees login page
```

### Mobile is unaffected
- Mobile still uses `Authorization: Bearer {token}` header (no cookies)
- `authMiddleware` reads cookie first, then falls back to Authorization header
- Both paths verified through same `tokenService.verifyAccessToken()`

### New backend endpoints
- `POST /api/auth/logout` — clears cookies, blacklists access, removes refresh from Redis SET
- `POST /api/auth/refresh-token` — reads `refresh_token` cookie, rotates, sets new cookies

### Frontend changes (web only)
- `api.js`: `withCredentials: true`, no manual Authorization header, refresh+retry interceptor
- `AuthContext.js`: **zero localStorage** — session state comes from `/api/auth/profile` via cookie on page load



