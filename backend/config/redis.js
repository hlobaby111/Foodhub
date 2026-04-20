const Redis = require('ioredis');

function createMemoryRedis() {
  const store = new Map();

  const isExpired = (entry) => entry.expiresAt && entry.expiresAt <= Date.now();

  const getEntry = (key) => {
    const entry = store.get(key);
    if (!entry) return null;

    if (isExpired(entry)) {
      store.delete(key);
      return null;
    }

    return entry;
  };

  return {
    status: 'ready',

    on() {
      return this;
    },

    async get(key) {
      const entry = getEntry(key);
      return entry ? entry.value : null;
    },

    async setex(key, ttlSeconds, value) {
      store.set(key, {
        value: String(value),
        expiresAt: Date.now() + Number(ttlSeconds) * 1000,
      });
      return 'OK';
    },

    async del(...keys) {
      let removed = 0;
      keys.flat().forEach((key) => {
        if (store.delete(key)) removed += 1;
      });
      return removed;
    },

    async incr(key) {
      const entry = getEntry(key);
      const current = entry ? Number(entry.value) || 0 : 0;
      const next = current + 1;

      store.set(key, {
        value: String(next),
        expiresAt: entry ? entry.expiresAt : null,
      });

      return next;
    },

    async expire(key, ttlSeconds) {
      const entry = getEntry(key);
      if (!entry) return 0;

      entry.expiresAt = Date.now() + Number(ttlSeconds) * 1000;
      store.set(key, entry);
      return 1;
    },

    async ttl(key) {
      const entry = getEntry(key);
      if (!entry) return -2; // key does not exist
      if (!entry.expiresAt) return -1; // key exists, no expiry
      return Math.ceil((entry.expiresAt - Date.now()) / 1000);
    },

    // --- Set operations (multi-device token support) ---
    async sadd(key, ...members) {
      let entry = getEntry(key);
      if (!entry) {
        entry = { value: new Set(), expiresAt: null };
      }
      if (!(entry.value instanceof Set)) return 0;
      let added = 0;
      members.flat().forEach((m) => {
        if (!entry.value.has(m)) { entry.value.add(m); added++; }
      });
      store.set(key, entry);
      return added;
    },

    async smembers(key) {
      const entry = getEntry(key);
      if (!entry || !(entry.value instanceof Set)) return [];
      return [...entry.value];
    },

    async srem(key, ...members) {
      const entry = getEntry(key);
      if (!entry || !(entry.value instanceof Set)) return 0;
      let removed = 0;
      members.flat().forEach((m) => {
        if (entry.value.delete(m)) removed++;
      });
      store.set(key, entry);
      return removed;
    },

    async sismember(key, member) {
      const entry = getEntry(key);
      if (!entry || !(entry.value instanceof Set)) return 0;
      return entry.value.has(member) ? 1 : 0;
    },
  };
}

const redisDisabled = process.env.REDIS_DISABLED === 'true';
let memoryFallback = null;

if (redisDisabled) {
  console.warn('Redis disabled via REDIS_DISABLED=true. Using in-memory fallback cache.');
  module.exports = createMemoryRedis();
} else {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => Math.min(times * 100, 2000),
  });

  redis.on('connect', () => {
    console.log('Redis Connected Successfully');
  });

  redis.on('error', (err) => {
    if (process.env.NODE_ENV === 'development' && !memoryFallback) {
      console.warn('Redis unavailable in development, switching to in-memory fallback:', err.message || 'Connection failed');
      memoryFallback = createMemoryRedis();
      redis.disconnect(false);
      return;
    }

    console.error('Redis Connection Error:', err.message);
  });

  const redisProxy = new Proxy({}, {
    get(_, prop) {
      const active = memoryFallback || redis;
      const value = active[prop];
      return typeof value === 'function' ? value.bind(active) : value;
    },
  });

  module.exports = redisProxy;
}
