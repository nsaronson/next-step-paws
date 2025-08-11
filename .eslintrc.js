module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn'
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'testing-library/no-wait-for-multiple-assertions': 'off',
        'testing-library/no-node-access': 'off',
      },
    },
    {
      files: ['src/setupTests.ts', 'src/utils/testUtils.ts'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-useless-constructor': 'off',
      },
    },
  ],
};
