const {pool} = require('./db');

async function checkSchema() {
  try {
    const [rows] = await pool.query('SHOW COLUMNS FROM steps');
    console.log('Columns in steps table:');
    rows.forEach(row => {
      console.log(`- ${row.Field} (${row.Type})`);
    });
    
    // Check if steps column exists
    const hasStepsColumn = rows.some(row => row.Field === 'steps');
    console.log(`\nSteps column exists: ${hasStepsColumn}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();

