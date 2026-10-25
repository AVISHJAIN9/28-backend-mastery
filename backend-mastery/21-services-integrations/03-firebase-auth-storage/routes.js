const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { verifyIdToken, validateRequest } = require('./middleware');
const { userRegistrationSchema, userLoginSchema, profileUpdateSchema, documentSchema, fileUploadSchema } = require('./schema');

// ==================== Auth Routes (Public) ====================

router.post('/auth/register', validateRequest(userRegistrationSchema), controller.register);
router.post('/auth/login', validateRequest(userLoginSchema), controller.login);
router.post('/auth/logout', controller.logout);

// ==================== Middleware: Verify Token for Protected Routes ====================

router.use(verifyIdToken);

// ==================== Profile Routes (Protected) ====================

router.get('/profile', controller.getProfile);
router.put('/profile', validateRequest(profileUpdateSchema), controller.updateProfile);

// ==================== Document Routes (Protected) ====================

router.post('/documents', validateRequest(documentSchema), controller.createDocument);
router.get('/documents', controller.listDocuments);
router.get('/documents/:docId', controller.getDocument);
router.put('/documents/:docId', validateRequest(documentSchema), controller.updateDocument);
router.delete('/documents/:docId', controller.deleteDocument);

// ==================== File Storage Routes (Protected) ====================

router.post('/files/upload', validateRequest(fileUploadSchema), controller.uploadFile);
router.get('/files', controller.listFiles);
router.delete('/files/:fileId', controller.deleteFile);

module.exports = router;
