module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true, 
  setupFilesAfterEnv: ['./__tests__/setup.js'],
};