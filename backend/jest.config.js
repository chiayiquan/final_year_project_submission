module.exports = {
  testRegex: ["\\.spec\\.ts$"],
  moduleFileExtensions: ["js", "json", "jsx", "ts", "tsx", "node"],
  testEnvironment: "<rootDir>/test/testEnvironment.ts",
  preset: "ts-jest",
  setupFiles: ["<rootDir>/test/setup.js"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
};
