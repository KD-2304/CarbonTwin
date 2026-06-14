const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from the server directory
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_carbon_twin_city';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/carbon-twin-city';
    await mongoose.connect(uri, {
      dbName: 'carbon-twin-city-test'
    });
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
