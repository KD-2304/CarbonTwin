const { z } = require('zod');
const path = require('path');

// Support loading env from local files if required (already loaded by dotenv in index.js)
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGO_URI: z.string({
    required_error: 'MONGO_URI is required'
  }).url('MONGO_URI must be a valid MongoDB connection URL'),
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET is required'
  }).min(8, 'JWT_SECRET must be at least 8 characters long'),
  GEMINI_API_KEY: z.string({
    required_error: 'GEMINI_API_KEY is required'
  }).min(1, 'GEMINI_API_KEY must not be empty'),
  CLIENT_URL: z.string().optional().default('http://localhost:5173')
});

// Run validation
let env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Configuration validation failed. Please check your environment settings:');
    error.errors.forEach(err => {
      console.error(`   • ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  } else {
    // In test environment, fallback gracefully to mock values if undefined
    env = {
      NODE_ENV: 'test',
      PORT: 5000,
      MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/carbon-twin-city-test',
      JWT_SECRET: process.env.JWT_SECRET || 'test_jwt_secret_key_for_carbon_twin_city',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'mock-api-key',
      CLIENT_URL: 'http://localhost:5173'
    };
  }
}

module.exports = env;
