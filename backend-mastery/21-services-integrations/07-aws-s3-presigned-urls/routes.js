const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { validateRequest } = require('./middleware');
const { bucketSchema, uploadSchema, downloadSchema, listSchema, deleteSchema } = require('./schema');

router.post('/bucket/create', validateRequest(bucketSchema), ctrl.createBucket);
router.post('/url/upload', validateRequest(uploadSchema), ctrl.getPresignedUploadUrl);
router.post('/url/download', validateRequest(downloadSchema), ctrl.getPresignedDownloadUrl);
router.post('/list', validateRequest(listSchema), ctrl.listObjects);
router.post('/delete', validateRequest(deleteSchema), ctrl.deleteObject);
router.post('/upload/simulate', validateRequest(uploadSchema), ctrl.simulateUpload);

module.exports = router;
