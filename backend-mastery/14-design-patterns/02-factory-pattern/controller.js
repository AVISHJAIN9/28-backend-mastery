// ==================== Vehicle Factory ====================

class Vehicle {
  constructor(brand, model, year) {
    this.brand = brand;
    this.model = model;
    this.year = year;
    this.createdAt = new Date();
  }
  describe() {
    return `${this.year} ${this.brand} ${this.model}`;
  }
}

class Car extends Vehicle {
  constructor(brand, model, year) {
    super(brand, model, year);
    this.type = 'car';
    this.doors = 4;
    this.fuelType = 'gasoline';
  }
  describe() {
    return `${super.describe()} - Car (${this.doors} doors)`;
  }
}

class Bike extends Vehicle {
  constructor(brand, model, year) {
    super(brand, model, year);
    this.type = 'bike';
    this.gears = 6;
    this.engineSize = 500;
  }
  describe() {
    return `${super.describe()} - Bike (${this.engineSize}cc, ${this.gears} gears)`;
  }
}

class Truck extends Vehicle {
  constructor(brand, model, year) {
    super(brand, model, year);
    this.type = 'truck';
    this.capacity = 5000;
    this.axles = 2;
  }
  describe() {
    return `${super.describe()} - Truck (${this.capacity}kg capacity)`;
  }
}

class VehicleFactory {
  static create(type, { brand, model, year }) {
    const vehicleTypes = {
      car: () => new Car(brand, model, year),
      bike: () => new Bike(brand, model, year),
      truck: () => new Truck(brand, model, year)
    };

    if (!vehicleTypes[type]) {
      throw new Error(`Unknown vehicle type: ${type}`);
    }

    return vehicleTypes[type]();
  }

  static getAvailableTypes() {
    return ['car', 'bike', 'truck'];
  }
}

// ==================== Notification Factory ====================

class Notification {
  constructor(recipient, message) {
    this.recipient = recipient;
    this.message = message;
    this.sentAt = null;
    this.status = 'pending';
  }
  send() {
    this.sentAt = new Date();
    this.status = 'sent';
    return { success: true, timestamp: this.sentAt };
  }
}

class EmailNotification extends Notification {
  constructor(recipient, message, subject) {
    super(recipient, message);
    this.type = 'email';
    this.subject = subject;
  }
  send() {
    console.log(`Email sent to ${this.recipient}: ${this.subject}`);
    return super.send();
  }
}

class SMSNotification extends Notification {
  constructor(recipient, message) {
    super(recipient, message);
    this.type = 'sms';
    this.maxLength = 160;
  }
  send() {
    if (this.message.length > this.maxLength) {
      console.warn('SMS message truncated to 160 characters');
    }
    console.log(`SMS sent to ${this.recipient}: ${this.message}`);
    return super.send();
  }
}

class PushNotification extends Notification {
  constructor(recipient, message, title) {
    super(recipient, message);
    this.type = 'push';
    this.title = title;
  }
  send() {
    console.log(`Push to ${this.recipient}: ${this.title}`);
    return super.send();
  }
}

class NotificationFactory {
  static create(type, { recipient, message, subject, title }) {
    const notificationTypes = {
      email: () => new EmailNotification(recipient, message, subject || 'Notification'),
      sms: () => new SMSNotification(recipient, message),
      push: () => new PushNotification(recipient, message, title || 'Notification')
    };

    if (!notificationTypes[type]) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    return notificationTypes[type]();
  }

  static getAvailableTypes() {
    return ['email', 'sms', 'push'];
  }
}

// ==================== Logger Factory ====================

class Logger {
  constructor() {
    this.logs = [];
  }
  log(level, message) {
    const entry = { level, message, timestamp: new Date() };
    this.logs.push(entry);
    return entry;
  }
}

class ConsoleLogger extends Logger {
  constructor() {
    super();
    this.type = 'console';
  }
  log(level, message) {
    const entry = super.log(level, message);
    console.log(`[${level.toUpperCase()}] ${message}`);
    return entry;
  }
}

class FileLogger extends Logger {
  constructor(filename) {
    super();
    this.type = 'file';
    this.filename = filename || 'app.log';
  }
  log(level, message) {
    const entry = super.log(level, message);
    console.log(`[FILE] Written to ${this.filename}: [${level}] ${message}`);
    return entry;
  }
}

class DatabaseLogger extends Logger {
  constructor(database) {
    super();
    this.type = 'database';
    this.database = database || 'logs_db';
  }
  log(level, message) {
    const entry = super.log(level, message);
    console.log(`[DB] Saved to ${this.database}: [${level}] ${message}`);
    return entry;
  }
}

class LoggerFactory {
  static create(type, config = {}) {
    const loggerTypes = {
      console: () => new ConsoleLogger(),
      file: () => new FileLogger(config.filename),
      database: () => new DatabaseLogger(config.database)
    };

    if (!loggerTypes[type]) {
      throw new Error(`Unknown logger type: ${type}`);
    }

    return loggerTypes[type]();
  }

  static getAvailableTypes() {
    return ['console', 'file', 'database'];
  }
}

// ==================== Controller Functions ====================

const vehicles = {};
let vehicleCounter = 1;

const createVehicle = (data) => {
  try {
    const vehicle = VehicleFactory.create(data.type, data);
    const id = vehicleCounter++;
    vehicles[id] = vehicle;
    return {
      success: true,
      id,
      vehicle: {
        id,
        type: vehicle.type,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        description: vehicle.describe(),
        createdAt: vehicle.createdAt
      }
    };
  } catch (error) {
    throw new Error(`Failed to create vehicle: ${error.message}`);
  }
};

const getVehicles = () => {
  return {
    success: true,
    count: Object.keys(vehicles).length,
    vehicles: Object.entries(vehicles).map(([id, vehicle]) => ({
      id,
      type: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      description: vehicle.describe()
    }))
  };
};

const sendNotification = (data) => {
  try {
    const notification = NotificationFactory.create(data.type, data);
    const result = notification.send();
    return {
      success: true,
      type: notification.type,
      recipient: notification.recipient,
      status: notification.status,
      sentAt: result.timestamp
    };
  } catch (error) {
    throw new Error(`Failed to send notification: ${error.message}`);
  }
};

const createLogger = (data) => {
  try {
    const logger = LoggerFactory.create(data.type, data.config || {});
    const testLog = logger.log('info', `Logger created: ${data.type} logger initialized`);
    return {
      success: true,
      type: logger.type,
      config: data.config,
      status: 'active',
      testLog
    };
  } catch (error) {
    throw new Error(`Failed to create logger: ${error.message}`);
  }
};

const getFactoryInfo = () => {
  return {
    factories: {
      vehicles: {
        types: VehicleFactory.getAvailableTypes(),
        description: 'Creates different vehicle types (cars, bikes, trucks)'
      },
      notifications: {
        types: NotificationFactory.getAvailableTypes(),
        description: 'Creates different notification channels (email, SMS, push)'
      },
      loggers: {
        types: LoggerFactory.getAvailableTypes(),
        description: 'Creates different logger types (console, file, database)'
      }
    },
    pattern: 'Factory Pattern',
    description: 'Encapsulates object creation logic for different types'
  };
};

module.exports = {
  createVehicle,
  getVehicles,
  sendNotification,
  createLogger,
  getFactoryInfo,
  VehicleFactory,
  NotificationFactory,
  LoggerFactory
};
