const mysql = require('mysql2/promise');

async function deleteTestUser() {
  try {
    // Create MySQL connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Connected to database');
    
    // Delete user with email test@example.com
    const [result] = await connection.execute(
      'DELETE FROM users WHERE email = ?',
      ['test@example.com']
    );
    
    if (result.affectedRows > 0) {
      console.log(`Successfully deleted user with email test@example.com`);
      console.log(`Rows affected: ${result.affectedRows}`);
    } else {
      console.log('No user found with email test@example.com');
    }
    
    await connection.end();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error deleting test user:', error.message);
  }
}

deleteTestUser(); 