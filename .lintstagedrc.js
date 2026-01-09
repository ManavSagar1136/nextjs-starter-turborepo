module.exports = {
  // Format all code files with Prettier
  // ESLint is handled by turbo run lint in CI/pre-push
  "*.{js,jsx,ts,tsx}": ["prettier --write"],
  "*.{json,css,md,yml,yaml}": ["prettier --write"],
};
