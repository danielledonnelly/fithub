require('dotenv').config();

console.log('=== FITBIT ENVIRONMENT CHECK ===');
console.log('FITBIT_CLIENT_ID:', process.env.FITBIT_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('FITBIT_CLIENT_SECRET:', process.env.FITBIT_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('FITBIT_REDIRECT_URI:', process.env.FITBIT_REDIRECT_URI ? '✅ Set' : '❌ Missing');
console.log('===============================');

if (!process.env.FITBIT_CLIENT_ID || !process.env.FITBIT_CLIENT_SECRET || !process.env.FITBIT_REDIRECT_URI) {
  console.log('\n❌ Missing required Fitbit environment variables!');
  console.log('Add these to your .env file:');
  console.log('FITBIT_CLIENT_ID=your_client_id');
  console.log('FITBIT_CLIENT_SECRET=your_client_secret');
  console.log('FITBIT_REDIRECT_URI=http://localhost:5001/api/fitbit/callback');
} else {
  console.log('\n✅ All Fitbit environment variables are set!');
}
