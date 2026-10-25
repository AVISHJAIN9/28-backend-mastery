
// ==================== Decorator Pattern Controller ====================

const store = {
  items: {},
  counter: 1
};

const createItem = (data) => {
  try {
    const id = store.counter++;
    const item = {
      id,
      ...data,
      createdAt: new Date(),
      pattern: 'Decorator'
    };
    store.items[id] = item;
    return { success: true, id, item };
  } catch (error) {
    throw new Error('Failed to create item: ' + error.message);
  }
};

const getItems = () => {
  return {
    success: true,
    count: Object.keys(store.items).length,
    items: Object.values(store.items)
  };
};

const getItemById = (id) => {
  const item = store.items[id];
  if (!item) throw new Error('Item not found');
  return { success: true, item };
};

const updateItem = (id, data) => {
  const item = store.items[id];
  if (!item) throw new Error('Item not found');
  Object.assign(item, data, { updatedAt: new Date() });
  return { success: true, item };
};

const deleteItem = (id) => {
  if (!store.items[id]) throw new Error('Item not found');
  delete store.items[id];
  return { success: true, message: 'Item deleted' };
};

const getPatternInfo = () => {
  return {
    pattern: 'Decorator',
    description: 'Decorator pattern implementation',
    endpoints: ['/items', '/items/:id'],
    itemsCount: Object.keys(store.items).length
  };
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getPatternInfo
};
