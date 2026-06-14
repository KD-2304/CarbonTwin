/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/tests/server/**/*.test.js'],
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 30000,
  moduleDirectories: ['node_modules', '<rootDir>/server/node_modules'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};

