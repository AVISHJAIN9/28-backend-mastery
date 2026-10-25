// ==================== Saga Pattern - Distributed Transactions ====================
// Orchestrates multiple services via compensating transactions

let users = [];
let nextId = 1;
let transactionLog = [];

// ==================== Saga Orchestrator ====================

class CreateUserSaga {
  constructor(userData) {
    this.userData = userData;
    this.sagaId = Math.random().toString(36).substr(2, 9);
    this.steps = [];
    this.status = 'PENDING';
  }

  async execute() {
    try {
      this.logStep('SAGA_STARTED', 'Starting');
      
      // Step 1: Create user
      await this.stepCreateUser();
      this.logStep('USER_CREATED', 'User created in system');
      
      // Step 2: Validate email
      await this.stepValidateEmail();
      this.logStep('EMAIL_VALIDATED', 'Email validation passed');
      
      // Step 3: Send notification
      await this.stepSendNotification();
      this.logStep('NOTIFICATION_SENT', 'Welcome email sent');
      
      this.status = 'SUCCESS';
      this.logStep('SAGA_COMPLETED', 'All steps completed');
      return users[users.length - 1];
    } catch (error) {
      this.status = 'FAILED';
      await this.compensate();
      throw error;
    }
  }

  async stepCreateUser() {
    if (!this.userData.name || !this.userData.email) {
      throw new Error('Name and email required');
    }
    const newUser = {
      id: nextId++,
      name: this.userData.name,
      email: this.userData.email,
      role: this.userData.role || 'user',
      status: 'active',
      createdAt: new Date()
    };
    users.push(newUser);
    this.userId = newUser.id;
  }

  async stepValidateEmail() {
    // Simulate external service call
    if (!this.userData.email.includes('@')) {
      throw new Error('Invalid email format');
    }
  }

  async stepSendNotification() {
    // Simulate notification service
    console.log(`[Notification] Welcome email sent to ${this.userData.email}`);
  }

  async compensate() {
    if (this.userId) {
      users = users.filter(u => u.id !== this.userId);
      this.logStep('COMPENSATION', 'User removed due to saga failure');
    }
  }

  logStep(step, description) {
    this.steps.push({ step, description, timestamp: new Date() });
    transactionLog.push({
      sagaId: this.sagaId,
      step,
      description,
      timestamp: new Date()
    });
  }
}

// ==================== Business Logic ====================

const getAllUsers = () => {
  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status
  }));
};

const getUserById = (id) => {
  return users.find(u => u.id === id) || null;
};

const createUserWithSaga = async (userData) => {
  const saga = new CreateUserSaga(userData);
  return await saga.execute();
};

const updateUser = (id, updates) => {
  const user = users.find(u => u.id === id);
  if (!user) return null;
  Object.assign(user, updates);
  return user;
};

const deleteUser = (id) => {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
};

const getTransactionLog = () => {
  return transactionLog;
};

// ==================== Exports ====================

module.exports = {
  getAllUsers,
  getUserById,
  createUserWithSaga,
  updateUser,
  deleteUser,
  getTransactionLog,
  _resetData: () => {
    users = [];
    nextId = 1;
    transactionLog = [];
  }
};

