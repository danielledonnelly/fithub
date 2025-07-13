// server/models/User.js
const bcrypt = require('bcryptjs');

// In-memory storage (replace with database later)
let users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@fithub.com',
    // Pre-hashed "password" for testing
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    createdAt: new Date('2025-07-13T00:34:29.557Z')
  }
];

let nextId = 2;

class UserModel {
  // Create user
  static async createUser(userData) {
    const { username, email, password } = userData;
    
    // Check if user already exists
    if (this.findByEmail(email)) {
      throw new Error('User already exists');
    }
    
    // Hash password before storing (never store plain text)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = {
      id: nextId++,
      username,
      email: email.toLowerCase(), // Normalize email for consistency
      password: hashedPassword,
      createdAt: new Date()
    };
    
    users.push(user);
    return { ...user, password: undefined }; // Never return password to client
  }

  // Get user by ID
  static findById(id) {
    const user = users.find(u => u.id === id);
    return user ? { ...user, password: undefined } : null;
  }

  // Get user by email
  static findByEmail(email) {
    const user = users.find(u => u.email === email.toLowerCase());
    return user ? { ...user, password: undefined } : null;
  }

  // Update user
  static updateUser(id, updates) {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Merge existing user with updates (allows partial updates)
    users[userIndex] = { ...users[userIndex], ...updates };
    return { ...users[userIndex], password: undefined };
  }

  // Delete user
  static deleteUser(id) {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    return { ...deletedUser, password: undefined };
  }

  // Validate password (internal method used by AuthService)
  static async validatePassword(user, password) {
    const fullUser = users.find(u => u.id === user.id);
    if (!fullUser) return false;
    
    // Compare provided password with stored hash
    return bcrypt.compare(password, fullUser.password);
  }
}

module.exports = UserModel;