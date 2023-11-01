module.exports = {
  overrides: [
    {
      files: ['*.js'],
      extends: [
        "eslint:recommended",
        "plugin:prettier/recommended"
      ],
      env: {
        node: true,
        mocha: true
      },
      parserOptions: {
        ecmaVersion: 12,
        sourceType: "module"
      }
    }
  ]
}
