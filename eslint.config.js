// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  // Global ignores — these files are never linted
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '*.config.js'],
  },

  // JavaScript recommended rules
  js.configs.recommended,

  // TypeScript recommended rules (includes TS parser)
  ...tseslint.configs.recommended,

  // Turn off all ESLint rules that conflict with Prettier
  // (Prettier handles formatting, ESLint handles logic)
  prettier,

  // Our custom rules for GoBasket
  {
    files: ['**/*.ts'],
    rules: {
      // Allow unused vars if prefixed with _ (common for ignored params)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Allow explicit any in some cases (will tighten later)
      '@typescript-eslint/no-explicit-any': 'warn',

      // Don't require return type on every function (TypeScript infers it)
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow empty interfaces (common for extending types)
      '@typescript-eslint/no-empty-object-type': 'off',

      // Prefer const over let when not reassigned
      'prefer-const': 'error',

      // No console.log in production code (use the logger)
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  }
)
