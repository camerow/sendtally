module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/{app,components,features,lib}/**/*.test.{ts,tsx}"],
};
