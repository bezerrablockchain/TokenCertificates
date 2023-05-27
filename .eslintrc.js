// SPDX-FileCopyrightText: 2021 Toucan Labs
//
// SPDX-License-Identifier: LicenseRef-Proprietary

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
  },
  env: {
    mocha: true,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:diff/ci',
    'airbnb-base',
    'airbnb-typescript/base',
    'prettier',
  ],
  plugins: ['babel', '@typescript-eslint'],
  ignorePatterns: ['coverage'],
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        ts: 'never',
      },
    ],
    'no-underscore-dangle': 'off',
    'import/prefer-default-export': 'off',
    'prefer-destructuring': 'off',
    'prefer-template': 'off',
    'no-console': 'off',
    'func-names': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'no-await-in-loop': 'off',
    'no-continue': 'off',
    'no-plusplus': 'off',

    // Modify https://github.com/airbnb/javascript#iterators--nope to allow for..of loops
    // https://github.com/airbnb/javascript/blob/fd96a4fd57be26d4d9d2f2d24b373a2df7c23548/packages/eslint-config-airbnb-base/rules/style.js#L340
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
  },
};
