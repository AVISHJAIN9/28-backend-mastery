const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { validateRequest, authMiddleware } = require('./middleware');
const { databaseSchema, storageSchema, realtimeSchema } = require('./schema');

router.use(authMiddleware);

router.post('/db/insert', validateRequest(databaseSchema), ctrl.createRecord);
router.get('/db/:table', ctrl.readRecords);
router.put('/db/:table/:id', validateRequest(databaseSchema), ctrl.updateRecord);
router.delete('/db/:table/:id', ctrl.deleteRecord);

router.post('/storage/upload', validateRequest(storageSchema), ctrl.uploadFile);
router.get('/storage/files', ctrl.listFiles);
router.delete('/storage/:fileId', ctrl.deleteFile);

router.post('/realtime/:channel/subscribe', ctrl.subscribe);
router.post('/realtime/:channel/publish', validateRequest(realtimeSchema), ctrl.publish);

module.exports = router;
