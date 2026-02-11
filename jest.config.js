// Set NODE_CONFIG_ENV to test before loading config
process.env.NODE_CONFIG_ENV = 'test'
process.env.NODE_ENV = 'test'

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '/config/',
    '/docs/',
    '/shadcn/',
  ],
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/constants.{js,mjs}',
    '!**/*.config.{js,mjs}',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/config/**',
    '!**/docs/**',
    '!**/shadcn/**',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
