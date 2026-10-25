const express = require('express');
const router = express.Router();
const ctrl = require('./controller');
const { validateRequest } = require('./middleware');
const { uploadSchema, transformSchema, deleteSchema, listSchema } = require('./schema');

router.post('/upload', validateRequest(uploadSchema), ctrl.uploadImage);
router.post('/transform', validateRequest(transformSchema), ctrl.transformImage);
router.post('/delete', validateRequest(deleteSchema), ctrl.deleteImage);
router.post('/list', validateRequest(listSchema), ctrl.listImages);

module.exports = router;
