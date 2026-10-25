import express from 'express';
import { UserRepository, MapperService, EventEmitter, ColumnMapper, StateManager } from './controller.js';

const router = express.Router();
const userRepository = new UserRepository();
const mapperService = new MapperService();
const eventEmitter = new EventEmitter();
const columnMapper = new ColumnMapper();
const stateManager = new StateManager();

/**
 * Module Info
 */

router.get('/info', (req, res) => {
  res.json({
    module: '13.7 - Mapped & Template Literal Types',
    concepts: [
      'Mapped types: [K in keyof T]',
      'Template literal types: `get${Capitalize<K>}`',
      'Key remapping with as',
      'Conditional mapped properties',
      'Dynamic event names'
    ]
  });
});

/**
 * Mapped Type Transformations
 */

// POST /api/mapped/transform
router.post('/transform', (req, res) => {
  const { object, operation } = req.body;
  
  let result;
  
  if (operation === 'pick') {
    result = mapperService.pickFields(object, ['id', 'name']);
  } else if (operation === 'omit') {
    result = mapperService.omitFields(object, ['password']);
  } else if (operation === 'readonly') {
    result = mapperService.makeReadonly(object);
  } else if (operation === 'partial') {
    result = mapperService.makePartial(object);
  }
  
  res.json({
    ok: true,
    data: result,
    operation: operation,
    pattern: 'Mapped types: [K in keyof T]'
  });
});

/**
 * Template Literal Type Handlers
 */

// POST /api/mapped/get-property
router.post('/get-property', (req, res) => {
  const { object, property } = req.body;
  
  const getterName = 'get' + property.charAt(0).toUpperCase() + property.slice(1);
  const value = object[property];
  
  res.json({
    ok: true,
    data: {
      property: property,
      getter: getterName,
      value: value,
      pattern: 'Template literal: `get${Capitalize<K>}`'
    }
  });
});

// POST /api/mapped/create-handlers
router.post('/create-handlers', (req, res) => {
  const { object } = req.body;
  
  const handlers = {};
  
  for (const key in object) {
    handlers['get' + key.charAt(0).toUpperCase() + key.slice(1)] = () => object[key];
    handlers['set' + key.charAt(0).toUpperCase() + key.slice(1)] = (value) => { object[key] = value; };
  }
  
  res.json({
    ok: true,
    data: {
      generatedHandlers: Object.keys(handlers),
      pattern: 'Template literal event generators'
    }
  });
});

/**
 * Database Column Mapping
 */

// POST /api/mapped/map-columns
router.post('/map-columns', (req, res) => {
  const { dbRecord } = req.body;
  
  const mapped = columnMapper.mapToAPI(dbRecord);
  
  res.json({
    ok: true,
    data: {
      original: dbRecord,
      mapped: mapped,
      pattern: 'Mapped types for column transformation'
    }
  });
});

// GET /api/mapped/users?format=compact
router.get('/users', (req, res) => {
  const { format } = req.query;
  
  const users = userRepository.getAllUsers();
  
  let result = users;
  
  if (format === 'compact') {
    result = users.map(u => ({ id: u.id, name: u.name }));
  } else if (format === 'public') {
    result = users.map(u => {
      const { password, ...safe } = u;
      return safe;
    });
  }
  
  res.json({
    ok: true,
    data: result,
    format: format,
    pattern: 'Conditional mapped types'
  });
});

/**
 * Event Emission with Template Literals
 */

// POST /api/mapped/emit-event
router.post('/emit-event', (req, res) => {
  const { resource, action, data } = req.body;
  
  const eventName = resource + ':' + action;
  
  eventEmitter.emit(eventName, data);
  
  res.json({
    ok: true,
    data: {
      event: eventName,
      pattern: 'Template literal event names: `${resource}:${action}`',
      emitted: true
    }
  });
});

// POST /api/mapped/watch-event
router.post('/watch-event', (req, res) => {
  const { event } = req.body;
  
  const handler = () => {
    res.json({
      ok: true,
      event: event,
      fired: true
    });
  };
  
  eventEmitter.on(event, handler);
  
  res.json({
    ok: true,
    data: { watching: event }
  });
});

/**
 * State Mapper
 */

// POST /api/mapped/create-state
router.post('/create-state', (req, res) => {
  const { initialState } = req.body;
  
  const state = stateManager.createState(initialState);
  
  res.json({
    ok: true,
    data: {
      stateId: state.id,
      current: state.getValue(),
      pattern: 'Mapped state transformations'
    }
  });
});

// POST /api/mapped/update-state
router.post('/update-state', (req, res) => {
  const { stateId, updates } = req.body;
  
  const state = stateManager.getState(stateId);
  
  if (!state) {
    return res.status(404).json({
      ok: false,
      error: 'State not found'
    });
  }
  
  const updated = state.update(updates);
  
  res.json({
    ok: true,
    data: {
      stateId: stateId,
      updated: updated,
      current: state.getValue()
    }
  });
});

/**
 * Readonly & Partial Transformations
 */

// POST /api/mapped/make-readonly
router.post('/make-readonly', (req, res) => {
  const { object } = req.body;
  
  const readonly = mapperService.makeReadonly(object);
  
  res.json({
    ok: true,
    data: {
      original: object,
      readonly: readonly,
      pattern: 'Readonly<T> mapped type'
    }
  });
});

// POST /api/mapped/make-partial
router.post('/make-partial', (req, res) => {
  const { object } = req.body;
  
  const partial = mapperService.makePartial(object);
  
  res.json({
    ok: true,
    data: {
      original: object,
      partial: partial,
      pattern: 'Partial<T> mapped type'
    }
  });
});

export default router;
