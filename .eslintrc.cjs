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
        mocha: true,
        es6: true
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
      }
    }
  ]
}
