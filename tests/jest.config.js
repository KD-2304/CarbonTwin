/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/tests/server/**/*.test.js'],
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 30000,
};
