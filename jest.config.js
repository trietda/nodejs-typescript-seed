module.exports = {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      globals: {
        'ts-jest': {
          tsconfig: 'src/tsconfig.test.json',
        },
      },
      roots: [
        '<rootDir>/src'
      ],
      testMatch: [
        '**/src/**/*.(spec|test).ts',
      ],
      setupFilesAfterEnv: [
        'jest-extended',
      ],
    },
    {
      displayName: 'api',
      preset: 'ts-jest',
      testEnvironment: 'node',
      globals: {
        'ts-jest': {
          tsconfig: '__tests__/tsconfig.test.json',
        },
      },
      roots: [
        '<rootDir>/__tests__'
      ],
      testMatch: [
        '**/__tests__/**/*.(spec|test).ts',
      ],
      setupFilesAfterEnv: [
        'jest-extended',
        '<rootDir>/__tests__/setup.ts'
      ],
      verbose: false,
    },
  ],
};
