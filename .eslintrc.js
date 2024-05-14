module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:react/recommended',
    'google'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      'jsx': true
    },
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'react',
    '@typescript-eslint'
  ],
  rules: {
    'linebreak-style': 'off',
    'valid-jsdoc': 'off',
    'react/prop-types': 'off',
    'comma-dangle': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'semi': [2, 'always'],
    'indent': ['error', 2],
    'max-len': ['error', {'code': 120}],
    'require-jsdoc': 'off',
    'quotes': ['error', 'single'],
    'import/no-unresolved': 'off',
    'no-trailing-spaces': 'off',
  }
}
