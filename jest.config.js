module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/services/**/*.test.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
