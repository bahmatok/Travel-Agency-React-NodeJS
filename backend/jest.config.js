module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  collectCoverageFrom: [
    '**/*.js',                
    '!**/server.js',          
    '!**/upload.js',         
    '!**/coverage/**',       
    '!**/node_modules/**',
    '!**/jest.config.js',
    '!**/seed.js',
  ],
};