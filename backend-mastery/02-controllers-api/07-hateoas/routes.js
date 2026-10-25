const express = require('express');
const HateoasController = require('./controller');
const { validateCreateRequest, validateUpdateRequest, validateResourceId } = require('./middleware');

const router = express.Router();

router.get('/', (req, res) => HateoasController.list(req, res));
router.post('/', validateCreateRequest, (req, res) => HateoasController.create(req, res));
router.get('/:id', validateResourceId, (req, res) => HateoasController.get(req, res));
router.put('/:id', validateResourceId, validateUpdateRequest, (req, res) => HateoasController.update(req, res));
router.delete('/:id', validateResourceId, (req, res) => HateoasController.delete(req, res));
router.get('/:id/actions', validateResourceId, (req, res) => HateoasController.getActions(req, res));

module.exports = router;
