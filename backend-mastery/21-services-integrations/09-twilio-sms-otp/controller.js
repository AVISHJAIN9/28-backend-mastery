const { v4: uuidv4 } = require('uuid');

const otpStore = new Map();
const smsLog = new Map();

exports.sendSMS = (req, res) => {
  const { phoneNumber, message } = req.validatedBody;
  const smsId = uuidv4();
  
  const sms = {
    id: smsId,
    to: phoneNumber,
    message,
    status: 'sent',
    sentAt: new Date(),
    price: 0.0075,
  };
  
  smsLog.set(smsId, sms);
  
  res.json({
    success: true,
    messageSid: smsId,
    phoneNumber,
    message,
    status: 'sent',
  });
};

exports.sendOTP = (req, res) => {
  const { phoneNumber, length } = req.validatedBody;
  const code = Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
  
  otpStore.set(phoneNumber, {
    code,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 300000),
    attempts: 0,
    verified: false,
  });
  
  const smsId = uuidv4();
  smsLog.set(smsId, {
    id: smsId,
    to: phoneNumber,
    message: `Your verification code is: ${code}`,
    status: 'sent',
    sentAt: new Date(),
  });
  
  res.json({
    success: true,
    messageSid: smsId,
    phoneNumber,
    message: `OTP sent to ${phoneNumber}`,
  });
};

exports.verifyOTP = (req, res) => {
  const { phoneNumber, code } = req.validatedBody;
  const otp = otpStore.get(phoneNumber);
  
  if (!otp) {
    return res.status(404).json({ error: 'OTP not found' });
  }
  
  if (otp.expiresAt < new Date()) {
    return res.status(400).json({ error: 'OTP expired' });
  }
  
  if (otp.code !== code) {
    otp.attempts++;
    return res.status(400).json({ error: 'Invalid OTP', attempts: otp.attempts });
  }
  
  otp.verified = true;
  otp.verifiedAt = new Date();
  
  res.json({
    success: true,
    phoneNumber,
    verified: true,
    message: 'OTP verified successfully',
  });
};

exports.getSMSLog = (req, res) => {
  const logs = Array.from(smsLog.values());
  res.json({
    success: true,
    total: logs.length,
    logs,
  });
};

module.exports = {
  sendSMS,
  sendOTP,
  verifyOTP,
  getSMSLog,
};
