const mongoose = require('mongoose');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Load environment variables from the server directory
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_carbon_twin_city';

process.env.MONGOMS_VERSION = '4.4.29';
process.env.MONGOMS_MD5_CHECK = 'false';
process.env.MONGOMS_DOWNLOAD_DIR = path.join(__dirname, '../.mongodb-binaries');

let mongoServer;

beforeAll(async () => {
  if (process.env.DISABLE_MONGOMS === 'true') {
    console.log('🧪 MongoMemoryServer disabled. Using configured database...');
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/carbon-twin-city';
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri, {
      dbName: 'carbon-twin-city-test'
    });
    return;
  }

  try {
    // Attempt in-memory MongoDB with a 10s timeout to prevent test hanging
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('MongoMemoryServer download/startup timeout')), 10000);
    });

    mongoServer = await Promise.race([
      MongoMemoryServer.create(),
      timeoutPromise
    ]);
    clearTimeout(timeoutId);
    
    const uri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(uri);
    console.log('🧪 Using MongoMemoryServer for tests');
  } catch (err) {
    console.warn('⚠️ MongoMemoryServer initialization bypassed:', err.message);
    console.warn('🧪 Falling back to configured MongoDB database connection...');

    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/carbon-twin-city';
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(uri, {
      dbName: 'carbon-twin-city-test'
    });
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

