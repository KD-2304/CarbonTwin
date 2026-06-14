const mongoose = require('mongoose');

// Configure test database
process.env.MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/carbon-twin-city-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_carbon_twin_city';
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
