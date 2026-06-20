/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/tests/server/**/*.test.js'],
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^mongoose$': '<rootDir>/server/node_modules/mongoose',
    '^dotenv$': '<rootDir>/server/node_modules/dotenv',
    '^jsonwebtoken$': '<rootDir>/server/node_modules/jsonwebtoken',
    '^winston$': '<rootDir>/server/node_modules/winston'
  }
};



