const AuthService = require('../services/AuthService');
const UserModel = require('../models/User');
const {pool} = require('../db');

describe('Delete Test User', () => {
  afterAll(async () => {
    pool.end();
  });

  test('should delete test@example.com user', async () => {
    try {
      // First find the user by email
      const testUser = await UserModel.findByEmail('test@example.com');
      
      if (!testUser) {
        console.log('No test user found with email test@example.com');
        return;
      }
      
      // Delete using the service
      const result = await AuthService.deleteUser(testUser.id);
      
      console.log('Test user deleted successfully:', result);
    } catch (error) {
      console.error('Error deleting test user:', error.message);
    }
  });
});