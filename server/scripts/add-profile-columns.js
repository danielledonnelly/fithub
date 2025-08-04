// server/scripts/add-profile-columns.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function addProfileColumns() {
  try {
    // Create MySQL connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'fithub'
    });
    
    console.log('Connected to database');
    
    // Add profile columns to users table
    const alterQueries = [
      'ALTER TABLE users ADD COLUMN display_name VARCHAR(255) DEFAULT NULL',
      'ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL',
      'ALTER TABLE users ADD COLUMN avatar VARCHAR(10) DEFAULT NULL'
    ];
    
    for (const query of alterQueries) {
      try {
        await connection.execute(query);
        console.log(`Successfully executed: ${query}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column already exists, skipping: ${query}`);
        } else {
          throw error;
        }
      }
    }
    
    // Update existing users to have display_name = username
    await connection.execute(
      'UPDATE users SET display_name = username WHERE display_name IS NULL'
    );
    console.log('Updated existing users with display_name = username');
    
    await connection.end();
    console.log('Database migration completed successfully');
    
  } catch (error) {
    console.error('Database migration failed:', error.message);
  }
}

addProfileColumns(); 