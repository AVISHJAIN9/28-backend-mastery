/**
 * Module 03: Test Doubles - Controller
 * Functions demonstrating mocking patterns
 */

const externalApi = require('./external-api');
const database = require('./database');
const emailService = require('./email-service');
const logger = require('./logger');

// ============ USER MANAGEMENT WITH MOCKS ============

const createUserWithEmail = async (userData) => {
  if (!userData.email) throw new Error('Email required');
  
  const user = { id: Math.random(), ...userData };
  await database.save(user);
  await emailService.sendWelcome(user.email);
  logger.info('User created', { userId: user.id });
  
  return user;
};

const fetchUserFromAPI = async (userId) => {
  const data = await externalApi.get(`/users/${userId}`);
  if (!data) throw new Error('User not found');
  return data;
};

const validateWithExternalService = async (data) => {
  const result = await externalApi.post('/validate', data);
  return result.valid;
};

// ============ ERROR HANDLING WITH MOCKS ============

const sendNotificationWithRetry = async (userId, message) => {
  let attempts = 0;
  while (attempts < 3) {
    try {
      await emailService.send(userId, message);
      return { success: true };
    } catch (e) {
      attempts++;
      if (attempts === 3) throw e;
      await new Promise(r => setTimeout(r, 100 * attempts));
    }
  }
};

const logOperation = (operation, data) => {
  logger.info(operation, data);
  return { logged: true };
};

// ============ STUB FUNCTIONS ============

const getUserData = (userId) => {
  return { id: userId, name: 'Test User', active: true };
};

const getPaymentStatus = (orderId) => {
  return { orderId, status: 'completed', amount: 100 };
};

// ============ SPY VERIFICATION ============

const callServiceAndTrack = async (serviceFunc, params) => {
  const result = await serviceFunc(params);
  logger.info('Service called', { params, result });
  return result;
};

const processWithTracking = (data, callback) => {
  const processed = callback(data);
  logger.info('Processing done', { data, processed });
  return processed;
};

module.exports = {
  createUserWithEmail,
  fetchUserFromAPI,
  validateWithExternalService,
  sendNotificationWithRetry,
  logOperation,
  getUserData,
  getPaymentStatus,
  callServiceAndTrack,
  processWithTracking
};

