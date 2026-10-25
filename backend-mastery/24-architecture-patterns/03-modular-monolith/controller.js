// ==================== USER MODULE ====================
let users = [
  { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin' },
  { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user' }
];
let userNextId = 3;

const userController = {
  getAllUsers: () => users,
  getUserById: (id) => users.find(u => u.id === id),
  createUser: (data) => {
    if (users.some(u => u.email === data.email)) throw new Error('Email exists');
    const user = { id: userNextId++, ...data, role: data.role || 'user' };
    users.push(user);
    return user;
  }
};

// ==================== ORDER MODULE ====================
let orders = [
  { id: 1, userId: 1, items: ['item1'], total: 100, status: 'completed' },
  { id: 2, userId: 2, items: ['item2'], total: 50, status: 'pending' }
];
let orderNextId = 3;

const orderController = {
  getAllOrders: () => orders,
  getOrderById: (id) => orders.find(o => o.id === id),
  createOrder: (data) => {
    if (!userController.getUserById(data.userId)) throw new Error('User not found');
    const order = { id: orderNextId++, ...data, status: 'pending', createdAt: new Date() };
    orders.push(order);
    return order;
  }
};

// ==================== PRODUCT MODULE ====================
let products = [
  { id: 1, name: 'Laptop', price: 999.99, stock: 10 },
  { id: 2, name: 'Mouse', price: 29.99, stock: 50 }
];
let productNextId = 3;

const productController = {
  getAllProducts: () => products,
  getProductById: (id) => products.find(p => p.id === id),
  createProduct: (data) => {
    const product = { id: productNextId++, ...data, createdAt: new Date() };
    products.push(product);
    return product;
  }
};

// ==================== PAYMENT MODULE ====================
const paymentController = {
  processPayment: (orderId, amount) => {
    const order = orderController.getOrderById(orderId);
    if (!order) throw new Error('Order not found');
    order.status = 'paid';
    return { success: true, orderId, amount, timestamp: new Date() };
  }
};

module.exports = {
  userController,
  orderController,
  productController,
  paymentController
};
