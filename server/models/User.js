const bcrypt = require('bcryptjs');

// Simple in-memory user storage (replace with database in production)
class UserService {
  constructor() {
    this.users = [
      // Default admin user for testing
      {
        id: 1,
        username: 'admin',
        email: 'admin@fithub.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'password'
        createdAt: new Date(),
      }
    ];
    this.nextId = 2;
  }

  // Find user by email
  findByEmail(email) {
    return this.users.find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  // Find user by username
  findByUsername(username) {
    return this.users.find(user => user.username.toLowerCase() === username.toLowerCase());
  }

  // Find user by ID
  findById(id) {
    return this.users.find(user => user.id === parseInt(id));
  }

  // Create new user
  async createUser(userData) {
    const { username, email, password } = userData;

    // Check if user already exists
    if (this.findByEmail(email)) {
      throw new Error('User with this email already exists');
    }

    if (this.findByUsername(username)) {
      throw new Error('Username already taken');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = {
      id: this.nextId++,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
    };

    this.users.push(newUser);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  // Validate user password
  async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }

  // Get all users (admin only)
  getAllUsers() {
    return this.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  // Update user
  updateUser(id, updates) {
    const userIndex = this.users.findIndex(user => user.id === parseInt(id));
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Don't allow updating password directly (use separate method)
    const { password, ...allowedUpdates } = updates;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...allowedUpdates,
      updatedAt: new Date()
    };

    const { password: _, ...userWithoutPassword } = this.users[userIndex];
    return userWithoutPassword;
  }

  // Delete user
  deleteUser(id) {
    const userIndex = this.users.findIndex(user => user.id === parseInt(id));
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    this.users.splice(userIndex, 1);
    return true;
  }
}

// Export singleton instance
module.exports = new UserService(); 