import js from '@eslint/js';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

const typescriptFiles = ['**/*.{ts,tsx,mts,cts}'];
const reactFiles = ['**/*.{jsx,tsx}'];
const appFiles = ['**/*.{js,jsx,ts,tsx}'];

const tsConfigs = tseslint.configs['flat/recommended'].map(config => ({
  ...config,
  files: config.files ?? typescriptFiles,
}));

const reactConfig = {
  files: reactFiles,
  plugins: {
    react,
  },
  languageOptions: {
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
  rules: {
    ...react.configs.flat.recommended.rules,
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

const reactHooksConfig = {
  files: reactFiles,
  plugins: {
    'react-hooks': reactHooks,
  },
  rules: reactHooks.configs.recommended.rules,
};

const jsxA11yConfig = {
  files: reactFiles,
  plugins: {
    'jsx-a11y': jsxA11y,
  },
  languageOptions: {
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
  rules: jsxA11y.configs.recommended.rules,
};

const nextConfig = {
  files: appFiles,
  plugins: {
    '@next/next': nextPlugin,
  },
  rules: nextPlugin.configs.recommended.rules,
};

export default [
  {
    ignores: [
      '.next/**',
      '.vercel/**',
      'node_modules/**',
      'dist/**',
      'out/**',
      'public/**',
      'coverage/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  ...tsConfigs,
  reactConfig,
  reactHooksConfig,
  jsxA11yConfig,
  nextConfig,
];
