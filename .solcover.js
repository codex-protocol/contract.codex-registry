module.exports = {
  testCommand: '../node_modules/.bin/truffle test --network coverage',
  compileCommand: '../node_modules/.bin/truffle compile',
  skipFiles: [
    'Migrations.sol',
    'mocks',
  ]
}
