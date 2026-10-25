const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ServerError,
  asyncHandler
} = require('./middleware');

const items = {
  1: { id: 1, name: 'Item 1', value: 100 },
  2: { id: 2, name: 'Item 2', value: 200 }
};

class ErrorHandlingController {
  static async getItems(req, res) {
    return res.json({
      success: true,
      data: Object.values(items),
      count: Object.keys(items).length
    });
  }

  static async createItem(req, res) {
    const { name, value } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new ValidationError('Invalid request', [
        { field: 'name', message: 'Name is required and must be a non-empty string' }
      ]);
    }

    if (!value || typeof value !== 'number' || value <= 0) {
      throw new ValidationError('Invalid request', [
        { field: 'value', message: 'Value is required and must be a positive number' }
      ]);
    }

    const newItem = {
      id: Math.max(...Object.keys(items).map(k => parseInt(k))) + 1,
      name: name.trim(),
      value
    };

    items[newItem.id] = newItem;

    return res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: newItem
    });
  }

  static async getItem(req, res) {
    const { id } = req.params;

    if (!items[id]) {
      throw new NotFoundError(`Item with ID ${id}`);
    }

    return res.json({
      success: true,
      data: items[id]
    });
  }

  static async adminOnly(req, res) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    if (token !== 'valid-admin-token') {
      throw new AuthenticationError('Invalid token');
    }

    return res.json({
      success: true,
      message: 'Admin access granted',
      data: { role: 'admin' }
    });
  }

  static async restrictedAction(req, res) {
    const userRole = req.headers['x-user-role'] || 'user';

    if (userRole !== 'admin') {
      throw new AuthorizationError('Only admins can perform this action');
    }

    return res.json({
      success: true,
      message: 'Action performed successfully'
    });
  }

  static async simulateError(req, res) {
    try {
      throw new Error('Database connection failed');
    } catch (err) {
      throw new ServerError('Failed to process request', err);
    }
  }

  static async unhandledError(req, res) {
    throw new Error('This is an unhandled error');
  }

  static async asyncOperation(req, res) {
    const { delay, shouldFail } = req.body;

    if (shouldFail === true) {
      throw new AppError('Async operation failed', 400, 'OperationFailed');
    }

    await new Promise(resolve => setTimeout(resolve, delay || 1000));

    return res.json({
      success: true,
      message: 'Async operation completed',
      duration: delay || 1000
    });
  }
}

module.exports = ErrorHandlingController;
