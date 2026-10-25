/**
 * Module 05: Async & Timers - Controller
 * Async functions for testing patterns
 */

// ============ BASIC PROMISES ============

const fetchUser = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id < 0) reject(new Error('Invalid ID'));
      else resolve({ id, name: `User ${id}` });
    }, 100);
  });
};

const fetchMultiple = async (ids) => {
  const promises = ids.map(id => fetchUser(id));
  return Promise.all(promises);
};

// ============ RETRIES ============

const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 100));
    }
  }
};

// ============ POLLING ============

const poll = async (checkFn, timeout = 5000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const result = await checkFn();
    if (result) return result;
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Polling timeout');
};

// ============ DEBOUNCE ============

const debounce = (fn, delay) => {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// ============ THROTTLE ============

const throttle = (fn, delay) => {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

// ============ TIMERS ============

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const scheduleTask = (fn, delayMs) => {
  return setTimeout(fn, delayMs);
};

const repeatTask = (fn, intervalMs) => {
  return setInterval(fn, intervalMs);
};

// ============ RACE CONDITIONS ============

const raceRequests = (urls) => {
  const promises = urls.map(url => fetch(url));
  return Promise.race(promises);
};

const timeoutPromise = (promise, timeoutMs) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
};

module.exports = {
  fetchUser,
  fetchMultiple,
  retryWithBackoff,
  poll,
  debounce,
  throttle,
  sleep,
  scheduleTask,
  repeatTask,
  raceRequests,
  timeoutPromise
};

