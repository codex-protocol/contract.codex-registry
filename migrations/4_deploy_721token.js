const CodexRecord = artifacts.require('./CodexRecord.sol')

module.exports = (deployer) => {
  deployer.deploy(CodexRecord)
}
