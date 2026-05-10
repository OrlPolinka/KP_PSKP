module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/unit'],
  testMatch: ['**/*.test.js'],
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  setupFilesAfterEnv: ['<rootDir>/setup.js'],
  collectCoverageFrom: [
    'unit/**/*.js',
    '../backend/src/**/*.js',
    '!../backend/src/generated/**',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
