/**
 * MVC Pattern - Separation of Concerns
 * 
 * Model (Data), View (Presentation), Controller (Logic)
 */

// Model - Data and Business Logic
class Product {
  constructor(id, name, price, stock) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stock = stock;
  }

  isAvailable() {
    return this.stock > 0;
  }

  purchase(quantity) {
    if (quantity > this.stock) {
      throw new Error('Insufficient stock');
    }
    this.stock -= quantity;
  }
}

class ProductModel {
  constructor() {
    this.products = new Map();
  }

  add(product) {
    this.products.set(product.id, product);
  }

  getById(id) {
    return this.products.get(id);
  }

  getAll() {
    return Array.from(this.products.values());
  }
}

// View - Data Presentation
class ProductView {
  renderProduct(product) {
    return {
      id: product.id,
      name: product.name,
      price: `$${product.price}`,
      available: product.isAvailable(),
      stock: product.stock
    };
  }

  renderList(products) {
    return products.map(p => this.renderProduct(p));
  }
}

// Controller - Business Logic
class ProductController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  addProduct(id, name, price, stock) {
    const product = new Product(id, name, price, stock);
    this.model.add(product);
    console.log(`Added product: ${name}`);
  }

  purchaseProduct(productId, quantity) {
    const product = this.model.getById(productId);
    if (!product) throw new Error('Product not found');
    
    product.purchase(quantity);
    console.log(`Purchased ${quantity} of ${product.name}`);
  }

  getProductDetail(productId) {
    const product = this.model.getById(productId);
    return this.view.renderProduct(product);
  }

  listAllProducts() {
    const products = this.model.getAll();
    return this.view.renderList(products);
  }
}

// Usage
const model = new ProductModel();
const view = new ProductView();
const controller = new ProductController(model, view);

controller.addProduct(1, 'Laptop', 999.99, 5);
controller.addProduct(2, 'Mouse', 29.99, 20);

console.log('\nAll products:', controller.listAllProducts());
console.log('Product detail:', controller.getProductDetail(1));

controller.purchaseProduct(1, 2);
console.log('After purchase:', controller.getProductDetail(1));

module.exports = { Product, ProductModel, ProductView, ProductController };
