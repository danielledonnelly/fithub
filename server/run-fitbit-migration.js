const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fithub'
  });

  try {
    console.log('Running Fitbit migration...');
    
    // Direct SQL statements to add Fitbit fields
    const statements = [
      'ALTER TABLE users ADD COLUMN fitbit_access_token TEXT NULL',
      'ALTER TABLE users ADD COLUMN fitbit_refresh_token TEXT NULL',
      'ALTER TABLE users ADD COLUMN fitbit_token_expiry TIMESTAMP NULL',
      'ALTER TABLE users ADD COLUMN fitbit_connected BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN fitbit_connected_at TIMESTAMP NULL',
      'ALTER TABLE users ADD COLUMN fitbit_last_sync TIMESTAMP NULL',
      'CREATE INDEX idx_users_fitbit_connected ON users(fitbit_connected)'
    ];
    
    for (const statement of statements) {
      try {
        console.log('Executing:', statement);
        await connection.execute(statement);
        console.log('✅ Success');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️  Field already exists, skipping...');
        } else if (error.code === 'ER_DUP_KEYNAME') {
          console.log('⚠️  Index already exists, skipping...');
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Fitbit migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await connection.end();
  }
}

runMigration();
