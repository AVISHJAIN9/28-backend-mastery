const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { validateRequest, limitOtpAttempts } = require('./middleware');
const { smsSchema, otpSchema, verifyOtpSchema } = require('./schema');

router.post('/sms/send', validateRequest(smsSchema), ctrl.sendSMS);
router.post('/otp/send', validateRequest(otpSchema), limitOtpAttempts(3), ctrl.sendOTP);
router.post('/otp/verify', validateRequest(verifyOtpSchema), limitOtpAttempts(3), ctrl.verifyOTP);
router.get('/logs', ctrl.getSMSLog);

module.exports = router;
