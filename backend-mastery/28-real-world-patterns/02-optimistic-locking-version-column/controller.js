const { logger } = require('./middleware');

// In-memory database with version control
const products = {
  1: {
    id: 1,
    name: 'Laptop',
    price: 999.99,
    description: 'High-performance gaming laptop',
    version: 1,  // Version field for optimistic locking
    updated_at: new Date('2024-01-15'),
    updated_by: 'admin'
  },
  2: {
    id: 2,
    name: 'Monitor',
    price: 299.99,
    description: '4K UltraHD Monitor',
    version: 2,
    updated_at: new Date('2024-02-10'),
    updated_by: 'user1'
  },
  3: {
    id: 3,
    name: 'Keyboard',
    price: 89.99,
    description: 'Mechanical RGB Keyboard',
    version: 1,
    updated_at: new Date('2024-01-20'),
    updated_by: 'admin'
  }
};

let nextId = 4;

// ============= SECURE ENDPOINTS (with optimistic locking) =============

// Get all products
const listProducts = (req, res) => {
  try {
    const productList = Object.values(products);
    logger.info('Listed products', { count: productList.length });
    res.json({
      success: true,
      data: productList,
      message: `Retrieved ${productList.length} products`
    });
  } catch (err) {
    logger.error('Error listing products', { error: err.message });
    res.status(500).json({ error: 'Failed to list products' });
  }
};

// Get single product
const getProduct = (req, res) => {
  try {
    const product = products[req.params.id];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    logger.info('Retrieved product', { productId: req.params.id, version: product.version });
    res.json({ success: true, data: product });
  } catch (err) {
    logger.error('Error retrieving product', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
};

// Create new product
const createProduct = (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    
    const newProduct = {
      id: nextId++,
      name,
      price,
      description: description || '',
      category: category || '',
      version: 1,  // Start at version 1
      created_at: new Date(),
      updated_at: new Date(),
      updated_by: 'system'
    };
    products[newProduct.id] = newProduct;
    
    logger.info('Product created', { productId: newProduct.id });
    res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Product created successfully'
    });
  } catch (err) {
    logger.error('Error creating product', { error: err.message });
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// ============= OPTIMISTIC LOCKING UPDATE =============

// Update product with version check
const updateProductSecure = (req, res) => {
  try {
    const product = products[req.params.id];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, price, description, currentVersion } = req.body;
    
    // OPTIMISTIC LOCKING: Check if version matches
    if (product.version !== currentVersion) {
      logger.warn('Version conflict detected', {
        productId: req.params.id,
        expectedVersion: product.version,
        receivedVersion: currentVersion
      });
      
      return res.status(409).json({
        error: 'Version conflict',
        message: 'Product was modified by another user',
        current: product,
        latestVersion: product.version,
        yourVersion: currentVersion,
        conflict: true
      });
    }

    // Update succeeded - increment version
    if (name) product.name = name;
    if (price) product.price = price;
    if (description !== undefined) product.description = description;
    
    product.version++;  // Increment version
    product.updated_at = new Date();
    product.updated_by = 'user'; // In real app, get from auth
    
    logger.info('Product updated successfully', {
      productId: req.params.id,
      newVersion: product.version
    });

    res.json({
      success: true,
      data: product,
      message: `Product updated. Version incremented to ${product.version}`,
      newVersion: product.version
    });
  } catch (err) {
    logger.error('Error updating product', { error: err.message });
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// ============= VULNERABLE ENDPOINT (without version check) =============

// Update without version check (VULNERABLE)
const updateProductVulnerable = (req, res) => {
  try {
    const product = products[req.params.id];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, price, description } = req.body;
    
    // VULNERABILITY: No version check!
    if (name) product.name = name;
    if (price) product.price = price;
    if (description !== undefined) product.description = description;
    product.updated_at = new Date();
    
    logger.warn('Product updated WITHOUT version check (VULNERABLE)', {
      productId: req.params.id
    });

    res.json({
      success: true,
      data: product,
      warning: 'Updated without version check (VULNERABLE - Lost update problem)',
      message: 'Product updated successfully'
    });
  } catch (err) {
    logger.error('Error updating product', { error: err.message });
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// ============= CONFLICT RESOLUTION & TESTING =============

// Simulate concurrent update - demonstrate conflict
const simulateConcurrentUpdate = (req, res) => {
  try {
    const product = products[req.params.id];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, price, currentVersion } = req.body;
    
    // Check version
    if (product.version !== currentVersion) {
      logger.info('Concurrent update conflict detected', {
        productId: req.params.id,
        serverVersion: product.version,
        clientVersion: currentVersion
      });

      const conflict = {
        success: false,
        error: 'Concurrent modification detected',
        serverVersion: product.version,
        clientVersion: currentVersion,
        proposedChanges: {
          name,
          price
        },
        currentData: product,
        message: 'Another client updated this product. Fetch latest version and retry.'
      };

      return res.status(409).json(conflict);
    }

    // No conflict - apply update
    if (name) product.name = name;
    if (price) product.price = price;
    product.version++;
    product.updated_at = new Date();

    logger.info('Concurrent update resolved', {
      productId: req.params.id,
      newVersion: product.version
    });

    res.json({
      success: true,
      data: product,
      message: 'Update applied successfully after version verification'
    });
  } catch (err) {
    logger.error('Error in concurrent update', { error: err.message });
    res.status(500).json({ error: 'Failed to process update' });
  }
};

// Get version history (shows version progression)
const getVersionHistory = (req, res) => {
  try {
    const product = products[req.params.id];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const history = {
      id: product.id,
      name: product.name,
      currentVersion: product.version,
      updated_at: product.updated_at,
      updated_by: product.updated_by,
      estimatedChanges: product.version - 1,  // Rough estimate
      message: `Product has been updated ${product.version - 1} times since creation`
    };

    logger.info('Retrieved version history', { productId: req.params.id });
    res.json({ success: true, data: history });
  } catch (err) {
    logger.error('Error retrieving version history', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve version history' });
  }
};

// Retry update with exponential backoff
const retryUpdate = (req, res) => {
  try {
    const product = products[req.params.id];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, price, maxRetries = 3 } = req.body;
    let currentVersion = product.version;
    let retries = 0;

    while (retries < maxRetries) {
      // Try to update with current version
      if (product.version === currentVersion) {
        if (name) product.name = name;
        if (price) product.price = price;
        product.version++;
        product.updated_at = new Date();

        logger.info('Retry update succeeded', {
          productId: req.params.id,
          attemptsNeeded: retries + 1,
          newVersion: product.version
        });

        return res.json({
          success: true,
          data: product,
          message: `Update succeeded after ${retries + 1} attempt(s)`,
          retriesUsed: retries
        });
      }

      // Version mismatch - get latest & retry
      currentVersion = product.version;
      retries++;
    }

    logger.warn('Retry update failed - max retries exceeded', {
      productId: req.params.id,
      retriesAttempted: maxRetries
    });

    res.status(409).json({
      error: 'Update failed',
      message: `Failed after ${maxRetries} retries. Product is too busy.`,
      currentVersion: product.version,
      retriesAttempted: maxRetries
    });
  } catch (err) {
    logger.error('Error in retry update', { error: err.message });
    res.status(500).json({ error: 'Failed to retry update' });
  }
};

// ============= TEST ENDPOINTS =============

// Reset a product's version for testing
const resetVersion = (req, res) => {
  try {
    const product = products[req.params.id];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const oldVersion = product.version;
    product.version = 1;
    product.updated_at = new Date();

    logger.info('Version reset for testing', {
      productId: req.params.id,
      oldVersion,
      newVersion: 1
    });

    res.json({
      success: true,
      data: product,
      message: `Version reset from ${oldVersion} to 1 (for testing)`
    });
  } catch (err) {
    logger.error('Error resetting version', { error: err.message });
    res.status(500).json({ error: 'Failed to reset version' });
  }
};

// Get products with high version numbers (actively edited)
const getMostEditedProducts = (req, res) => {
  try {
    const sorted = Object.values(products).sort((a, b) => b.version - a.version);
    
    logger.info('Retrieved most edited products', { count: sorted.length });
    res.json({
      success: true,
      data: sorted,
      message: 'Products sorted by number of updates (highest versions first)'
    });
  } catch (err) {
    logger.error('Error retrieving most edited products', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
};

module.exports = {
  // Secure endpoints
  listProducts,
  getProduct,
  createProduct,
  updateProductSecure,
  // Vulnerable endpoint
  updateProductVulnerable,
  // Concurrency testing
  simulateConcurrentUpdate,
  getVersionHistory,
  retryUpdate,
  resetVersion,
  getMostEditedProducts
};

