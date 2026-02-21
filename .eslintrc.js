module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    es6: true,
    jest: true,
    node: true,
  },
  globals: {
    module: false,
    require: false
  },
  rules: {
    'semi': ['error', 'never'],
    'curly': ['error', 'multi-line'],
    'object-curly-spacing': [ 'error', 'always' ],
    'dot-notation': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/semi': ['error', 'never'],
    '@typescript-eslint/no-unused-vars': 'off',
  },
}
